// Samples a function into drawable pieces. A piece ends wherever the function
// is undefined (sqrt of a negative) or jumps (a step, tan's asymptotes), so no
// false vertical lines are drawn across a discontinuity.

export type Point = [number, number]
export type Piece = Point[]

const SAMPLES = 800
const BISECTIONS = 40

export function sample(f: (x: number) => number, min: number, max: number): Piece[] {
  const xs = Array.from({ length: SAMPLES + 1 }, (_, i) => min + ((max - min) * i) / SAMPLES)
  const ys = xs.map(f)

  // A jump has to be big relative to the curve to count.
  const finite = ys.filter(Number.isFinite)
  const spread = finite.length ? robustSpread(finite) : 1
  const threshold = 0.02 * (spread || 1)

  const pieces: Piece[] = []
  let piece: Piece = []
  const finish = () => {
    if (piece.length) pieces.push(piece)
    piece = []
  }

  for (let i = 0; i <= SAMPLES; i++) {
    const x = xs[i]
    const y = ys[i]
    if (!Number.isFinite(y)) {
      // Find where the curve stops, so sqrt(x) reaches all the way to 0.
      if (piece.length) piece.push(edge(f, piece[piece.length - 1][0], x))
      finish()
      continue
    }
    if (piece.length === 0 && i > 0 && !Number.isFinite(ys[i - 1])) piece.push(edge(f, x, xs[i - 1]))
    else if (piece.length) {
      const [px, py] = piece[piece.length - 1]
      if (Math.abs(y - py) > threshold) {
        const jump = findJump(f, px, x, py, y, threshold)
        if (jump) {
          piece.push(jump.before)
          finish()
          piece.push(jump.after)
        }
      }
    }
    piece.push([x, y])
  }
  finish()
  return pieces.filter((p) => p.length > 1)
}

/** Bisects between a defined point and an undefined one to find the boundary. */
function edge(f: (x: number) => number, defined: number, undefinedAt: number): Point {
  let a = defined
  let b = undefinedAt
  for (let k = 0; k < BISECTIONS; k++) {
    const m = (a + b) / 2
    if (Number.isFinite(f(m))) a = m
    else b = m
  }
  return [a, f(a)]
}

// Narrows [a, b] towards the steepest change. A continuous function's change
// shrinks as the interval does; a jump's doesn't.
function findJump(f: (x: number) => number, a: number, b: number, fa: number, fb: number, threshold: number) {
  for (let k = 0; k < BISECTIONS; k++) {
    const m = (a + b) / 2
    const fm = f(m)
    if (!Number.isFinite(fm)) return { before: edge(f, a, m), after: edge(f, b, m) }
    if (Math.abs(fm - fa) >= Math.abs(fb - fm)) {
      b = m
      fb = fm
    } else {
      a = m
      fa = fm
    }
  }
  if (Math.abs(fb - fa) <= threshold) return null
  return { before: [a, fa] as Point, after: [b, fb] as Point }
}

/** Spread of the middle 96% of values, so one asymptote doesn't dominate. */
export function robustSpread(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  const q = (p: number) => sorted[Math.min(sorted.length - 1, Math.floor(p * (sorted.length - 1)))]
  return q(0.98) - q(0.02)
}

/** A dot on a curve: filled where the curve takes that value, hollow where it only comes close. */
export interface Dot {
  x: number
  y: number
  open: boolean
}

/**
 * Dots where a curve jumps or has a hole, as a textbook draws them: u(t) gets
 * a hollow dot at (0, 0) and a filled one at (0, 1), since u(0) = 1. Pieces
 * from `sample` that meet at one x mark a jump or a single missing point.
 */
export function jumpDots(f: (x: number) => number, pieces: Piece[], min: number, max: number): Dot[] {
  const dots: Dot[] = []
  const gap = 1e-9 * (max - min)
  // Landing exactly on a jump, as sgn x does at 0, finds it twice.
  const add = (dot: Dot) => {
    const same = dots.find((d) => d.x === dot.x && d.y === dot.y)
    if (!same) dots.push(dot)
    else if (!dot.open) same.open = false
  }
  for (let i = 0; i + 1 < pieces.length; i++) {
    const [ax, ay] = pieces[i][pieces[i].length - 1]
    const [bx, by] = pieces[i + 1][0]
    if (bx - ax > gap || !Number.isFinite(ay) || !Number.isFinite(by)) continue
    const x = simplest(ax, bx)
    const value = f(x)
    const close = (a: number, b: number) => Math.abs(a - b) <= 1e-6 * Math.max(1, Math.abs(a), Math.abs(b))
    if (close(ay, by)) {
      // The curve carries on through: a hole, or a single point off the curve.
      if (!close(value, ay)) add({ x, y: ay, open: true })
      if (Number.isFinite(value) && !close(value, ay)) add({ x, y: value, open: false })
      continue
    }
    add({ x, y: ay, open: !close(value, ay) })
    add({ x, y: by, open: !close(value, by) })
    // A value on neither side, as sgn(0) = 0 is.
    if (Number.isFinite(value) && !close(value, ay) && !close(value, by)) add({ x, y: value, open: false })
  }
  return dots
}

/**
 * The simplest number in [a, b]: an integer, a short decimal, or a multiple of
 * π, so a jump found by bisection near 0 is placed at exactly 0.
 */
export function simplest(a: number, b: number): number {
  const mid = (a + b) / 2
  for (let digits = 0; digits <= 12; digits++) {
    const s = 10 ** digits
    for (const unit of [1, Math.PI]) {
      const c = (Math.round((mid / unit) * s) / s) * unit
      if (c >= a && c <= b) return c + 0 // never -0
    }
  }
  return mid
}
