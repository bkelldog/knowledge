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
