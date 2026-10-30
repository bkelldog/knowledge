// Draws ```plot code blocks as static SVG when Quartz builds the site, the way
// the Quick Plot plugin draws them in Obsidian. Replaces each block's mdast
// `code` node with raw HTML, which Quartz passes through to the page.

import { visit } from "unist-util-visit"
import { renderPlot } from "./index.ts"

interface CodeNode {
  type: string
  lang?: string | null
  value: string
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

export function plotHtml(source: string): { html: string; error: string | null } {
  const result = renderPlot(source)
  if (!result.ok) {
    const caret = result.detail ? `<pre>${esc(result.detail.text)}\n${" ".repeat(result.detail.position)}^</pre>` : ""
    const message = `Line ${result.line}: ${result.message}`
    return {
      html: `<div class="quick-plot"><div class="quick-plot-error"><div>${esc(message)}</div>${caret}</div></div>`,
      error: message,
    }
  }
  // Notes are hints for the writer (how loose input was read), so they show in
  // Obsidian but not on the published page.
  return { html: `<div class="quick-plot">${result.svg}</div>`, error: null }
}

export function remarkQuickPlot() {
  return (tree: any, file: any) => {
    visit(tree, "code", (node: CodeNode) => {
      if (node.lang !== "plot") return
      const { html, error } = plotHtml(node.value)
      if (error) console.warn(`Quick Plot: ${file.data?.slug ?? file.path}: ${error}`)
      const replaced = node as unknown as { type: string; value: string; lang?: unknown; meta?: unknown }
      replaced.type = "html"
      replaced.value = html
      delete replaced.lang
      delete replaced.meta
    })
  }
}
