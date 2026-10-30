// Parses plain math (after normalizeMath) into a tree. It is forgiving in the
// ways people write math by hand:
//
//   2x, x(x+1), 2 sin x      implicit multiplication
//   x^2x                     the exponent is one term: (x^2)·x, as on a calculator
//   e^-x                     a sign may start an exponent
//   sin x, sin 2x cos x      functions without parentheses take the next product
//   sin^2 x, sin^-1 x        power of a function, and its inverse
//   |x - 1|                  absolute value
//   (x + 1                   missing closing parentheses are added at the end
//   \omega t, x_0, V_{in}    Greek letters and subscripts name variables

import type { Node } from "./ast.ts"
import { CONSTANTS, FUNCTIONS, GREEK, KNOWN_NAMES } from "./builtins.ts"

export class ParseError extends Error {
  readonly position: number

  constructor(message: string, position: number) {
    super(message)
    this.position = position
  }
}

type TokenType = "number" | "name" | "op" | "(" | ")" | "," | "|" | "end"

interface Token {
  type: TokenType
  text: string
  position: number
  /** Whitespace directly before the token. */
  spaced: boolean
  /** A Greek letter or a subscripted name: always a variable. */
  variable?: boolean
}

export function tokenize(input: string): Token[] {
  const tokens: Token[] = []
  let i = 0
  let spaced = false
  const push = (type: TokenType, text: string, position: number, variable = false) => {
    tokens.push({ type, text, position, spaced, variable })
    spaced = false
  }
  // A subscript right after a name makes it part of the name: x_0, V_{in}.
  const subscript = () => {
    if (input[i] !== "_") return
    const last = tokens[tokens.length - 1]
    const at = i
    let sub: string
    if (input[i + 1] === "{") {
      const close = input.indexOf("}", i)
      sub = close === -1 ? "" : input.slice(i + 2, close)
      if (!/^[a-zA-Z0-9]+$/.test(sub)) throw new ParseError("A subscript can only hold letters and digits, like x_0 or V_{in}", at)
      i = close + 1
    } else {
      sub = input[i + 1] ?? ""
      if (!/^[a-zA-Z0-9]$/.test(sub)) throw new ParseError("Missing the subscript after _", at)
      i += 2
    }
    if (last?.type !== "name" || (last.text in FUNCTIONS && last.text.length > 1)) {
      throw new ParseError("Only variables can have subscripts", at)
    }
    last.text = `${last.text}_${sub}`
    last.variable = true
  }
  while (i < input.length) {
    const ch = input[i]
    if (/\s/.test(ch)) {
      spaced = true
      i++
    } else if (/[0-9.]/.test(ch)) {
      const m = /^(\d+\.?\d*|\.\d+)/.exec(input.slice(i))
      if (!m) throw new ParseError(`Unexpected "${ch}"`, i)
      push("number", m[0], i)
      i += m[0].length
    } else if (/[a-zA-Z]/.test(ch)) {
      // A run of letters is split into known names, longest first, and
      // otherwise into single-letter variables: xsinx → x sin x. A run that is
      // exactly a Greek letter's name, standing alone, is that letter: "eta"
      // and "2 eta" are η, but "etax" is e·t·a·x.
      const run = /^[a-zA-Z]+[0-9]?/.exec(input.slice(i))![0]
      const letters = run.replace(/[0-9]$/, "")
      let j = 0
      if (letters.length > 1 && letters in GREEK) {
        push("name", letters, i, true)
        j = letters.length
      }
      while (j < run.length) {
        const rest = run.slice(j)
        const known = KNOWN_NAMES.find((name) => rest.startsWith(name))
        const take = known ?? (/^[a-zA-Z]/.test(rest) ? rest[0] : rest)
        if (/^[0-9]$/.test(take)) push("number", take, i + j)
        else push("name", take, i + j)
        j += take.length
      }
      i += run.length
      subscript()
    } else if ("+-*/^".includes(ch)) {
      push("op", ch, i++)
    } else if ("(),|".includes(ch)) {
      push(ch as TokenType, ch, i++)
    } else if (ch === "[") {
      push("(", "(", i++)
    } else if (ch === "]") {
      push(")", ")", i++)
    } else if (ch === "\\") {
      const command = /^\\[a-zA-Z]+/.exec(input.slice(i))?.[0] ?? "\\"
      const name = command.slice(1)
      if (!(name in GREEK)) throw new ParseError(`Unknown LaTeX command ${command}`, i)
      push("name", name, i, true)
      i += command.length
      subscript()
    } else {
      throw new ParseError(`Unexpected "${ch}"`, i)
    }
  }
  push("end", "", input.length)
  return tokens
}

const isFunction = (name: string) => name in FUNCTIONS

/** Writes a variable's name back as input text: omega_0 → \\omega_{0}. */
export function variableSource(name: string): string {
  const [base, sub] = name.split("_")
  return (base in GREEK ? `\\${base}` : base) + (sub ? `_{${sub}}` : "")
}

/**
 * The variable named by normalised text that is exactly one variable, like
 * "x", "\\omega" or "V_{in}"; otherwise null.
 */
export function variableName(text: string): string | null {
  let tokens: Token[]
  try {
    tokens = tokenize(text)
  } catch {
    return null
  }
  if (tokens.length !== 2 || tokens[0].type !== "name") return null
  const { text: name, variable } = tokens[0]
  if (variable) return name
  return name.length === 1 && !(name in CONSTANTS) ? name : null
}

export interface ParseResult {
  node: Node
  /** Readings worth pointing out, such as x^2x meaning x²·x. */
  notes: string[]
}

export function parse(input: string): ParseResult {
  return new Parser(tokenize(input)).parseAll()
}

class Parser {
  private i = 0
  private absDepth = 0
  readonly notes: string[] = []

  private readonly tokens: Token[]

  constructor(tokens: Token[]) {
    this.tokens = tokens
  }

  private peek(): Token {
    return this.tokens[this.i]
  }

  private next() {
    return this.tokens[this.i++]
  }

  private isOp(text: string) {
    return this.peek().type === "op" && this.peek().text === text
  }

  parseAll(): ParseResult {
    if (this.peek().type === "end") throw new ParseError("Nothing to plot", 0)
    const node = this.parseSum()
    if (this.peek().type !== "end") {
      const t = this.peek()
      throw new ParseError(t.type === ")" ? "Unmatched )" : `Unexpected "${t.text}"`, t.position)
    }
    return { node, notes: this.notes }
  }

  private parseSum(): Node {
    let left = this.parseProduct()
    while (this.isOp("+") || this.isOp("-")) {
      const op = this.next().text as "+" | "-"
      left = { kind: "binary", op, left, right: this.parseProduct() }
    }
    return left
  }

  /** Can the current token begin a factor, making an implicit product? */
  private startsFactor(): boolean {
    const t = this.peek()
    if (t.type === "number" || t.type === "name" || t.type === "(") return true
    // Inside |…| a bar here closes the absolute value instead.
    return t.type === "|" && this.absDepth === 0
  }

  private parseProduct(): Node {
    let left = this.parseUnary()
    for (;;) {
      if (this.isOp("*") || this.isOp("/")) {
        const op = this.next().text as "*" | "/"
        left = { kind: "binary", op, left, right: this.parseUnary() }
      } else if (this.startsFactor()) {
        this.noteTightExponent(left)
        left = { kind: "binary", op: "*", left, right: this.parsePower(), implicit: true }
      } else {
        return left
      }
    }
  }

  // x^2x reads as x²·x. Say so, since x^(2x) may have been meant.
  // Token span of the most recent exponent.
  private lastPowerStart = -1
  private lastPowerEnd = -1
  private noteTightExponent(left: Node) {
    const tight = left.kind === "binary" && left.op === "^" && this.lastPowerEnd === this.i && !this.peek().spaced
    // An exponent in parentheses, as in x^(2)x, was clearly meant to end there.
    if (tight && this.tokens[this.i - 1].type !== ")") {
      const exponent = this.tokens.slice(this.lastPowerStart, this.lastPowerEnd).map((t) => t.text).join("")
      const factor = this.peek().text
      this.notes.push(`Read "^${exponent}${factor}" as a power times ${factor}. To put ${factor} in the exponent, write ^(${exponent}${factor}).`)
    }
  }

  private parseUnary(): Node {
    if (this.isOp("-")) {
      this.next()
      return { kind: "unary", op: "-", arg: this.parseUnary() }
    }
    if (this.isOp("+")) {
      this.next()
      return this.parseUnary()
    }
    return this.parsePower()
  }

  private parsePower(): Node {
    const base = this.parseAtom()
    if (!this.isOp("^")) return base
    this.next()
    const start = this.i
    const node: Node = { kind: "binary", op: "^", left: base, right: this.parseExponent() }
    this.lastPowerStart = start
    this.lastPowerEnd = this.i
    return node
  }

  private parseExponent(): Node {
    if (this.isOp("-")) {
      this.next()
      return { kind: "unary", op: "-", arg: this.parseExponent() }
    }
    if (this.isOp("+")) {
      this.next()
      return this.parseExponent()
    }
    return this.parsePower()
  }

  private parseAtom(): Node {
    const t = this.peek()
    switch (t.type) {
      case "number": {
        this.next()
        const value = Number(t.text)
        if (Number.isNaN(value)) throw new ParseError(`Bad number "${t.text}"`, t.position)
        return { kind: "number", value }
      }
      case "(": {
        this.next()
        const inner = this.parseSum()
        this.close(t.position)
        return inner
      }
      case "|": {
        this.next()
        this.absDepth++
        const inner = this.parseSum()
        this.absDepth--
        if (this.peek().type !== "|") throw new ParseError("Missing closing |", t.position)
        this.next()
        return { kind: "call", name: "abs", args: [inner] }
      }
      case "name":
        return this.parseName()
      case "end":
        throw new ParseError("The expression ends too early", t.position)
      default:
        throw new ParseError(`Unexpected "${t.text}"`, t.position)
    }
  }

  /** Consumes a ")"; one missing at the very end is forgiven. */
  private close(openedAt: number) {
    if (this.peek().type === ")") {
      this.next()
    } else if (this.peek().type === "end") {
      if (!this.notes.includes("Added a missing )")) this.notes.push("Added a missing )")
    } else {
      throw new ParseError("Missing )", openedAt)
    }
  }

  private parseName(): Node {
    const t = this.next()
    const name = t.text
    if (t.variable) return { kind: "variable", name }
    if (name in CONSTANTS) return { kind: "constant", name }
    if (!isFunction(name)) {
      if (name.length === 1) return { kind: "variable", name }
      throw new ParseError(`Unknown name "${name}"`, t.position)
    }

    const def = FUNCTIONS[name]
    // Functions that need parentheses double as variables without them (u, step).
    if (!def.bare && this.peek().type !== "(") {
      if (name.length === 1) return { kind: "variable", name }
      throw new ParseError(`${name} needs parentheses, like ${name}(x)`, t.position)
    }

    // sin^2 x = (sin x)^2; sin^-1 x = asin x.
    let power: Node | null = null
    let callName = name
    if (this.isOp("^")) {
      this.next()
      power = this.parseExponent()
      const minusOne = power.kind === "unary" && power.arg.kind === "number" && power.arg.value === 1
      if (minusOne && def.inverse) {
        callName = def.inverse
        power = null
      }
    }

    let args: Node[]
    if (this.peek().type === "(") {
      const open = this.next()
      args = this.peek().type === ")" ? [] : [this.parseSum()]
      while (this.peek().type === ",") {
        this.next()
        args.push(this.parseSum())
      }
      this.close(open.position)
    } else if (FUNCTIONS[callName].bare) {
      args = [this.parseBareArgument(t.position)]
    } else {
      throw new ParseError(`${name} needs parentheses, like ${name}(x)`, t.position)
    }

    const [lo, hi] = FUNCTIONS[callName].arity
    if (args.length < lo || args.length > hi) {
      const want = lo === hi ? `${lo}` : hi === Infinity ? `at least ${lo}` : `${lo} to ${hi}`
      throw new ParseError(`${name} takes ${want} argument${want === "1" ? "" : "s"}`, t.position)
    }
    const call: Node = { kind: "call", name: callName, args }
    return power ? { kind: "binary", op: "^", left: call, right: power } : call
  }

  // `sin 2x cos x`: the argument is the product up to the next function name.
  private parseBareArgument(at: number): Node {
    if (!this.startsFactor() && !this.isOp("-")) throw new ParseError("Missing the function's argument", at)
    let arg = this.isOp("-") ? (this.next(), { kind: "unary", op: "-", arg: this.parsePower() } as Node) : this.parsePower()
    while (this.startsFactor() && !(this.peek().type === "name" && isFunction(this.peek().text))) {
      arg = { kind: "binary", op: "*", left: arg, right: this.parsePower(), implicit: true }
    }
    return arg
  }
}
