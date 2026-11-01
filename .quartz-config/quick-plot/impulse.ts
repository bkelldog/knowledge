// Dirac impulses, written \dirac(t) or dirac(t). An impulse has no value to
// sample, so a curve is split into its ordinary part and its impulses, and
// each impulse is drawn as an arrow whose height is its weight:
//
//   dirac(t)              an arrow of height 1 at t = 0
//   3 dirac(t - 1)        height 3 at t = 1
//   u(t) + dirac(t)       a step, plus an arrow at 0
//   cos(t) dirac(t - pi)  height cos(π) = -1 at π, pointing down
//   dirac(2t - 4)         height 1/2 at t = 2, since δ(g(t)) = δ(t - r)/|g'(r)|
//
// Impulses can be added, subtracted, and multiplied or divided by ordinary
// expressions; anything else, like dirac(t)^2 or sin(dirac(t)), is an error.

import type { Node } from "./ast.ts"
import { compile, type Scope } from "./evaluate.ts"
import { simplest } from "./sample.ts"

export const DIRAC = "dirac"

interface Term {
  /** Multiplies the impulse; may depend on the variable. */
  weight: Node
  /** The impulse sits where this is zero. */
  arg: Node
}

export interface Split {
  /** The ordinary part of the curve; null when it's all impulses. */
  smooth: Node | null
  impulses: Term[]
}

export interface Impulse {
  x: number
  weight: number
}

export function hasImpulse(node: Node): boolean {
  switch (node.kind) {
    case "unary":
      return hasImpulse(node.arg)
    case "binary":
      return hasImpulse(node.left) || hasImpulse(node.right)
    case "call":
      return node.name === DIRAC || node.args.some(hasImpulse)
    default:
      return false
  }
}

const MISPLACED = "An impulse can only be added or scaled, like 3 \\dirac(t - 1) + u(t); it can't go inside another function or a power."

/** Splits a curve into its ordinary part and its impulses. */
export function splitImpulses(node: Node): Split {
  if (!hasImpulse(node)) return { smooth: node, impulses: [] }
  switch (node.kind) {
    case "call":
      if (node.name !== DIRAC || hasImpulse(node.args[0])) throw new Error(MISPLACED)
      return { smooth: null, impulses: [{ weight: { kind: "number", value: 1 }, arg: node.args[0] }] }
    case "unary": {
      const inner = splitImpulses(node.arg)
      return { smooth: inner.smooth && negate(inner.smooth), impulses: inner.impulses.map((t) => ({ ...t, weight: negate(t.weight) })) }
    }
    case "binary": {
      if (node.op === "+" || node.op === "-") {
        const left = splitImpulses(node.left)
        const right = splitImpulses(node.right)
        const rightImpulses = node.op === "-" ? right.impulses.map((t) => ({ ...t, weight: negate(t.weight) })) : right.impulses
        let smooth: Node | null = left.smooth
        if (right.smooth) smooth = smooth ? { kind: "binary", op: node.op, left: smooth, right: right.smooth } : node.op === "-" ? negate(right.smooth) : right.smooth
        return { smooth, impulses: [...left.impulses, ...rightImpulses] }
      }
      if (node.op === "*" || (node.op === "/" && !hasImpulse(node.right))) {
        if (hasImpulse(node.left) && hasImpulse(node.right)) throw new Error("Two impulses can't be multiplied together.")
        const impulseLeft = hasImpulse(node.left)
        const inner = splitImpulses(impulseLeft ? node.left : node.right)
        const factor = impulseLeft ? node.right : node.left
        const scale = (n: Node): Node =>
          node.op === "/" ? { kind: "binary", op: "/", left: n, right: factor } : impulseLeft ? { kind: "binary", op: "*", left: n, right: factor } : { kind: "binary", op: "*", left: factor, right: n }
        return { smooth: inner.smooth && scale(inner.smooth), impulses: inner.impulses.map((t) => ({ ...t, weight: scale(t.weight) })) }
      }
      if (node.op === "/") throw new Error("Can't divide by an impulse.")
      throw new Error(MISPLACED)
    }
    default:
      throw new Error(MISPLACED)
  }
}

const negate = (node: Node): Node => ({ kind: "unary", op: "-", arg: node })

const ROOT_SAMPLES = 2000

/**
 * Where each impulse lands between `min` and `max`, and its weight there.
 * δ(g(t)) puts an impulse of weight 1/|g'(r)| at each root r of g.
 */
export function placeImpulses(terms: Term[], variable: string, scope: Scope, min: number, max: number): Impulse[] {
  const found: Impulse[] = []
  const span = max - min
  for (const term of terms) {
    const g = compile(term.arg)
    const w = compile(term.weight)
    const at = (f: (s: Scope) => number, x: number) => f({ ...scope, [variable]: x })
    const gx = (x: number) => at(g, x)

    const xs = Array.from({ length: ROOT_SAMPLES + 1 }, (_, i) => min + (span * i) / ROOT_SAMPLES)
    const gs = xs.map(gx)
    const scale = Math.max(1, ...gs.filter(Number.isFinite).map(Math.abs))
    const roots: number[] = []
    for (let i = 0; i <= ROOT_SAMPLES; i++) {
      if (gs[i] === 0) roots.push(xs[i])
      else if (i > 0 && gs[i - 1] !== 0 && Number.isFinite(gs[i - 1]) && Number.isFinite(gs[i]) && Math.sign(gs[i - 1]) !== Math.sign(gs[i])) {
        let [a, b, ga] = [xs[i - 1], xs[i], gs[i - 1]]
        for (let k = 0; k < 60; k++) {
          const m = (a + b) / 2
          const gm = gx(m)
          if (Math.sign(gm) === Math.sign(ga)) [a, ga] = [m, gm]
          else b = m
        }
        // A sign change across a pole, as in 1/t, isn't a root.
        const r = (a + b) / 2
        if (Math.abs(gx(r)) < 1e-6 * scale) roots.push(r)
      }
    }

    for (const raw of roots) {
      const eps = 1e-9 * span
      const r = simplest(raw - eps, raw + eps)
      const h = 1e-6 * span
      const slope = (gx(r + h) - gx(r - h)) / (2 * h)
      if (!(Math.abs(slope) > 1e-9)) {
        throw new Error("An impulse's argument has to cross zero, not just touch it, like \\dirac(t - 1) but not \\dirac(t^2).")
      }
      const weight = Number((at(w, r) / Math.abs(slope)).toPrecision(10))
      if (!Number.isFinite(weight) || weight === 0) continue
      // Impulses at the same place add up.
      const same = found.find((f) => Math.abs(f.x - r) <= eps)
      if (same) same.weight = Number((same.weight + weight).toPrecision(10))
      else found.push({ x: r, weight })
    }
  }
  return found.filter((f) => f.weight !== 0)
}
