// Draws sampled curves as a standalone SVG string. Axes and text use
// currentColor, so the plot follows the light or dark theme of the page around
// it; text inherits the page's font. Each curve has a colour for light mode
// and one for dark, switched by a small stylesheet inside the SVG.

import type { Piece } from "./sample.ts"
import { themeCss } from "./style.ts"
import { ticks, type Tick } from "./ticks.ts"

export interface Marker {
  x: number
  y: number
  /** Hollow, for an end the curve doesn't include. */
  open: boolean
}

export interface Curve {
  pieces: Piece[]
  label: string
  markers: Marker[]
  color: { light: string; dark: string }
  width: number
  dash: "solid" | "dashed" | "dotted"
}

export interface Frame {
  x: { min: number; max: number; piTicks: boolean }
  y: { min: number; max: number; piTicks: boolean }
  title: string | null
  xLabel: string | null
  yLabel: string | null
  grid: boolean
  legend: boolean
  /** Makes element ids unique when several plots share a page. */
  id: string
}

const WIDTH = 640
const HEIGHT = 400
const FONT = 13
const TICK = 5

export const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
export const r = (n: number) => Math.round(n * 100) / 100

export function renderSvg(curves: Curve[], frame: Frame): string {
  const xTicks = ticks(frame.x.min, frame.x.max, 8, frame.x.piTicks)
  const yTicks = ticks(frame.y.min, frame.y.max, 6, frame.y.piTicks)

  // Room for the longest y tick label, the axis labels and the title.
  const longest = Math.max(...yTicks.map((t) => t.label.length), 1)
  const left = 14 + TICK + longest * FONT * 0.6 + (frame.yLabel ? FONT * 1.6 : 0)
  const top = frame.title ? FONT * 2.6 : 14
  const bottom = 14 + TICK + FONT * 1.2 + (frame.xLabel ? FONT * 1.6 : 0)
  const right = 18
  const plot = { x0: left, x1: WIDTH - right, y0: top, y1: HEIGHT - bottom }

  const sx = (x: number) => plot.x0 + ((x - frame.x.min) / (frame.x.max - frame.x.min)) * (plot.x1 - plot.x0)
  const sy = (y: number) => plot.y1 - ((y - frame.y.min) / (frame.y.max - frame.y.min)) * (plot.y1 - plot.y0)
  // Far-off values are pulled in before scaling; the clip path hides them anyway.
  const ySpan = frame.y.max - frame.y.min
  const clampY = (y: number) => Math.min(frame.y.max + 2 * ySpan, Math.max(frame.y.min - 2 * ySpan, y))

  const clipId = `qp-clip-${frame.id}`
  const parts: string[] = []
  const label = frame.title ?? curves.map((c) => c.label).join("; ")
  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" width="${WIDTH}" height="${HEIGHT}" role="img" aria-label="${esc(label)}" class="quick-plot-svg qp-${frame.id}" font-size="${FONT}">`,
    `<style>${themeCss(`qp-${frame.id}`, curves.map((c) => c.color))}</style>`,
    `<defs><clipPath id="${clipId}"><rect x="${r(plot.x0)}" y="${r(plot.y0)}" width="${r(plot.x1 - plot.x0)}" height="${r(plot.y1 - plot.y0)}"/></clipPath></defs>`,
  )

  if (frame.title) {
    parts.push(`<text x="${r((plot.x0 + plot.x1) / 2)}" y="${r(FONT * 1.4)}" text-anchor="middle" font-size="${FONT * 1.15}" fill="currentColor">${esc(frame.title)}</text>`)
  }

  // Grid, then the lines through zero, then the frame.
  if (frame.grid) {
    const lines = [
      ...xTicks.map((t) => `M${r(sx(t.value))} ${r(plot.y0)}V${r(plot.y1)}`),
      ...yTicks.map((t) => `M${r(plot.x0)} ${r(sy(t.value))}H${r(plot.x1)}`),
    ]
    parts.push(`<path d="${lines.join("")}" stroke="currentColor" stroke-opacity="0.12" fill="none"/>`)
  }
  const zero: string[] = []
  if (frame.x.min < 0 && frame.x.max > 0) zero.push(`M${r(sx(0))} ${r(plot.y0)}V${r(plot.y1)}`)
  if (frame.y.min < 0 && frame.y.max > 0) zero.push(`M${r(plot.x0)} ${r(sy(0))}H${r(plot.x1)}`)
  if (zero.length) parts.push(`<path d="${zero.join("")}" stroke="currentColor" stroke-opacity="0.5" fill="none"/>`)
  parts.push(`<path d="M${r(plot.x0)} ${r(plot.y0)}V${r(plot.y1)}H${r(plot.x1)}" stroke="currentColor" stroke-opacity="0.8" fill="none"/>`)

  parts.push(axisTicks(xTicks, yTicks, sx, sy, plot))

  // Axis labels.
  if (frame.xLabel) {
    parts.push(`<text x="${r((plot.x0 + plot.x1) / 2)}" y="${r(HEIGHT - 10)}" text-anchor="middle" fill="currentColor"${italic(frame.xLabel)}>${esc(frame.xLabel)}</text>`)
  }
  if (frame.yLabel) {
    const cx = FONT
    const cy = (plot.y0 + plot.y1) / 2
    parts.push(`<text x="${r(cx)}" y="${r(cy)}" text-anchor="middle" transform="rotate(-90 ${r(cx)} ${r(cy)})" fill="currentColor"${italic(frame.yLabel)}>${esc(frame.yLabel)}</text>`)
  }

  // Curves, each in a group whose CSS color is the curve's colour for the
  // current theme. The color attribute is the fallback without the stylesheet.
  parts.push(`<g clip-path="url(#${clipId})" fill="none" stroke-linejoin="round" stroke-linecap="round">`)
  curves.forEach((curve, i) => {
    const d = curve.pieces
      .map((piece) => piece.map(([x, y], j) => `${j ? "L" : "M"}${r(sx(x))} ${r(sy(clampY(y)))}`).join(""))
      .join("")
    if (d) parts.push(`<path class="qp-s${i}" color="${curve.color.light}" d="${d}" stroke="currentColor"${lineStyle(curve)}/>`)
  })
  parts.push(`</g>`)

  // End dots. A hollow dot is filled with the page background to hide the
  // curve's end under it; the variables are Obsidian's and Quartz's.
  curves.forEach((curve, i) => {
    const dots = curve.markers.flatMap((m) => {
      const y = sy(m.y)
      if (y < plot.y0 - 1 || y > plot.y1 + 1) return []
      const fill = m.open ? ` style="fill: var(--background-primary, var(--light, Canvas))"` : ` fill="currentColor"`
      const radius = 2 + curve.width
      return [`<circle cx="${r(sx(m.x))}" cy="${r(y)}" r="${r(radius)}"${fill}/>`]
    })
    if (dots.length) {
      parts.push(`<g class="qp-s${i}" color="${curve.color.light}" stroke="currentColor" stroke-width="${Math.min(curve.width, 3)}">${dots.join("")}</g>`)
    }
  })

  if (frame.legend) parts.push(legend(curves, sx, sy, plot))

  parts.push(`</svg>`)
  return parts.join("")
}

function lineStyle(curve: Pick<Curve, "width" | "dash">): string {
  const w = curve.width
  const dash = curve.dash === "dashed" ? ` stroke-dasharray="${r(3 * w + 2)} ${r(2 * w + 2)}"` : curve.dash === "dotted" ? ` stroke-dasharray="0 ${r(2 * w + 1)}"` : ""
  return ` stroke-width="${w}"${dash}`
}

// Single-letter names (x, t) are set in italics, as in print.
export const italic = (text: string) => (/^[a-zA-Zα-ω]$/.test(text) ? ` font-style="italic"` : "")

function axisTicks(xTicks: Tick[], yTicks: Tick[], sx: (x: number) => number, sy: (y: number) => number, plot: { x0: number; x1: number; y0: number; y1: number }) {
  const marks = [
    ...xTicks.map((t) => `M${r(sx(t.value))} ${r(plot.y1)}v${TICK}`),
    ...yTicks.map((t) => `M${r(plot.x0)} ${r(sy(t.value))}h${-TICK}`),
  ]
  const labels = [
    ...xTicks.map((t) => `<text x="${r(sx(t.value))}" y="${r(plot.y1 + TICK + FONT * 1.1)}" text-anchor="middle">${esc(t.label)}</text>`),
    ...yTicks.map((t) => `<text x="${r(plot.x0 - TICK - 4)}" y="${r(sy(t.value) + FONT * 0.35)}" text-anchor="end">${esc(t.label)}</text>`),
  ]
  return `<path d="${marks.join("")}" stroke="currentColor" stroke-opacity="0.8"/><g fill="currentColor" fill-opacity="0.85">${labels.join("")}</g>`
}

// Goes in whichever corner of the plot the curves pass through least.
function legend(curves: Curve[], sx: (x: number) => number, sy: (y: number) => number, plot: { x0: number; x1: number; y0: number; y1: number }) {
  const lineHeight = FONT * 1.45
  const width = 34 + Math.max(...curves.map((c) => c.label.length)) * FONT * 0.55
  const height = curves.length * lineHeight + 8
  const pad = 10

  const corners = [
    { x: plot.x0 + pad, y: plot.y0 + pad },
    { x: plot.x1 - pad - width, y: plot.y0 + pad },
    { x: plot.x0 + pad, y: plot.y1 - pad - height },
    { x: plot.x1 - pad - width, y: plot.y1 - pad - height },
  ]
  const crowding = corners.map((c) => {
    let n = 0
    for (const curve of curves) {
      for (const piece of curve.pieces) {
        for (const [x, y] of piece) {
          const px = sx(x)
          const py = sy(y)
          if (px >= c.x - 4 && px <= c.x + width + 4 && py >= c.y - 4 && py <= c.y + height + 4) n++
        }
      }
    }
    return n
  })
  const best = corners[crowding.indexOf(Math.min(...crowding))]

  const rows = curves.map((curve, i) => {
    const y = best.y + 4 + lineHeight * (i + 0.5)
    return (
      `<path class="qp-s${i}" color="${curve.color.light}" d="M${r(best.x + 4)} ${r(y)}h22" stroke="currentColor" stroke-linecap="round"${lineStyle({ ...curve, width: Math.min(curve.width, 4) })}/>` +
      `<text x="${r(best.x + 32)}" y="${r(y + FONT * 0.35)}" fill="currentColor">${esc(curve.label)}</text>`
    )
  })
  return `<g class="quick-plot-legend">${rows.join("")}</g>`
}
