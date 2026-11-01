// The parsed form of one expression. The parser builds it, the evaluator
// compiles it, and the pretty-printer turns it back into readable text.

export type BinaryOp = "+" | "-" | "*" | "/" | "^"

export type Node =
  | { kind: "number"; value: number }
  | { kind: "variable"; name: string }
  | { kind: "constant"; name: string }
  | { kind: "unary"; op: "-"; arg: Node }
  // `implicit` marks multiplication written without an operator, as in 2x.
  | { kind: "binary"; op: BinaryOp; left: Node; right: Node; implicit?: boolean }
  // `defined` marks a call to a function from the plot block, like f(x) = x^2,
  // rather than a built-in. extract.ts replaces these with the function's body.
  | { kind: "call"; name: string; args: Node[]; defined?: boolean }

/** Every variable name used in a tree, in first-seen order. */
export function variablesOf(node: Node, found: string[] = []): string[] {
  switch (node.kind) {
    case "variable":
      if (!found.includes(node.name)) found.push(node.name)
      break
    case "unary":
      variablesOf(node.arg, found)
      break
    case "binary":
      variablesOf(node.left, found)
      variablesOf(node.right, found)
      break
    case "call":
      node.args.forEach((arg) => variablesOf(arg, found))
      break
  }
  return found
}

/** A copy of a tree with variables replaced: substitute(x^2, {x: 2t}) is (2t)^2. */
export function substitute(node: Node, values: Record<string, Node>): Node {
  switch (node.kind) {
    case "variable":
      return values[node.name] ?? node
    case "unary":
      return { ...node, arg: substitute(node.arg, values) }
    case "binary":
      return { ...node, left: substitute(node.left, values), right: substitute(node.right, values) }
    case "call":
      return { ...node, args: node.args.map((a) => substitute(a, values)) }
    default:
      return node
  }
}
