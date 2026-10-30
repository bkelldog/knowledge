// The whole pipeline, from a ```plot block's text to an SVG string:
//
//   extract   lines → expressions, labels, parameters, options   (extract.ts)
//   parse     each expression → tree, via normalize + parser      (normalize.ts, parser.ts)
//   compile   tree → JavaScript function                          (evaluate.ts)
//   sample    function → pieces of curve                          (sample.ts)
//   render    pieces → SVG                                        (svg.ts)
//
// With two input variables the plot is a surface instead: sample a grid of
// z values and draw them in 3D (svg3d.ts).
//
// Nothing here touches the DOM or Obsidian, so the same code can run in Node,
// for example to render plots when a site is built.

import type { Domain } from "./condition.ts"
import { compile } from "./evaluate.ts"
import { extract, ExtractError, OPEN_RANGE_WIDTH, type PlotSpec, type Series } from "./extract.ts"
import { pretty } from "./pretty.ts"
import { robustSpread, sample, type Piece } from "./sample.ts"
import { DEFAULT_COLORS, DEFAULT_WIDTH, themeColors, type Color } from "./style.ts"
import { renderSvg, type Marker } from "./svg.ts"
import { DEFAULT_VIEW, renderSurfaceSvg, type Surface } from "./svg3d.ts"

export { extract, ExtractError } from "./extract.ts"
export { normalizeMath } from "./normalize.ts"
export { parse, ParseError } from "./parser.ts"
export { pretty } from "./pretty.ts"
export { FUNCTIONS, CONSTANTS } from "./builtins.ts"

const DEFAULT_X = { min: -5, max: 5, piTicks: false }
// Faces along each side of a 3D surface, unless `resolution:` says otherwise.
// Odd, so a range symmetric about 0 isn't sampled at 0, where a pole like
// 1/|s| would leave a hole.
const GRID = 41

export type PlotResult =
  | { ok: true; svg: string; notes: string[]; spec: PlotSpec }
  | { ok: false; message: string; line: number; detail?: { text: string; position: number } }

export function renderPlot(source: string): PlotResult {
  let spec: PlotSpec
  try {
    spec = extract(source)
  } catch (e) {
    if (e instanceof ExtractError) return { ok: false, message: e.message, line: e.line, detail: e.detail }
    throw e
  }

  if (spec.variable2) return renderSurfacePlot(spec, spec.variable2)

  const x = spec.x ?? defaultRange(spec.series.map((s) => s.domain))
  const curves = []
  for (const series of spec.series) {
    const f = compile(series.node)
    const scope = { ...spec.parameters }
    const at = (v: number) => {
      scope[spec.variable] = v
      return f(scope)
    }
    const expression = pretty(series.node)
    const label = (series.label ? `${series.label} = ${expression}` : expression) + (series.domain ? ` (${series.domain.text})` : "")

    // Draw only where the condition holds and the plot shows.
    const lo = Math.max(x.min, series.domain?.min ?? -Infinity)
    const hi = Math.min(x.max, series.domain?.max ?? Infinity)
    if (!(hi > lo)) {
      return { ok: false, message: `"${label}" lies outside the plotted range, ${x.min} to ${x.max}.`, line: series.line }
    }
    const pieces = sample(at, lo, hi)
    if (pieces.length === 0) {
      return { ok: false, message: `"${label}" has no real values between ${lo} and ${hi}.`, line: series.line }
    }
    curves.push({
      pieces,
      label,
      markers: endpointMarkers(series, pieces, x),
      color: themeColors(colorFor(spec, curves.length), spec.exactColors),
      width: series.style?.width ?? spec.thickness ?? DEFAULT_WIDTH,
      dash: series.style?.dash ?? "solid",
    })
  }

  const y = spec.y ?? autoRange(curves.flatMap((c) => c.pieces.flatMap((p) => p.map(([, y]) => y))))
  const svg = renderSvg(curves, {
    x,
    y,
    title: spec.title,
    xLabel: spec.xLabel ?? pretty({ kind: "variable", name: spec.variable }),
    yLabel: spec.yLabel,
    grid: spec.grid,
    legend: spec.legend ?? true,
    id: hash(source),
  })
  return { ok: true, svg, notes: spec.notes, spec }
}

/** A series' own colour, else the next from colors: or the defaults. */
function colorFor(spec: PlotSpec, index: number): Color {
  const own = spec.series[index].style?.color
  if (own) return own
  const palette = spec.colors ?? DEFAULT_COLORS
  return palette[index % palette.length]
}

// Without an x: option the plot shows -5 to 5, widened or moved to take in
// every curve's condition: x > 3 alone shows 3 to 13, with a margin.
function defaultRange(domains: (Domain | null)[]) {
  if (domains.every((d) => d === null)) return DEFAULT_X
  let min = Infinity
  let max = -Infinity
  for (const d of domains) {
    let lo = DEFAULT_X.min
    let hi = DEFAULT_X.max
    if (d) {
      lo = Number.isFinite(d.min) ? d.min : Number.isFinite(d.max) ? d.max - OPEN_RANGE_WIDTH : lo
      hi = Number.isFinite(d.max) ? d.max : Number.isFinite(d.min) ? d.min + OPEN_RANGE_WIDTH : hi
    }
    min = Math.min(min, lo)
    max = Math.max(max, hi)
  }
  const margin = 0.05 * (max - min)
  return { min: min - margin, max: max + margin, piTicks: false }
}

// A 3D plot keeps -5 to 5 while every condition overlaps it, so sigma > 0
// shows the half where the surface is drawn next to the half where it isn't.
// Otherwise it's fitted as in 2D.
function surfaceRange(domains: (Domain | null)[]) {
  const overlaps = (d: Domain | null) => !d || (d.max > DEFAULT_X.min && d.min < DEFAULT_X.max)
  return domains.every(overlaps) ? DEFAULT_X : defaultRange(domains)
}

// A dot where a condition cuts a curve off: filled for ≤ or ≥, hollow for < or >.
function endpointMarkers(series: Series, pieces: Piece[], x: { min: number; max: number }): Marker[] {
  const d = series.domain
  if (!d) return []
  const markers: Marker[] = []
  const tolerance = 1e-9 * (x.max - x.min)
  const first = pieces[0][0]
  const lastPiece = pieces[pieces.length - 1]
  const last = lastPiece[lastPiece.length - 1]
  if (Number.isFinite(d.min) && d.min >= x.min && Math.abs(first[0] - d.min) <= tolerance) {
    markers.push({ x: first[0], y: first[1], open: d.minOpen })
  }
  if (Number.isFinite(d.max) && d.max <= x.max && Math.abs(last[0] - d.max) <= tolerance) {
    markers.push({ x: last[0], y: last[1], open: d.maxOpen })
  }
  return markers
}

function renderSurfacePlot(spec: PlotSpec, variable2: string): PlotResult {
  const x = spec.x ?? surfaceRange(spec.series.map((s) => s.domain))
  const y = spec.y ?? surfaceRange(spec.series.map((s) => s.domain2))
  const n = spec.resolution ?? GRID
  const grid = (min: number, max: number) => Array.from({ length: n + 1 }, (_, i) => min + ((max - min) * i) / n)

  const surfaces: Surface[] = []
  for (const series of spec.series) {
    const expression = pretty(series.node)
    const conditions = [series.domain, series.domain2].filter((d) => d !== null).map((d) => d.text)
    const label = (series.label ? `${series.label} = ${expression}` : expression) + (conditions.length ? ` (${conditions.join(", ")})` : "")

    // Sample only where the condition holds and the plot shows, so the whole
    // grid goes on what's drawn and the surface stops exactly at the edge.
    const [x0, x1] = [Math.max(x.min, series.domain?.min ?? -Infinity), Math.min(x.max, series.domain?.max ?? Infinity)]
    const [y0, y1] = [Math.max(y.min, series.domain2?.min ?? -Infinity), Math.min(y.max, series.domain2?.max ?? Infinity)]
    if (!(x1 > x0 && y1 > y0)) {
      const [axis, range] = x1 > x0 ? [y, "y"] : [x, "x"]
      return { ok: false, message: `"${label}" lies outside the plotted range, ${range}: ${axis.min} to ${axis.max}.`, line: series.line }
    }
    const xs = grid(x0, x1)
    const ys = grid(y0, y1)

    const f = compile(series.node)
    const scope = { ...spec.parameters }
    const at = (xv: number, yv: number) => {
      scope[spec.variable] = xv
      scope[variable2] = yv
      return f(scope)
    }
    const zs = xs.map((xv) => ys.map((yv) => at(xv, yv)))
    // Midpoints of each face's edges and of the face itself, to find faces
    // that straddle a pole.
    const mid = (vs: number[], i: number) => (vs[i] + vs[i + 1]) / 2
    const edgesX = xs.slice(1).map((_, i) => ys.map((yv) => at(mid(xs, i), yv)))
    const edgesY = xs.map((xv) => ys.slice(1).map((_, j) => at(xv, mid(ys, j))))
    const centers = xs.slice(1).map((_, i) => ys.slice(1).map((_, j) => at(mid(xs, i), mid(ys, j))))
    if (!zs.some((row) => row.some(Number.isFinite))) {
      return { ok: false, message: `"${label}" has no real values in the plotted range.`, line: series.line }
    }
    // One surface is coloured by height unless given a colour; several get one each.
    const chosen = series.style?.color || spec.colors || spec.series.length > 1
    surfaces.push({ xs, ys, zs, edgesX, edgesY, centers, label, color: chosen ? themeColors(colorFor(spec, surfaces.length), spec.exactColors).light : null })
  }

  const z = spec.z ?? autoRange(surfaces.flatMap((s) => s.zs.flat().filter(Number.isFinite)))
  const labelled = spec.series.length === 1 ? spec.series[0].label : null
  const svg = renderSurfaceSvg(surfaces, {
    x,
    y,
    z,
    title: spec.title,
    xLabel: spec.xLabel ?? pretty({ kind: "variable", name: spec.variable }),
    yLabel: spec.yLabel ?? pretty({ kind: "variable", name: variable2 }),
    zLabel: spec.zLabel ?? labelled,
    grid: spec.grid,
    legend: spec.legend ?? true,
    view: spec.view ?? DEFAULT_VIEW,
  })
  return { ok: true, svg, notes: spec.notes, spec }
}

/** A range that shows the values, ignoring the tails of asymptotes. */
function autoRange(ys: number[]) {
  let min = Math.min(...ys)
  let max = Math.max(...ys)
  const spread = robustSpread(ys)
  if (max - min > 4 * spread && spread > 0) {
    // Something shoots off (1/x, tan x): frame the bulk of the curve instead.
    const sorted = [...ys].sort((a, b) => a - b)
    min = sorted[Math.floor(0.02 * (sorted.length - 1))]
    max = sorted[Math.ceil(0.98 * (sorted.length - 1))]
  }
  if (max - min < 1e-9) {
    min -= 1
    max += 1
  }
  // Show the axis when the curve sits just above or below it, as a step does.
  if (min > 0 && min < 0.3 * max) min = 0
  if (max < 0 && max > 0.3 * min) max = 0
  const pad = 0.08 * (max - min)
  return { min: min - pad, max: max + pad, piTicks: false }
}

// FNV-1a, for short ids that are the same every time a block is rendered.
function hash(text: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0).toString(36)
}
