// The extraction layer: reads a whole ```plot block and pulls out what to plot
// and how. Each line is one of:
//
//   x^2x                     an expression (several per line with ;)
//   y = x^2,  f(x) = x^2     an expression with a label
//   z = sin x cos y          a surface: two variables make a 3D plot
//   x^2 for x > 3            an expression drawn only where the condition holds
//                            (see condition.ts for the forms it takes)
//   sin x [blue, dashed]     an expression with a style (see style.ts)
//   a = 2                    a parameter used by the other lines
//   x: -2pi to 2pi           an option (see OPTION_KEYS)
//   # note                   a comment
//
// Every expression is normalised (LaTeX, Unicode) and parsed here, so later
// stages only see trees.

import { variablesOf, type Node } from "./ast.ts"
import { parseCondition, resolveCondition, splitCondition, type Condition, type Domain } from "./condition.ts"
import { compile } from "./evaluate.ts"
import { parseColor, splitStyle, type Color, type Style } from "./style.ts"
import { normalizeMath, stripMathDelimiters } from "./normalize.ts"
import { parse, ParseError, variableName, variableSource } from "./parser.ts"
import { pretty } from "./pretty.ts"

export interface Range {
  min: number
  max: number
  /** Set when the range was written in multiples of π, for π-based ticks. */
  piTicks: boolean
}

export interface Series {
  node: Node
  /** Label from the input (y, f(x), a name), or null to use the expression. */
  label: string | null
  /** The line it came from, 1-based, for error messages. */
  line: number
  /** One per variable the condition names; null if there's none. */
  condition: Condition[] | null
  /** The condition on the x-axis variable worked out, once parameters are known; null if none. */
  domain: Domain | null
  /** In 3D, the condition on the second variable worked out; null if none. */
  domain2: Domain | null
  /** Variables named in the label, as in f(x, y) = …. */
  arguments: string[]
  style: Style | null
}

export interface View {
  /** Degrees above the floor of the plot. */
  elevation: number
  /** Degrees round the vertical axis. */
  azimuth: number
}

export interface PlotSpec {
  series: Series[]
  parameters: Record<string, number>
  variable: string
  /** The second input variable of a 3D plot; null for a 2D plot. */
  variable2: string | null
  /** In 2D, x and y are the axes. In 3D, x and y are the two inputs and z the output. */
  x: Range | null
  y: Range | null
  z: Range | null
  title: string | null
  xLabel: string | null
  yLabel: string | null
  zLabel: string | null
  view: View | null
  /** Faces along each side of a 3D surface; null for the default. */
  resolution: number | null
  grid: boolean
  legend: boolean | null // null: decide from the number of series
  /** Line thickness for every curve without its own. */
  thickness: number | null
  /** Curve colours in order, replacing the defaults. */
  colors: Color[] | null
  /** Use colours exactly as given, without adjusting them for contrast. */
  exactColors: boolean
  notes: string[]
}

export class ExtractError extends Error {
  readonly line: number
  /** The text that failed and the place in it, for a caret under the error. */
  readonly detail?: { text: string; position: number }

  constructor(message: string, line: number, detail?: { text: string; position: number }) {
    super(message)
    this.line = line
    this.detail = detail
  }
}

const OPTION_KEYS = [
  "title", "x", "y", "z", "xlabel", "ylabel", "zlabel", "grid", "legend", "var", "variable", "view",
  "resolution", "thickness", "colors", "colours", "contrast",
] as const
const OPTIONS_3D = ["z", "zlabel", "view", "resolution"]
type OptionKey = (typeof OPTION_KEYS)[number]

// Names that label a curve rather than being a parameter: y = …, f(x) = ….
const LABEL_NAMES = new Set(["y", "z", "f", "g", "h", "p", "q", "r", "s", "v", "i"])

export function extract(source: string): PlotSpec {
  const spec: PlotSpec = {
    series: [],
    parameters: {},
    variable: "x",
    variable2: null,
    x: null,
    y: null,
    z: null,
    title: null,
    xLabel: null,
    yLabel: null,
    zLabel: null,
    view: null,
    resolution: null,
    grid: true,
    legend: null,
    thickness: null,
    colors: null,
    exactColors: false,
    notes: [],
  }
  const ranges: { key: "x" | "y" | "z"; text: string; line: number }[] = []
  let variables: string[] | null = null
  const options3d: { key: string; line: number }[] = []

  source.split(/\r?\n/).forEach((raw, index) => {
    const line = index + 1
    const text = raw.trim()
    if (!text || text.startsWith("#") || text.startsWith("//") || text.startsWith("%")) return

    const option = /^([a-zA-Z]+)\s*:\s*(.*)$/.exec(text)
    if (option && (OPTION_KEYS as readonly string[]).includes(option[1].toLowerCase())) {
      const key = option[1].toLowerCase() as OptionKey
      const value = option[2].trim()
      if (OPTIONS_3D.includes(key)) options3d.push({ key, line })
      if (key === "x" || key === "y" || key === "z") ranges.push({ key, text: value, line })
      else if (key === "title") spec.title = value
      else if (key === "xlabel") spec.xLabel = value
      else if (key === "ylabel") spec.yLabel = value
      else if (key === "zlabel") spec.zLabel = value
      else if (key === "grid") spec.grid = parseBoolean(value, line)
      else if (key === "legend") spec.legend = parseBoolean(value, line)
      else if (key === "view") spec.view = parseView(value, line)
      else if (key === "resolution") spec.resolution = parseResolution(value, line)
      else if (key === "thickness") spec.thickness = parseThickness(value, line)
      else if (key === "colors" || key === "colours") spec.colors = parseColors(value, line)
      else if (key === "contrast") spec.exactColors = !parseBoolean(value, line)
      else variables = value.split(/\s*,\s*|\s+/).filter(Boolean).map((v) => readVariable(v, `"${v}" in var: isn't a variable name.`, line))
      return
    }

    for (const part of splitStatements(text)) readStatement(part, line, spec)
  })

  if (spec.series.length === 0) throw new ExtractError("Nothing to plot. Write an expression, like x^2.", 1)

  const chosen = variables ?? chooseVariables(spec)
  if (chosen.length > 2) throw new ExtractError(`At most two variables can be plotted; "var:" names ${chosen.join(", ")}.`, 1)
  spec.variable = chosen[0]
  spec.variable2 = chosen[1] ?? null

  if (spec.variable2) {
    checkSurfaceVariables(spec)
  } else {
    for (const { key, line } of options3d) {
      const note = `"${key}:" on line ${line} only applies to 3D plots, so it was ignored.`
      if (!spec.notes.includes(note)) spec.notes.push(note)
    }
  }

  for (const series of spec.series) {
    const { condition, line } = series
    if (!condition) continue
    const inputs = spec.variable2 ? [spec.variable, spec.variable2] : [spec.variable]
    if (!spec.variable2 && condition.length > 1) {
      throw new ExtractError(`A condition can only use one variable; found ${condition.map((c) => show(c.variable)).join(" and ")}.`, line)
    }
    for (const c of condition) {
      if (!inputs.includes(c.variable)) {
        throw new ExtractError(
          spec.variable2
            ? `The condition uses ${show(c.variable)}, but this surface's variables are ${show(spec.variable)} and ${show(spec.variable2)}.`
            : `The condition uses ${show(c.variable)}, but the x-axis variable is ${show(spec.variable)}.`,
          line,
        )
      }
      const domain = withLine(line, () => resolveCondition(c, spec.parameters))
      if (c.variable === spec.variable) series.domain = domain
      else series.domain2 = domain
    }
  }
  for (const { key, text, line } of ranges) {
    if (key === "z" && !spec.variable2) continue
    const axisVariable = key === "x" ? spec.variable : key === "y" ? (spec.variable2 ?? "y") : "z"
    spec[key] = parseRange(text, line, spec, axisVariable)
  }
  return spec
}

// `;` separates statements, but not inside parentheses.
function splitStatements(text: string): string[] {
  const parts: string[] = []
  let depth = 0
  let start = 0
  for (let i = 0; i < text.length; i++) {
    if (text[i] === "(" || text[i] === "{" || text[i] === "[") depth++
    else if (text[i] === ")" || text[i] === "}" || text[i] === "]") depth--
    else if (text[i] === ";" && depth === 0) {
      parts.push(text.slice(start, i))
      start = i + 1
    }
  }
  parts.push(text.slice(start))
  return parts.map((p) => p.trim()).filter(Boolean)
}

function readStatement(text: string, line: number, spec: PlotSpec) {
  const styled = withLine(line, () => splitStyle(stripMathDelimiters(text)))
  const style = styled.style
  let body = styled.rest
  let label: string | null = null

  // "name: expr" with a name that isn't an option labels the curve.
  const named = /^([a-zA-Z][\w ]*?)\s*:\s*(.+)$/.exec(body)
  if (named) {
    label = named[1]
    body = named[2]
  }

  const split = splitCondition(body)
  body = split.expression
  const condition = split.condition === null ? null : withLine(line, () => parseCondition(split.condition!, (b) => parseExpression(b, line, spec)))

  // "lhs = rhs": a labelled curve, or a parameter like a = 2.
  const eq = /^([^=<>!]+?)\s*=\s*([^=].*)$/.exec(body)
  if (eq) {
    // A magnitude, |F(s)| = …, labels the curve as written.
    const magnitude = /^\|(.+)\|$/.exec(eq[1].trim())
    const lhs = magnitude ? magnitude[1].trim() : eq[1].trim()
    const rhs = eq[2].trim()
    // f(x) = …, f(x, y) = …, or a single variable: y = …, a = 2, \omega_0 = 2pi.
    const call = /^([a-zA-Z]+)\s*\(([^()]*)\)$/.exec(lhs)
    const unreadable = `Can't read "${lhs}" as a name. Write y = …, f(x) = …, z = … or a = 2.`
    const name = call ? call[1] : readVariable(lhs, unreadable, line)
    const args = call ? call[2].split(",").map((a) => readVariable(a, unreadable, line)) : []
    const node = parseExpression(rhs, line, spec)
    // A parameter's value may use earlier parameters: a = 2; b = 3a.
    if (!call && !magnitude && !LABEL_NAMES.has(name) && variablesOf(node).every((v) => v in spec.parameters)) {
      if (condition) throw new ExtractError(`${show(name)} is a parameter, so it can't have a condition.`, line)
      if (style) throw new ExtractError(`${show(name)} is a parameter, so it can't have a style.`, line)
      spec.parameters[name] = compile(node)(spec.parameters)
      return
    }
    label = call ? `${name}(${args.map(show).join(", ")})` : show(name)
    if (magnitude) label = `|${label}|`
    spec.series.push({ node, label, line, condition, domain: null, domain2: null, arguments: args, style })
    return
  }

  spec.series.push({ node: parseExpression(body, line, spec), label, line, condition, domain: null, domain2: null, arguments: [], style })
}

const show = (name: string) => pretty({ kind: "variable", name })

/** Reads text naming one variable (x, \\omega, V_{in}) into its internal name. */
function readVariable(text: string, message: string, line: number): string {
  const name = variableName(normalizeMath(text))
  if (name) return name
  throw new ExtractError(message, line)
}

/** Runs `fn`, turning a plain Error into an ExtractError for `line`. */
function withLine<T>(line: number, fn: () => T): T {
  try {
    return fn()
  } catch (e) {
    if (e instanceof ExtractError || !(e instanceof Error)) throw e
    throw new ExtractError(e.message, line)
  }
}

function parseExpression(text: string, line: number, spec: PlotSpec): Node {
  const normalized = normalizeMath(text)
  try {
    const { node, notes } = parse(normalized)
    for (const note of notes) if (!spec.notes.includes(note)) spec.notes.push(note)
    return node
  } catch (e) {
    if (e instanceof ParseError) {
      throw new ExtractError(e.message, line, { text: normalized, position: e.position })
    }
    throw e
  }
}

/** Variables that aren't parameters, in first-seen order. */
function freeVariables(spec: PlotSpec): string[] {
  const free: string[] = []
  for (const s of spec.series) {
    for (const v of variablesOf(s.node)) if (!(v in spec.parameters) && !free.includes(v)) free.push(v)
    for (const c of s.condition ?? []) if (!free.includes(c.variable)) free.push(c.variable)
  }
  return free
}

/**
 * The input variables. Two make a 3D plot: x and y together, or the two named
 * in a label like f(s, t) = …. Otherwise one, on the x-axis: x if used, else
 * the only free one.
 */
function chooseVariables(spec: PlotSpec): string[] {
  const named = spec.series.find((s) => s.arguments.length === 2)
  if (named) return named.arguments
  const free = freeVariables(spec)
  if (free.includes("x") && free.includes("y")) return ["x", "y"]
  if (free.includes("x") || free.length === 0) return ["x"]
  if (free.length === 1) return free
  for (const preferred of ["t", "s", "omega", "theta"]) if (free.includes(preferred)) return [preferred]
  throw new ExtractError(
    `Which variable goes on the x-axis? Found ${free.map(show).join(", ")}. Add a line like "var: t", give the others values, like "a = 2", or for a 3D plot name two, like "var: ${variableSource(free[0])}, ${variableSource(free[1])}".`,
    spec.series[0].line,
  )
}

/** In a 3D plot, every free variable must be one of the two inputs. */
function checkSurfaceVariables(spec: PlotSpec) {
  const inputs = [spec.variable, spec.variable2]
  for (const s of spec.series) {
    const extra = variablesOf(s.node).filter((v) => !(v in spec.parameters) && !inputs.includes(v))
    if (extra.length) {
      throw new ExtractError(`This surface uses ${extra.map(show).join(", ")}, which isn't ${inputs.map((v) => show(v!)).join(" or ")}. Give it a value, like "${variableSource(extra[0])} = 2".`, s.line)
    }
  }
}

/** "30, -60": elevation, then azimuth, in degrees. */
function parseView(value: string, line: number): View {
  const numbers = value.split(/\s*,\s*|\s+/).filter(Boolean).map(Number)
  if (numbers.length !== 2 || numbers.some((n) => !Number.isFinite(n))) {
    throw new ExtractError(`Write the view as two angles in degrees, elevation then azimuth, like "view: 30, -60".`, line)
  }
  return { elevation: numbers[0], azimuth: numbers[1] }
}

export const RESOLUTIONS: Record<string, number> = { low: 21, medium: 41, high: 81, max: 151 }

/** "high", or a number of faces per side from 10 to 200. */
function parseResolution(value: string, line: number): number {
  const word = value.toLowerCase()
  if (word in RESOLUTIONS) return RESOLUTIONS[word]
  const n = Number(value)
  if (!Number.isInteger(n) || n < 10 || n > 200) {
    throw new ExtractError(`Write the resolution as low, medium, high or max, or a number of faces per side from 10 to 200, like "resolution: 80".`, line)
  }
  // Odd, so a range symmetric about 0 isn't sampled at 0, where a pole like
  // 1/|s| would leave a hole.
  return n % 2 ? n : n + 1
}

/** How far a one-sided range like "x > 3" reaches. */
export const OPEN_RANGE_WIDTH = 10

/**
 * Accepts "-5 to 5", "-5..5", "[-5, 5]", "from 0 to 2pi", and comparisons:
 * "-1 < x < 1", "x > 3", "> 3" (one-sided ranges reach OPEN_RANGE_WIDTH).
 */
function parseRange(text: string, line: number, spec: PlotSpec, axisVariable: string): Range {
  const piTicks = /pi|π/i.test(text)
  if (/[<>≤≥]|\\[lg]e/.test(text)) {
    const domain = withLine(line, () => {
      const conditions = parseCondition(text, (b) => parseExpression(b, line, spec), axisVariable)
      if (conditions.length > 1) throw new Error(`A range can only use one variable; found ${conditions.map((c) => show(c.variable)).join(" and ")}.`)
      return resolveCondition(conditions[0], spec.parameters)
    })
    const min = Number.isFinite(domain.min) ? domain.min : domain.max - OPEN_RANGE_WIDTH
    const max = Number.isFinite(domain.max) ? domain.max : min + OPEN_RANGE_WIDTH
    return { min, max, piTicks }
  }
  let t = text.trim().replace(/^from\s+/i, "")
  t = t.replace(/^[[(]\s*/, "").replace(/\s*[\])]$/, "")
  const parts = t.split(/\s*(?:\.\.|\bto\b|,|…)\s*/i).filter(Boolean)
  if (parts.length !== 2) throw new ExtractError(`Can't read the range "${text}". Write it like -5 to 5.`, line)

  const [min, max] = parts.map((p) => {
    const node = parseExpression(p, line, { notes: [] } as unknown as PlotSpec)
    const value = compile(node)(spec.parameters)
    if (!Number.isFinite(value)) throw new ExtractError(`"${p}" in the range isn't a number.`, line)
    return value
  })
  if (!(max > min)) throw new ExtractError(`The range "${text}" must go from low to high.`, line)
  return { min, max, piTicks }
}

/** "3", "3px" or thin / normal / thick. */
function parseThickness(value: string, line: number): number {
  const { style } = withLine(line, () => splitStyle(`x [${/^\d/.test(value) ? `width ${value}` : value}]`))
  if (!style?.width) throw new ExtractError(`Write the thickness as a number like 2.5, or thin, normal or thick.`, line)
  return style.width
}

/** "red, blue, #0e7490, navy / skyblue". */
function parseColors(value: string, line: number): Color[] {
  return value.split(",").map((item) => {
    const color = parseColor(item.trim())
    if (!color) throw new ExtractError(`"${item.trim()}" isn't a colour. Use a name like blue, or #hex.`, line)
    return color
  })
}

function parseBoolean(value: string, line: number): boolean {
  if (/^(true|yes|on|1)$/i.test(value)) return true
  if (/^(false|no|off|0)$/i.test(value)) return false
  throw new ExtractError(`Expected true or false, got "${value}".`, line)
}
