// The functions, constants and variable names the parser knows. To support a
// new function, add it to FUNCTIONS; the lexer, parser and evaluator pick it up.

export interface FunctionDef {
  /** Fewest and most arguments; `Infinity` for variadic functions. */
  arity: [number, number]
  fn: (...args: number[]) => number
  /**
   * May be written without parentheses, as in `sin x` or `ln 2x`. Functions
   * whose names are also common variables (u, step) must use parentheses.
   */
  bare?: boolean
  /** Name of the inverse, for `sin^-1 x`. */
  inverse?: string
}

const heaviside = (t: number) => (t >= 0 ? 1 : 0)

export const FUNCTIONS: Record<string, FunctionDef> = {
  sin: { arity: [1, 1], fn: Math.sin, bare: true, inverse: "asin" },
  cos: { arity: [1, 1], fn: Math.cos, bare: true, inverse: "acos" },
  tan: { arity: [1, 1], fn: Math.tan, bare: true, inverse: "atan" },
  sec: { arity: [1, 1], fn: (x) => 1 / Math.cos(x), bare: true },
  csc: { arity: [1, 1], fn: (x) => 1 / Math.sin(x), bare: true },
  cot: { arity: [1, 1], fn: (x) => 1 / Math.tan(x), bare: true },
  asin: { arity: [1, 1], fn: Math.asin, bare: true },
  acos: { arity: [1, 1], fn: Math.acos, bare: true },
  atan: { arity: [1, 1], fn: Math.atan, bare: true },
  arcsin: { arity: [1, 1], fn: Math.asin, bare: true },
  arccos: { arity: [1, 1], fn: Math.acos, bare: true },
  arctan: { arity: [1, 1], fn: Math.atan, bare: true },
  sinh: { arity: [1, 1], fn: Math.sinh, bare: true },
  cosh: { arity: [1, 1], fn: Math.cosh, bare: true },
  tanh: { arity: [1, 1], fn: Math.tanh, bare: true },
  exp: { arity: [1, 1], fn: Math.exp, bare: true },
  ln: { arity: [1, 1], fn: Math.log, bare: true },
  log: { arity: [1, 1], fn: Math.log10, bare: true },
  log2: { arity: [1, 1], fn: Math.log2, bare: true },
  sqrt: { arity: [1, 1], fn: Math.sqrt, bare: true },
  cbrt: { arity: [1, 1], fn: Math.cbrt, bare: true },
  abs: { arity: [1, 1], fn: Math.abs },
  sign: { arity: [1, 1], fn: Math.sign },
  sgn: { arity: [1, 1], fn: Math.sign },
  floor: { arity: [1, 1], fn: Math.floor },
  ceil: { arity: [1, 1], fn: Math.ceil },
  round: { arity: [1, 1], fn: Math.round },
  min: { arity: [1, Infinity], fn: Math.min },
  max: { arity: [1, Infinity], fn: Math.max },
  // Signals: unit step (u(0) = 1), rectangle of width 1, normalised sinc.
  u: { arity: [1, 1], fn: heaviside },
  step: { arity: [1, 1], fn: heaviside },
  heaviside: { arity: [1, 1], fn: heaviside },
  rect: { arity: [1, 1], fn: (t) => (Math.abs(t) <= 0.5 ? 1 : 0) },
  sinc: { arity: [1, 1], fn: (t) => (t === 0 ? 1 : Math.sin(Math.PI * t) / (Math.PI * t)) },
}

export const CONSTANTS: Record<string, number> = {
  pi: Math.PI,
  e: Math.E,
}

/**
 * Greek letters, always variables. Written as in LaTeX (\omega), as symbols
 * (ω), or as a plain word standing alone (omega, but not omegax). π is the
 * exception: it's the constant pi.
 */
export const GREEK: Record<string, string> = {
  alpha: "α", beta: "β", gamma: "γ", delta: "δ", epsilon: "ε", zeta: "ζ", eta: "η", theta: "θ",
  iota: "ι", kappa: "κ", lambda: "λ", mu: "μ", nu: "ν", xi: "ξ", rho: "ρ", sigma: "σ", tau: "τ",
  upsilon: "υ", phi: "φ", chi: "χ", psi: "ψ", omega: "ω",
  Gamma: "Γ", Delta: "Δ", Theta: "Θ", Lambda: "Λ", Xi: "Ξ", Pi: "Π", Sigma: "Σ", Upsilon: "Υ",
  Phi: "Φ", Psi: "Ψ", Omega: "Ω",
}

/** Variant forms, read as the same variable as their plain letter. */
export const GREEK_VARIANTS: Record<string, string> = {
  varepsilon: "epsilon", vartheta: "theta", varphi: "phi", varrho: "rho", varsigma: "sigma",
}

/** Function and constant names longer than a letter, longest first, for splitting runs like `xsinx`. */
export const KNOWN_NAMES = [...Object.keys(FUNCTIONS), ...Object.keys(CONSTANTS)]
  .filter((name) => name.length > 1)
  .sort((a, b) => b.length - a.length)
