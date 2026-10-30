// Compiles a tree into a plain JavaScript function of its variables. No eval:
// the tree becomes nested closures, which is fast enough for sampling.

import type { Node } from "./ast.ts"
import { CONSTANTS, FUNCTIONS } from "./builtins.ts"

export type Scope = Record<string, number>
export type Compiled = (scope: Scope) => number

export function compile(node: Node): Compiled {
  switch (node.kind) {
    case "number": {
      const value = node.value
      return () => value
    }
    case "constant": {
      const value = CONSTANTS[node.name]
      return () => value
    }
    case "variable": {
      const name = node.name
      return (scope) => scope[name] ?? NaN
    }
    case "unary": {
      const arg = compile(node.arg)
      return (scope) => -arg(scope)
    }
    case "binary": {
      const left = compile(node.left)
      const right = compile(node.right)
      switch (node.op) {
        case "+":
          return (s) => left(s) + right(s)
        case "-":
          return (s) => left(s) - right(s)
        case "*":
          return (s) => left(s) * right(s)
        case "/":
          return (s) => left(s) / right(s)
        case "^":
          return (s) => power(left(s), right(s))
      }
    }
    // falls through only if a new BinaryOp is added without a case
    case "call": {
      const fn = FUNCTIONS[node.name].fn
      const args = node.args.map(compile)
      if (args.length === 1) {
        const [a] = args
        return (s) => fn(a(s))
      }
      return (s) => fn(...args.map((a) => a(s)))
    }
  }
}

// Math.pow gives NaN for a negative base with a fractional exponent. For odd
// roots written as fractions, like x^(1/3), use the real root instead.
function power(base: number, exp: number): number {
  const result = Math.pow(base, exp)
  if (!Number.isNaN(result) || base >= 0) return result
  const inverse = 1 / exp
  const odd = Math.round(inverse)
  if (Math.abs(inverse - odd) < 1e-9 && odd % 2 !== 0) return -Math.pow(-base, exp)
  return result
}
