// Local live preview of the knowledge base, mirroring the CI build in
// .github/workflows/build_and_deploy.yml.
//
//   node .quartz-config/dev.mjs
//
// Clones Quartz (at the commit in QUARTZ_REF) into a sibling folder outside the
// vault, copies the overrides in .quartz-config/ over it, then serves the vault
// at http://localhost:8080. Edits to notes or to anything in .quartz-config/
// trigger a rebuild and browser refresh.
//
// Set QUARTZ_DIR to put the Quartz checkout somewhere else.

import { execSync, spawn } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const CONFIG_DIR = path.dirname(fileURLToPath(import.meta.url))
const VAULT_DIR = path.dirname(CONFIG_DIR)
const QUARTZ_DIR = path.resolve(process.env.QUARTZ_DIR ?? path.join(VAULT_DIR, "..", "quartz-kb"))
const QUARTZ_REPO = "https://github.com/jackyzha0/quartz.git"
const QUARTZ_REF = fs.readFileSync(path.join(CONFIG_DIR, "QUARTZ_REF"), "utf8").trim()

// .quartz-config/<from> is copied to <quartz>/<to>. Keep in sync with the workflow.
const OVERRIDES = [
  { from: "quartz.config.yaml", to: "quartz.config.yaml" },
  { from: "quartz.ts", to: "quartz.ts" },
  { from: "components", to: "quartz/components/custom" },
  { from: "styles", to: "quartz/styles" },
  { from: "static", to: "quartz/static" },
]

const run = (cmd, cwd = QUARTZ_DIR) => execSync(cmd, { cwd, stdio: "inherit" })

function checkoutQuartz() {
  if (!fs.existsSync(path.join(QUARTZ_DIR, ".git"))) {
    fs.mkdirSync(QUARTZ_DIR, { recursive: true })
    run(`git init -q`)
    run(`git remote add origin ${QUARTZ_REPO}`)
  }
  let head = ""
  try {
    head = execSync("git rev-parse HEAD", { cwd: QUARTZ_DIR, stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim()
  } catch {}
  if (head !== QUARTZ_REF) {
    console.log(`Checking out Quartz ${QUARTZ_REF.slice(0, 7)} into ${QUARTZ_DIR}`)
    run(`git fetch -q --depth 1 origin ${QUARTZ_REF}`)
    run(`git checkout -q -f FETCH_HEAD`)
    run(`npm ci`)
  } else if (!fs.existsSync(path.join(QUARTZ_DIR, "node_modules"))) {
    run(`npm ci`)
  }
}

// fs.rmSync fails with EPERM on Windows when it meets read-only files, which is
// what git makes its object files. Clear the flag first. Links (junctions) are
// not followed, so their targets are left alone.
function removeDir(dir) {
  const makeWritable = (d) => {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, entry.name)
      if (entry.isDirectory()) makeWritable(p)
      else if (entry.isFile()) fs.chmodSync(p, 0o666)
    }
  }
  if (!fs.existsSync(dir)) return
  makeWritable(dir)
  fs.rmSync(dir, { recursive: true, force: true })
}

// Quartz's plugin loader links plugin peer deps with a plain directory symlink,
// which Windows refuses without admin rights or Developer Mode (EPERM). Its CLI
// helper already falls back to a junction; give the loader the same treatment.
// The patch is built from the pristine file in git each run, so it is applied
// exactly once and survives `git checkout -f`.
function patchWindowsSymlinks() {
  if (process.platform !== "win32") return
  const loaderPath = "quartz/plugins/loader/gitLoader.ts"
  const loader = path.join(QUARTZ_DIR, loaderPath)
  const original = `fs.symlinkSync(target, linkPath, "dir")`
  const patched =
    `process.platform === "win32" ` +
    `? fs.symlinkSync(path.resolve(path.dirname(linkPath), target), linkPath, "junction") ` +
    `: fs.symlinkSync(target, linkPath, "dir")`
  const pristine = execSync(`git show HEAD:${loaderPath}`, { cwd: QUARTZ_DIR }).toString()
  const wanted = pristine.replace(original, patched)
  const current = fs.readFileSync(loader, "utf8")
  if (current === wanted) return
  // Upstream never uses junctions here, so one present means an earlier patch
  // already ran and the installed plugins are fine; only the text needs fixing.
  if (!current.includes(`"junction"`)) {
    // Plugins installed before the patch are missing their links and would be
    // skipped as "already installed", so reinstall them along with the transpile
    // cache. Clear them before patching so a failure here is retried next run.
    removeDir(path.join(QUARTZ_DIR, ".quartz", "plugins"))
    removeDir(path.join(QUARTZ_DIR, "quartz", ".quartz-cache"))
    console.log("Patched Quartz plugin loader for Windows symlinks")
  }
  fs.writeFileSync(loader, wanted)
}

// `quartz plugin install` skips any plugin folder that already exists, even if
// an interrupted install never built it. Remove unbuilt ones so they're redone.
function removeBrokenPlugins() {
  const pluginsDir = path.join(QUARTZ_DIR, ".quartz", "plugins")
  if (!fs.existsSync(pluginsDir)) return
  for (const entry of fs.readdirSync(pluginsDir, { withFileTypes: true })) {
    const dir = path.join(pluginsDir, entry.name)
    if (!entry.isDirectory() || fs.existsSync(path.join(dir, "dist"))) continue
    console.log(`Reinstalling incomplete plugin: ${entry.name}`)
    removeDir(dir)
  }
}

function copyOverride({ from, to }) {
  const src = path.join(CONFIG_DIR, from)
  if (!fs.existsSync(src)) return
  fs.cpSync(src, path.join(QUARTZ_DIR, to), { recursive: true })
}

function watchOverrides() {
  let timer = null
  fs.watch(CONFIG_DIR, { recursive: true }, (_event, file) => {
    if (!file) return
    const override = OVERRIDES.find(({ from }) => file === from || file.startsWith(from + path.sep))
    if (!override) return
    clearTimeout(timer)
    timer = setTimeout(() => {
      console.log(`Override changed: ${file}`)
      copyOverride(override)
    }, 100)
  })
}

const [major] = process.versions.node.split(".").map(Number)
if (major < 22) {
  console.error(`Quartz needs Node 22 or newer (you have ${process.version}).`)
  process.exit(1)
}

checkoutQuartz()
patchWindowsSymlinks()
removeBrokenPlugins()
OVERRIDES.forEach(copyOverride)
run(`npx quartz plugin install`)
watchOverrides()

// Quartz joins content paths with "/" and finds no pages when given a
// backslashed Windows path, so hand it forward slashes.
const contentDir = VAULT_DIR.split(path.sep).join("/")
spawn(`npx quartz build --serve -d "${contentDir}"`, {
  cwd: QUARTZ_DIR,
  stdio: "inherit",
  shell: true,
}).on("exit", (code) => process.exit(code ?? 0))
