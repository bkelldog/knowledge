// Conditions that limit where a curve is drawn, part of the extraction layer:
//
//   x^2 for x > 3            also "where", "if", "when"
//   x^2 {x > 3}              Desmos style
//   sin x, 0 < x < pi        after a comma
//   x^2 for x >= 0 and x < 2
//   1/s for sigma > 0 and -3 < omega < 3     in 3D, on either variable or both
//
// Comparisons may be written <, <=, >, >=, ≤, ≥, \le, \geq, \lt, …

import type { Node } from "./ast.ts"
import { compile } from "./evaluate.ts"
import { normalizeMath } from "./normalize.ts"
import { variableName, variableSource } from "./parser.ts"
import { pretty } from "./pretty.ts"

export interface Bound {
  node: Node
  /** < or >, rather than <= or >=. */
  open: boolean
}

export interface Condition {
  variable: string
  lower: Bound[]
  upper: Bound[]
}

/** A condition with its bounds worked out. Infinite where unbounded. */
export interface Domain {
  min: number
  max: number
  minOpen: boolean
  maxOpen: boolean
  /** Readable form, like "x > 3" or "0 ≤ x < π". */
  text: string
}

const COMPARISON = /<=|>=|<|>/

/** Rewrites ≤, \geq, =< and friends as <=, >=, <, >. */
export function normalizeComparisons(text: string): string {
  return text
    .replace(/\\(?:leqslant|leq|le)\b/g, "<=")
    .replace(/\\(?:geqslant|geq|ge)\b/g, ">=")
    .replace(/\\lt\b/g, "<")
    .replace(/\\gt\b/g, ">")
    .replace(/≤|⩽|=</g, "<=")
    .replace(/≥|⩾|=>/g, ">=")
    .replace(/\\(?:land|wedge)\b|∧|&&/g, " and ")
}

/** Splits "expr for cond", "expr {cond}" or "expr, cond". */
export function splitCondition(text: string): { expression: string; condition: string | null } {
  const split = (expression: string, condition: string | null) => ({ expression: expression.trim(), condition: condition?.trim() ?? null })
  // LaTeX spellings of the same thing: \text{ for }, \{ … \}.
  const t = text
    .replace(/\\(?:text|mathrm)\{\s*(for|where|if|when)\s*\}/gi, " $1 ")
    .replace(/\\left\\\{|\\\{/g, "{")
    .replace(/\\right\\\}|\\\}/g, "}")
    .trim()

  const word = /^(.*?)\s+(?:for|where|if|when)\s+(.+)$/i.exec(t)
  if (word && hasComparison(word[2])) return split(word[1], word[2])

  // A final {…} or top-level ", …" holding a comparison.
  if (t.endsWith("}")) {
    let depth = 0
    for (let i = t.length - 1; i >= 0; i--) {
      if (t[i] === "}") depth++
      else if (t[i] === "{" && --depth === 0) {
        const inside = t.slice(i + 1, -1)
        if (hasComparison(inside) && t.slice(0, i).trim()) return split(t.slice(0, i), inside)
        break
      }
    }
  }
  let depth = 0
  for (let i = t.length - 1; i >= 0; i--) {
    const ch = t[i]
    if (ch === ")" || ch === "}" || ch === "]") depth++
    else if (ch === "(" || ch === "{" || ch === "[") depth--
    else if (ch === "," && depth === 0) {
      const tail = t.slice(i + 1)
      if (hasComparison(tail)) return split(t.slice(0, i), tail)
      break
    }
  }
  return split(t, null)
}

const hasComparison = (text: string) => COMPARISON.test(normalizeComparisons(text))

/**
 * Parses a condition into one Condition per variable it names, in the order
 * they first appear. `parseBound` turns each bound into a tree (and reports
 * errors with the right line); `defaultVariable` fills in one-sided ranges
 * like "> 3".
 */
export function parseCondition(text: string, parseBound: (text: string) => Node, defaultVariable?: string): Condition[] {
  const conditions: Condition[] = []
  for (const clause of normalizeComparisons(text).split(/\s*\band\b\s*/i)) {
    let parts = clause.split(/(<=|>=|<|>)/).map((p) => p.trim())
    if (parts[0] === "" && defaultVariable) parts = [variableSource(defaultVariable), ...parts.slice(1)]
    if (parts.length !== 3 && parts.length !== 5) {
      throw new Error(`Can't read the condition "${clause.trim()}". Write it like x > 3 or 0 < x < 2.`)
    }
    const varIndex = parts.findIndex((p, i) => i % 2 === 0 && variableName(normalizeMath(p)) !== null)
    if (varIndex === -1) throw new Error(`The condition "${clause.trim()}" needs a variable, like x > 3.`)
    const variable = variableName(normalizeMath(parts[varIndex]))!
    let condition = conditions.find((c) => c.variable === variable)
    if (!condition) {
      condition = { variable, lower: [], upper: [] }
      conditions.push(condition)
    }

    // Each comparison next to the variable gives a bound: 3 < x is x > 3.
    for (let i = 1; i < parts.length; i += 2) {
      const [left, op, right] = [parts[i - 1], parts[i], parts[i + 1]]
      let varOp: string
      let other: string
      if (i - 1 === varIndex) [varOp, other] = [op, right]
      else if (i + 1 === varIndex) [varOp, other] = [flip(op), left]
      else throw new Error(`Can't read the condition "${clause.trim()}".`)
      const bound = { node: parseBound(other), open: !varOp.includes("=") }
      if (varOp.startsWith(">")) condition.lower.push(bound)
      else condition.upper.push(bound)
    }
  }
  return conditions
}

const show = (name: string) => pretty({ kind: "variable", name })

const flip = (op: string) => ({ "<": ">", "<=": ">=", ">": "<", ">=": "<=" })[op]!

/** Works out the bounds; with several on one side, the tightest wins. */
export function resolveCondition(condition: Condition, parameters: Record<string, number>): Domain {
  const pick = (bounds: Bound[], tighter: (a: number, b: number) => boolean) => {
    let best: { value: number; bound: Bound } | null = null
    for (const bound of bounds) {
      const value = compile(bound.node)(parameters)
      if (!Number.isFinite(value)) throw new Error(`"${pretty(bound.node)}" in a condition isn't a number.`)
      if (!best || tighter(value, best.value) || (value === best.value && bound.open)) best = { value, bound }
    }
    return best
  }
  const lo = pick(condition.lower, (a, b) => a > b)
  const hi = pick(condition.upper, (a, b) => a < b)
  if (lo && hi && !(hi.value > lo.value)) throw new Error("The condition leaves no values to plot.")

  const v = show(condition.variable)
  const lt = (open: boolean) => (open ? "<" : "≤")
  const gt = (open: boolean) => (open ? ">" : "≥")
  const text =
    lo && hi
      ? `${pretty(lo.bound.node)} ${lt(lo.bound.open)} ${v} ${lt(hi.bound.open)} ${pretty(hi.bound.node)}`
      : lo
        ? `${v} ${gt(lo.bound.open)} ${pretty(lo.bound.node)}`
        : `${v} ${lt(hi!.bound.open)} ${pretty(hi!.bound.node)}`

  return {
    min: lo ? lo.value : -Infinity,
    max: hi ? hi.value : Infinity,
    minOpen: lo ? lo.bound.open : true,
    maxOpen: hi ? hi.bound.open : true,
    text,
  }
}
