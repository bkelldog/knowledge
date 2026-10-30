// Rewrites math as people type or paste it (LaTeX, Unicode symbols, Python's
// **) into the plain syntax the parser reads: x^2, sqrt(x), pi, *, /.
// Implicit multiplication is left alone; the parser handles it.
//
// Greek letters come out in LaTeX form, \omega, which the parser reads as one
// variable; subscripts come out as _0 or _{in}.

import { GREEK, GREEK_VARIANTS } from "./builtins.ts"

// Greek symbols, ω → \omega. π is the constant pi.
const GREEK_SYMBOLS: Record<string, string> = {
  ...Object.fromEntries(Object.entries(GREEK).map(([name, symbol]) => [symbol, `\\${name}`])),
  ϵ: "\\epsilon", ϑ: "\\theta", ϕ: "\\phi", ϱ: "\\rho", ς: "\\sigma",
  π: " pi ",
}

const SUBSCRIPTS: Record<string, string> = {
  "₀": "0", "₁": "1", "₂": "2", "₃": "3", "₄": "4", "₅": "5", "₆": "6", "₇": "7", "₈": "8", "₉": "9",
  ₐ: "a", ₑ: "e", ₕ: "h", ᵢ: "i", ⱼ: "j", ₖ: "k", ₗ: "l", ₘ: "m", ₙ: "n", ₒ: "o", ₚ: "p",
  ᵣ: "r", ₛ: "s", ₜ: "t", ᵤ: "u", ᵥ: "v", ₓ: "x",
}

const SUPERSCRIPTS: Record<string, string> = {
  "⁰": "0", "¹": "1", "²": "2", "³": "3", "⁴": "4", "⁵": "5", "⁶": "6", "⁷": "7", "⁸": "8", "⁹": "9",
  "⁻": "-", "⁺": "+", "ⁿ": "n", "ˣ": "x",
}

const SYMBOLS: Record<string, string> = {
  "×": "*", "·": "*", "⋅": "*", "∙": "*", "÷": "/", "−": "-", "–": "-", "—": "-", "∗": "*",
}

// LaTeX commands that are just a name the parser knows (\sin → sin).
const LATEX_NAMES = [
  "sin", "cos", "tan", "sec", "csc", "cot", "arcsin", "arccos", "arctan", "sinh", "cosh", "tanh",
  "exp", "ln", "log", "min", "max", "sgn", "pi",
]

// LaTeX commands that only affect spacing or sizing.
const LATEX_IGNORED = ["left", "right", "big", "Big", "bigg", "Bigg", "displaystyle", "quad", "qquad"]

/** Strips $…$, $$…$$, \(…\) and \[…\] around the whole input. */
export function stripMathDelimiters(text: string): string {
  const t = text.trim()
  for (const [open, close] of [["$$", "$$"], ["$", "$"], ["\\(", "\\)"], ["\\[", "\\]"]]) {
    if (t.startsWith(open) && t.endsWith(close) && t.length >= open.length + close.length) {
      return t.slice(open.length, t.length - close.length).trim()
    }
  }
  return t
}

/** Reads a {…} group, or a single character, starting at `i`. */
function readGroup(s: string, i: number): { body: string; end: number } {
  while (s[i] === " ") i++
  if (s[i] !== "{") return { body: s[i] ?? "", end: i + 1 }
  let depth = 0
  for (let j = i; j < s.length; j++) {
    if (s[j] === "{") depth++
    else if (s[j] === "}" && --depth === 0) return { body: s.slice(i + 1, j), end: j + 1 }
  }
  return { body: s.slice(i + 1), end: s.length } // unclosed: take the rest
}

/** Converts the LaTeX in `s` to plain syntax. */
export function latexToPlain(s: string): string {
  let out = ""
  let i = 0
  while (i < s.length) {
    if (s[i] !== "\\") {
      out += s[i++]
      continue
    }
    const match = /^\\([a-zA-Z]+|.)/.exec(s.slice(i))!
    const name = match[1]
    i += match[0].length

    if (name === "frac" || name === "dfrac" || name === "tfrac") {
      const num = readGroup(s, i)
      const den = readGroup(s, num.end)
      out += `((${latexToPlain(num.body)})/(${latexToPlain(den.body)}))`
      i = den.end
    } else if (name === "sqrt") {
      let index: string | null = null
      if (s[i] === "[") {
        const close = s.indexOf("]", i)
        index = s.slice(i + 1, close)
        i = close + 1
      }
      const arg = readGroup(s, i)
      const body = latexToPlain(arg.body)
      out += index ? `((${body})^(1/(${latexToPlain(index)})))` : `sqrt(${body})`
      i = arg.end
    } else if (name === "operatorname" || name === "mathrm" || name === "text" || name === "mathit") {
      const arg = readGroup(s, i)
      out += latexToPlain(arg.body)
      i = arg.end
    } else if (name === "cdot" || name === "times" || name === "ast") {
      out += "*"
    } else if (name === "div") {
      out += "/"
    } else if (name === "vert" || name === "lvert" || name === "rvert" || name === "|") {
      out += "|"
    } else if (name in GREEK || name in GREEK_VARIANTS) {
      out += `\\${GREEK_VARIANTS[name] ?? name}`
    } else if (LATEX_NAMES.includes(name)) {
      out += ` ${name} `
    } else if (LATEX_IGNORED.includes(name) || name === "," || name === ";" || name === "!" || name === " ") {
      out += " "
    } else {
      out += `\\${name}` // unknown: left for the parser to report
    }
  }
  // Remaining braces only group, ^{2x} → ^(2x), except a subscript's: x_{in}.
  return out.replace(/_\{([^{}]*)\}|\{|\}/g, (match, sub: string | undefined) =>
    sub !== undefined ? `_{${sub}}` : match === "{" ? "(" : ")",
  )
}

/** Converts Unicode math (², √, π, ×, −) to plain syntax. */
export function unicodeToPlain(s: string): string {
  let out = ""
  for (let i = 0; i < s.length; i++) {
    const ch = s[i]
    if (ch in SUPERSCRIPTS) {
      let run = ""
      while (i < s.length && s[i] in SUPERSCRIPTS) run += SUPERSCRIPTS[s[i++]]
      i--
      out += `^(${run})`
    } else if (ch in SUBSCRIPTS) {
      let run = ""
      while (i < s.length && s[i] in SUBSCRIPTS) run += SUBSCRIPTS[s[i++]]
      i--
      out += `_{${run}}`
    } else if (ch === "√") {
      out += " sqrt "
    } else if (ch in GREEK_SYMBOLS) {
      out += GREEK_SYMBOLS[ch]
    } else if (ch in SYMBOLS) {
      out += SYMBOLS[ch]
    } else {
      out += ch
    }
  }
  return out
}

/** Runs every rewrite, in the order that keeps them from interfering. */
export function normalizeMath(text: string): string {
  let s = stripMathDelimiters(text)
  s = s.replace(/\*\*/g, "^")
  s = latexToPlain(s)
  s = unicodeToPlain(s)
  return s.replace(/\s+/g, " ").trim()
}
