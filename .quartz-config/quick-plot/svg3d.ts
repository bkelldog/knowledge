// Draws surfaces z = f(x, y) as a static SVG: a shaded mesh inside a box with
// gridded back walls and labelled axes, seen from an adjustable angle.
//
// The box is drawn in its own units: x and y run from -0.5 to 0.5 and z over
// BOX_HEIGHT. Points are projected straight onto the screen (no perspective)
// and faces are painted back to front, so nearer parts of the surface hide
// farther ones.

import type { Range, View } from "./extract.ts"
import { esc, italic, r } from "./svg.ts"
import { ticks, type Tick } from "./ticks.ts"

export interface Surface {
  /** Where the surface is sampled: within the plot's x and y ranges, and its condition. */
  xs: number[]
  ys: number[]
  /** z at (xs[i], ys[j]) is zs[i][j]; NaN where the function is undefined. */
  zs: number[][]
  /** z halfway from (xs[i], ys[j]) to (xs[i + 1], ys[j]). */
  edgesX: number[][]
  /** z halfway from (xs[i], ys[j]) to (xs[i], ys[j + 1]). */
  edgesY: number[][]
  /** z at the middle of each face, between (xs[i], ys[j]) and (xs[i + 1], ys[j + 1]). */
  centers: number[][]
  label: string
  /** One colour for the whole surface, or null to colour it by height. */
  color: string | null
}

export interface Frame3d {
  x: Range
  y: Range
  z: Range
  title: string | null
  xLabel: string | null
  yLabel: string | null
  zLabel: string | null
  grid: boolean
  legend: boolean
  view: View
}

export const DEFAULT_VIEW: View = { elevation: 28, azimuth: -55 }

const WIDTH = 640
const HEIGHT = 520
const FONT = 13
const BOX_HEIGHT = 0.7
const TICK = 5

type Vec3 = [number, number, number]

// Colours for a single surface, by height: low is violet, high is yellow.
const HEIGHT_MAP: [number, number, number][] = [
  [68, 1, 84],
  [59, 82, 139],
  [33, 145, 140],
  [94, 201, 98],
  [253, 231, 37],
]

export function renderSurfaceSvg(surfaces: Surface[], frame: Frame3d): string {
  const A = (frame.view.azimuth * Math.PI) / 180
  const E = (frame.view.elevation * Math.PI) / 180
  const [cosA, sinA, cosE, sinE] = [Math.cos(A), Math.sin(A), Math.cos(E), Math.sin(E)]

  // Box coordinates of a data point, and the projection of a box point:
  // u to the right, v up, depth away from the viewer.
  const toBox = (x: number, y: number, z: number): Vec3 => [
    (x - frame.x.min) / (frame.x.max - frame.x.min) - 0.5,
    (y - frame.y.min) / (frame.y.max - frame.y.min) - 0.5,
    ((z - frame.z.min) / (frame.z.max - frame.z.min) - 0.5) * BOX_HEIGHT,
  ]
  const project = ([X, Y, Z]: Vec3) => {
    const x1 = X * cosA - Y * sinA
    const y1 = X * sinA + Y * cosA
    return { u: x1, v: y1 * sinE + Z * cosE, depth: y1 * cosE - Z * sinE }
  }

  // Fit the box's outline into the space left for it.
  const h = BOX_HEIGHT / 2
  const corners: Vec3[] = []
  for (const X of [-0.5, 0.5]) for (const Y of [-0.5, 0.5]) for (const Z of [-h, h]) corners.push([X, Y, Z])
  const projected = corners.map(project)
  const [uMin, uMax] = [Math.min(...projected.map((p) => p.u)), Math.max(...projected.map((p) => p.u))]
  const [vMin, vMax] = [Math.min(...projected.map((p) => p.v)), Math.max(...projected.map((p) => p.v))]
  const top = (frame.title ? FONT * 2.6 : 16) + (frame.legend ? surfaces.length * FONT * 1.45 : 0) + 18
  const area = { x0: 70, x1: WIDTH - 70, y0: top, y1: HEIGHT - 56 }
  const scale = Math.min((area.x1 - area.x0) / (uMax - uMin), (area.y1 - area.y0) / (vMax - vMin))
  const cx = (area.x0 + area.x1) / 2
  const cy = (area.y0 + area.y1) / 2
  const screen = (p: Vec3) => {
    const q = project(p)
    return { x: cx + (q.u - (uMin + uMax) / 2) * scale, y: cy - (q.v - (vMin + vMax) / 2) * scale, depth: q.depth }
  }
  const pt = (p: Vec3) => {
    const s = screen(p)
    return `${r(s.x)} ${r(s.y)}`
  }

  // Back walls: whichever of each pair is farther from the viewer.
  const farther = (a: Vec3, b: Vec3) => (project(a).depth > project(b).depth ? a : b)
  const xb = farther([-0.5, 0, 0], [0.5, 0, 0])[0]
  const yb = farther([0, -0.5, 0], [0, 0.5, 0])[1]
  const zb = E >= 0 ? -h : h
  const [xf, yf] = [-xb, -yb]

  const xTicks = ticks(frame.x.min, frame.x.max, 5, frame.x.piTicks)
  const yTicks = ticks(frame.y.min, frame.y.max, 5, frame.y.piTicks)
  const zTicks = ticks(frame.z.min, frame.z.max, 5, frame.z.piTicks)
  const bx = (t: Tick) => toBox(t.value, frame.y.min, frame.z.min)[0]
  const by = (t: Tick) => toBox(frame.x.min, t.value, frame.z.min)[1]
  const bz = (t: Tick) => toBox(frame.x.min, frame.y.min, t.value)[2]

  const parts: string[] = []
  const label = frame.title ?? surfaces.map((s) => s.label).join("; ")
  parts.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" width="${WIDTH}" height="${HEIGHT}" role="img" aria-label="${esc(label)}" class="quick-plot-svg" font-size="${FONT}">`)
  if (frame.title) {
    parts.push(`<text x="${WIDTH / 2}" y="${r(FONT * 1.4)}" text-anchor="middle" font-size="${FONT * 1.15}" fill="currentColor">${esc(frame.title)}</text>`)
  }

  // Walls and their grid lines.
  const line = (a: Vec3, b: Vec3) => `M${pt(a)}L${pt(b)}`
  const panes = [
    [[-0.5, -0.5, zb], [0.5, -0.5, zb], [0.5, 0.5, zb], [-0.5, 0.5, zb]],
    [[xb, -0.5, -h], [xb, 0.5, -h], [xb, 0.5, h], [xb, -0.5, h]],
    [[-0.5, yb, -h], [0.5, yb, -h], [0.5, yb, h], [-0.5, yb, h]],
  ] as Vec3[][]
  const outline = panes.map((pane) => `M${pane.map(pt).join("L")}Z`).join("")
  parts.push(`<path d="${outline}" fill="currentColor" fill-opacity="0.03" stroke="currentColor" stroke-opacity="0.35"/>`)
  if (frame.grid) {
    const grid = [
      ...xTicks.map((t) => line([bx(t), -0.5, zb], [bx(t), 0.5, zb]) + line([bx(t), yb, -h], [bx(t), yb, h])),
      ...yTicks.map((t) => line([-0.5, by(t), zb], [0.5, by(t), zb]) + line([xb, by(t), -h], [xb, by(t), h])),
      ...zTicks.map((t) => line([xb, -0.5, bz(t)], [xb, 0.5, bz(t)]) + line([-0.5, yb, bz(t)], [0.5, yb, bz(t)])),
    ]
    parts.push(`<path d="${grid.join("")}" fill="none" stroke="currentColor" stroke-opacity="0.12"/>`)
  }

  parts.push(drawSurfaces(surfaces, frame, toBox, screen))

  // Ticks and labels on the front edges of the floor and a side edge.
  const corner = [
    [xb, yf],
    [xf, yb],
  ].sort((a, b) => screen([a[0], a[1], 0]).x - screen([b[0], b[1], 0]).x)[0]
  parts.push(
    axis(xTicks, (t) => [bx(t), yf, zb], [0, yf, 0], frame.xLabel, screen),
    axis(yTicks, (t) => [xf, by(t), zb], [xf, 0, 0], frame.yLabel, screen),
    axis(zTicks, (t) => [corner[0], corner[1], bz(t)], [corner[0], corner[1], 0], frame.zLabel, screen),
  )

  if (frame.legend) parts.push(legend(surfaces, frame.title ? FONT * 2.6 : 16))
  parts.push(`</svg>`)
  return parts.join("")
}

type Screen = (p: Vec3) => { x: number; y: number; depth: number }

function drawSurfaces(surfaces: Surface[], frame: Frame3d, toBox: (x: number, y: number, z: number) => Vec3, screen: Screen): string {
  const light = normalize([-0.45, -0.55, 0.7])
  const faces: { depth: number; d: string; color: string }[] = []
  const { min: zMin, max: zMax } = frame.z

  for (const surface of surfaces) {
    const { xs, ys, zs, edgesX, edgesY, centers } = surface
    for (let i = 0; i < xs.length - 1; i++) {
      for (let j = 0; j < ys.length - 1; j++) {
        const quad: [number, number][] = [[i, j], [i + 1, j], [i + 1, j + 1], [i, j + 1]]
        const corners = quad.map(([a, b]): Vec3 => [xs[a], ys[b], onPole(zs[a][b], frame.z) ? NaN : zs[a][b]])
        // The value halfway between two corners: along an edge, or across the
        // face for a diagonal.
        const halfway = (p: number, q: number) => {
          if ((p + q) % 2 === 0) return centers[i][j]
          const [a, b] = [quad[p], quad[q]]
          return a[1] === b[1] ? edgesX[i][a[1]] : edgesY[a[0]][j]
        }
        const usable = (part: number[]) => {
          const z = part.map((k) => corners[k][2])
          if (!z.every(Number.isFinite) || spansBox(z, frame.z)) return false
          return part.every((k, n) => {
            const next = part[(n + 1) % part.length]
            return !crossesPole(corners[k][2], corners[next][2], halfway(k, next), frame.z)
          })
        }
        if (usable([0, 1, 2, 3])) {
          addFace(corners)
          continue
        }
        // Next to a pole or a hole, split the face in two along a diagonal and
        // keep whichever half is fine. Splitting along the diagonal whose ends
        // are both defined and closest in height keeps the surface's edge
        // straight, rather than a staircase of whole faces.
        const diagonals = [[0, 2], [1, 3]].map(([a, b]) => ({ a, b, gap: Math.abs(corners[a][2] - corners[b][2]) }))
        const { a, b } = diagonals.sort((p, q) => (Number.isFinite(p.gap) ? p.gap : Infinity) - (Number.isFinite(q.gap) ? q.gap : Infinity))[0]
        const others = [0, 1, 2, 3].filter((k) => k !== a && k !== b)
        for (const k of others) {
          if (usable([a, k, b])) addFace([corners[a], corners[k], corners[b]])
        }
      }
    }

    function addFace(face: Vec3[]) {
      // The part of the face inside the box; the rest is cut off at its top
      // and bottom rather than flattened onto them.
      const polygon = clipZ(clipZ(face, zMax, -1), zMin, 1)
      if (polygon.length < 3) return
      const points = polygon.map(([x, y, z]) => toBox(x, y, z))
      const onScreen = points.map(screen)
      const depth = onScreen.reduce((sum, p) => sum + p.depth, 0) / onScreen.length

      // Lambert shading from a light above and to one side.
      const shade = 0.6 + 0.4 * Math.abs(dot(faceNormal(points), light))
      const base = surface.color
        ? hexToRgb(surface.color)
        : heightColor(polygon.reduce((sum, p) => sum + p[2], 0) / polygon.length, frame.z)
      const color = toHex(base.map((c) => c * shade) as [number, number, number])
      faces.push({ depth, color, d: `M${onScreen.map((p) => `${r1(p.x)} ${r1(p.y)}`).join("L")}Z` })
    }
  }

  // Farthest first, so nearer faces cover them.
  faces.sort((a, b) => b.depth - a.depth)
  // Each face's edge in its own colour, slightly darker, hides the hairline
  // seams between faces and reads as a light mesh.
  const paths = faces.map((f) => `<path d="${f.d}" fill="${f.color}" stroke="${darker(f.color)}"/>`)
  return `<g stroke-width="${faces.length > 4000 ? 0.3 : 0.5}" stroke-linejoin="round">${paths.join("")}</g>`
}

/**
 * Whether a value is so far outside the box that the point sits on a pole, as
 * 1/(x + y) is at a grid point just off x = -y. Its sign there is down to
 * rounding, so it's left out like an undefined value; the faces beside it are
 * split so the surface ends in a straight edge.
 */
function onPole(z: number, range: Range): boolean {
  return Math.abs(z - (range.min + range.max) / 2) > 1e6 * (range.max - range.min)
}

/** Whether a face runs from below the box to above it, as across a pole. */
function spansBox(z: number[], range: Range): boolean {
  return Math.min(...z) < range.min && Math.max(...z) > range.max
}

/**
 * Whether an edge from height `a` to `b` crosses a pole, as 1/(x + y) does
 * along x = -y: the value halfway along heads off one way while an end has
 * shot out of the box the other way. Drawing it would join the two sides of
 * the pole with a wall.
 */
function crossesPole(a: number, b: number, half: number, range: Range): boolean {
  if (half === Infinity || half === -Infinity) return true
  if (!Number.isFinite(half)) return false // undefined there: a hole, not a pole
  const [lo, hi] = [Math.min(a, b), Math.max(a, b)]
  const slack = 0.1 * (range.max - range.min)
  return (half < lo - slack && hi > range.max) || (half > hi + slack && lo < range.min)
}

/** Cuts a polygon at a height, keeping the part below it (side -1) or above it (side 1). */
function clipZ(polygon: Vec3[], level: number, side: 1 | -1): Vec3[] {
  const inside = (p: Vec3) => side * (p[2] - level) >= 0
  const out: Vec3[] = []
  polygon.forEach((p, k) => {
    const q = polygon[(k + 1) % polygon.length]
    if (inside(p)) out.push(p)
    if (inside(p) !== inside(q)) {
      const t = (level - p[2]) / (q[2] - p[2])
      out.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t, level])
    }
  })
  return out
}

/** The normal of a polygon that may not be flat (Newell's method). */
function faceNormal(points: Vec3[]): Vec3 {
  const n: Vec3 = [0, 0, 0]
  points.forEach((p, k) => {
    const q = points[(k + 1) % points.length]
    n[0] += (p[1] - q[1]) * (p[2] + q[2])
    n[1] += (p[2] - q[2]) * (p[0] + q[0])
    n[2] += (p[0] - q[0]) * (p[1] + q[1])
  })
  return normalize(n)
}

// Faces are small, so a tenth of a pixel is plenty and keeps the SVG smaller.
const r1 = (n: number) => Math.round(n * 10) / 10

function axis(axisTicks: Tick[], at: (t: Tick) => Vec3, outward: Vec3, title: string | null, screen: Screen): string {
  // Screen direction pointing away from the box along `outward`.
  const o = screen([0, 0, 0])
  const w = screen(outward)
  const len = Math.hypot(w.x - o.x, w.y - o.y) || 1
  const [dx, dy] = [(w.x - o.x) / len, (w.y - o.y) / len]
  const anchor = dx > 0.35 ? "start" : dx < -0.35 ? "end" : "middle"

  const marks: string[] = []
  const labels: string[] = []
  for (const t of axisTicks) {
    const p = screen(at(t))
    marks.push(`M${r(p.x)} ${r(p.y)}l${r(dx * TICK)} ${r(dy * TICK)}`)
    labels.push(`<text x="${r(p.x + dx * 10)}" y="${r(p.y + dy * 10 + FONT * 0.35 + Math.max(0, dy) * 4)}" text-anchor="${anchor}">${esc(t.label)}</text>`)
  }
  let out = `<path d="${marks.join("")}" stroke="currentColor" stroke-opacity="0.8"/><g fill="currentColor" fill-opacity="0.85">${labels.join("")}</g>`
  if (title) {
    const first = screen(at(axisTicks[0]))
    const last = screen(at(axisTicks[axisTicks.length - 1]))
    // Past the widest tick label when the axis points sideways, so a long
    // title doesn't run into them.
    const widest = Math.max(...axisTicks.map((t) => t.label.length)) * FONT * 0.6
    const away = anchor === "middle" ? 38 : Math.max(38, widest + 20)
    const mx = (first.x + last.x) / 2 + dx * away
    const my = (first.y + last.y) / 2 + dy * away + FONT * 0.35
    out += `<text x="${r(mx)}" y="${r(my)}" text-anchor="${anchor}" fill="currentColor"${italic(title)}>${esc(title)}</text>`
  }
  return out
}

function legend(surfaces: Surface[], top: number): string {
  const rows = surfaces.map((s, i) => {
    const y = top + FONT * 1.45 * (i + 0.5)
    const color = s.color ?? toHex(HEIGHT_MAP[2])
    return `<rect x="16" y="${r(y - 5)}" width="18" height="10" rx="2" fill="${color}"/><text x="42" y="${r(y + FONT * 0.35)}" fill="currentColor">${esc(s.label)}</text>`
  })
  return `<g class="quick-plot-legend">${rows.join("")}</g>`
}

function heightColor(z: number, range: Range): [number, number, number] {
  const t = Math.min(1, Math.max(0, (z - range.min) / (range.max - range.min))) * (HEIGHT_MAP.length - 1)
  const i = Math.min(HEIGHT_MAP.length - 2, Math.floor(t))
  const f = t - i
  return HEIGHT_MAP[i].map((c, n) => c + (HEIGHT_MAP[i + 1][n] - c) * f) as [number, number, number]
}

const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
function normalize(v: Vec3): Vec3 {
  const len = Math.hypot(...v) || 1
  return [v[0] / len, v[1] / len, v[2] / len]
}

const hexToRgb = (hex: string): [number, number, number] => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number]
const toHex = (rgb: [number, number, number]) =>
  "#" + rgb.map((c) => Math.round(Math.min(255, Math.max(0, c))).toString(16).padStart(2, "0")).join("")
const darker = (hex: string) => toHex(hexToRgb(hex).map((c) => c * 0.82) as [number, number, number])
