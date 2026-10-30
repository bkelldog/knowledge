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
  | { kind: "call"; name: string; args: Node[] }

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
