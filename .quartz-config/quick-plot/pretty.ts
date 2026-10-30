// Turns a tree back into readable math (x²·x, sin(2x), e⁻ᵗ), so the plot can
// show how its input was read.

import type { Node } from "./ast.ts"
import { GREEK } from "./builtins.ts"

const SUPER: Record<string, string> = {
  "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹",
  "-": "⁻", "+": "⁺", n: "ⁿ", x: "ˣ", t: "ᵗ", i: "ⁱ", ".": "·",
}

const SUB: Record<string, string> = {
  "0": "₀", "1": "₁", "2": "₂", "3": "₃", "4": "₄", "5": "₅", "6": "₆", "7": "₇", "8": "₈", "9": "₉",
  a: "ₐ", e: "ₑ", h: "ₕ", i: "ᵢ", j: "ⱼ", k: "ₖ", l: "ₗ", m: "ₘ", n: "ₙ", o: "ₒ", p: "ₚ",
  r: "ᵣ", s: "ₛ", t: "ₜ", u: "ᵤ", v: "ᵥ", x: "ₓ",
}

/** ω for omega, ω₀ for omega_0, V_L for V_L (no subscript capital letters). */
function prettyName(name: string): string {
  if (name === "pi") return "π"
  const [base, sub] = name.split("_")
  const symbol = GREEK[base] ?? base
  if (!sub) return symbol
  const lowered = [...sub].every((ch) => ch in SUB)
  return lowered ? symbol + [...sub].map((ch) => SUB[ch]).join("") : `${symbol}_${sub}`
}

// Binding strength, for deciding where parentheses are needed.
const SUM = 1
const PRODUCT = 2
const UNARY = 3
const POWER = 4
const ATOM = 5

function precedence(node: Node): number {
  switch (node.kind) {
    case "binary":
      return node.op === "+" || node.op === "-" ? SUM : node.op === "^" ? POWER : PRODUCT
    case "unary":
      return UNARY
    case "number":
      return node.value < 0 ? UNARY : ATOM
    default:
      return ATOM
  }
}

function formatNumber(value: number): string {
  if (Number.isInteger(value)) return String(value)
  return String(Number(value.toPrecision(6)))
}

const wrap = (text: string, needed: boolean) => (needed ? `(${text})` : text)

/** Superscript form, if every character has one. */
function superscript(text: string): string | null {
  let out = ""
  for (const ch of text) {
    if (!(ch in SUPER)) return null
    out += SUPER[ch]
  }
  return out
}

export function pretty(node: Node): string {
  switch (node.kind) {
    case "number":
      return formatNumber(node.value).replace("-", "−")
    case "constant":
    case "variable":
      return prettyName(node.name)
    case "unary":
      return `−${wrap(pretty(node.arg), precedence(node.arg) < UNARY)}`
    case "call":
      if (node.name === "abs") return `|${pretty(node.args[0])}|`
      return `${node.name}(${node.args.map(pretty).join(", ")})`
    case "binary":
      return prettyBinary(node)
  }
}

function prettyBinary(node: Extract<Node, { kind: "binary" }>): string {
  const { op, left, right } = node
  if (op === "^") {
    const base = wrap(pretty(left), precedence(left) <= POWER)
    const plainExp = plain(right)
    const sup = plainExp.length <= 4 ? superscript(plainExp) : null
    return sup ? base + sup : `${base}^${wrap(pretty(right), precedence(right) < ATOM)}`
  }
  if (op === "+" || op === "-") {
    const r = pretty(right)
    const rightWrapped = wrap(r, precedence(right) <= SUM && op === "-")
    if (op === "+" && precedence(right) === UNARY) return `${pretty(left)} − ${pretty(right).slice(1)}`
    return `${pretty(left)} ${op === "+" ? "+" : "−"} ${rightWrapped}`
  }
  const l = wrap(pretty(left), precedence(left) < PRODUCT)
  if (op === "/") return `${l}/${wrap(pretty(right), precedence(right) <= UNARY)}`
  // Products and quotients on the right need no parentheses: a·(b/c) = a·b/c.
  const r = wrap(pretty(right), precedence(right) < PRODUCT || precedence(right) === UNARY)
  // 2x, 2πx, at, 3sin(x): short factors read best without a dot.
  const simpleRight = right.kind === "variable" || right.kind === "constant"
  const numberRight = right.kind === "call" || (right.kind === "binary" && right.op === "^" && right.left.kind !== "number")
  const juxtapose = (simpleRight && endsSimply(left)) || (numberRight && isNumber(left))
  return juxtapose ? `${l}${r}` : `${l}·${r}`
}

const isNumber = (node: Node) => node.kind === "number" || (node.kind === "unary" && node.arg.kind === "number")

/** Does a product end in a number, constant or variable, as 2π or a does? */
function endsSimply(node: Node): boolean {
  if (isNumber(node) || node.kind === "constant" || node.kind === "variable") return true
  if (node.kind === "unary") return endsSimply(node.arg)
  return node.kind === "binary" && node.op === "*" && !!node.implicit && endsSimply(node.right)
}

// Compact ASCII form of an exponent, used to decide if it fits as superscript.
function plain(node: Node): string {
  switch (node.kind) {
    case "number":
      return formatNumber(node.value)
    case "variable":
      return node.name
    case "unary":
      return node.arg.kind === "number" || node.arg.kind === "variable" ? `-${plain(node.arg)}` : "(…)"
    default:
      return "(…)"
  }
}
