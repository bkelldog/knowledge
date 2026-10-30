// Curve styles: colour, line thickness and dashes, written in square brackets
// at the end of a line:
//
//   sin x [blue]
//   cos x [#e11d48, thick, dashed]
//   x^2 [green, 3px]
//   e^-x [navy / skyblue]        separate colours for light and dark mode
//
// Colours are adjusted for contrast in each theme: a colour too pale for a
// light page is darkened there, and one too dark for a dark page is lightened.

export interface Color {
  light: string
  /** Set when the dark-mode colour was given; otherwise derived from `light`. */
  dark: string | null
}

export interface Style {
  color: Color | null
  width: number | null
  dash: "solid" | "dashed" | "dotted" | null
}

export const NAMED_COLORS: Record<string, string> = {
  red: "#c8392b",
  orange: "#dd6b20",
  amber: "#b45309",
  yellow: "#d4a017",
  green: "#15803d",
  teal: "#0e7490",
  cyan: "#0891b2",
  blue: "#2563eb",
  navy: "#1e3a8a",
  skyblue: "#38bdf8",
  indigo: "#4f46e5",
  purple: "#7c3aed",
  pink: "#db2777",
  brown: "#8b5a2b",
  gray: "#6b7280",
  grey: "#6b7280",
  black: "#000000",
  white: "#ffffff",
}

/** Curve colours in order, when none is given. */
export const DEFAULT_COLORS = ["red", "blue", "green", "amber", "purple", "teal"].map((n): Color => ({ light: NAMED_COLORS[n], dark: null }))

export const WIDTHS: Record<string, number> = { thin: 1, normal: 2, thick: 3 }
export const DEFAULT_WIDTH = 2

/** Reads one colour: a name, #rgb or #rrggbb, or "light / dark". */
export function parseColor(text: string): Color | null {
  const [light, dark, extra] = text.split("/").map((p) => p.trim())
  if (extra !== undefined) return null
  const l = colorValue(light)
  if (!l) return null
  if (dark === undefined) return { light: l, dark: null }
  const d = colorValue(dark)
  return d ? { light: l, dark: d } : null
}

function colorValue(text: string): string | null {
  const t = text.toLowerCase()
  if (t in NAMED_COLORS) return NAMED_COLORS[t]
  if (/^#[0-9a-f]{6}$/.test(t)) return t
  if (/^#[0-9a-f]{3}$/.test(t)) return "#" + [...t.slice(1)].map((c) => c + c).join("")
  return null
}

/**
 * Splits a trailing [style] off a line. Returns null for the style when the
 * brackets hold math instead, like x^2 [x + 1]; throws when they look like a
 * style but something in them isn't one.
 */
export function splitStyle(text: string): { rest: string; style: Style | null } {
  const t = text.trim()
  if (!t.endsWith("]")) return { rest: t, style: null }
  const open = t.lastIndexOf("[")
  if (open <= 0) return { rest: t, style: null }
  const items = t.slice(open + 1, -1).split(",").map((s) => s.trim()).filter(Boolean)
  const style: Style = { color: null, width: null, dash: null }
  const unknown: string[] = []
  let known = 0
  for (const item of items) {
    if (readStyleItem(item, style)) known++
    else unknown.push(item)
  }
  if (known === 0) return { rest: t, style: null }
  if (unknown.length) {
    throw new Error(`Unknown style "${unknown[0]}". Use a colour (${Object.keys(NAMED_COLORS).slice(0, 8).join(", ")}, …, or #hex), thin, thick, a width like 3px, dashed or dotted.`)
  }
  return { rest: t.slice(0, open).trim(), style }
}

function readStyleItem(item: string, style: Style): boolean {
  const word = item.toLowerCase()
  // A width needs "px" or a label, so a bare number stays math: 3px, width 3.
  const width = /^(?:(width|thickness)\s*:?\s*)?(\d+(?:\.\d+)?)\s*(px)?$/.exec(word)
  if (width && (width[1] || width[3])) {
    style.width = Number(width[2])
    return true
  }
  const plain = word.replace(/^colou?r\s*:?\s*/, "")
  const color = parseColor(plain)
  if (color) {
    style.color = color
    return true
  }
  if (plain in WIDTHS) {
    style.width = WIDTHS[plain]
    return true
  }
  if (plain === "dashed" || plain === "dotted" || plain === "solid") {
    style.dash = plain
    return true
  }
  return false
}

// Page backgrounds the colours are checked against, and the contrast to keep
// (WCAG's 4.5:1, so thin lines stay easy to see).
const LIGHT_BACKGROUND = "#ffffff"
const DARK_BACKGROUND = "#1e1e1e"
const CONTRAST = 4.5

/** The colour to use in each theme, adjusted for contrast unless `exact`. */
export function themeColors(color: Color, exact: boolean): { light: string; dark: string } {
  if (exact) return { light: color.light, dark: color.dark ?? color.light }
  return {
    light: withContrast(color.light, LIGHT_BACKGROUND, -1),
    dark: withContrast(color.dark ?? color.light, DARK_BACKGROUND, +1),
  }
}

/** Darkens (-1) or lightens (+1) a colour until it stands out on `background`. */
function withContrast(hex: string, background: string, direction: 1 | -1): string {
  let [h, s, l] = toHsl(hex)
  let out = hex
  for (let k = 0; k < 60 && contrast(out, background) < CONTRAST; k++) {
    l = Math.min(1, Math.max(0, l + direction * 0.02))
    out = fromHsl(h, s, l)
  }
  return out
}

export function contrast(a: string, b: string): number {
  const [la, lb] = [luminance(a), luminance(b)]
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

function luminance(hex: string): number {
  const [r, g, b] = rgb(hex).map((c) => {
    const v = c / 255
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))

function toHsl(hex: string): [number, number, number] {
  const [r, g, b] = rgb(hex).map((c) => c / 255)
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return [0, 0, l]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4
  return [h / 6, s, l]
}

function fromHsl(h: number, s: number, l: number): string {
  const f = (n: number) => {
    const k = (n + h * 12) % 12
    const a = s * Math.min(l, 1 - l)
    return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))
  }
  return "#" + [f(0), f(8), f(4)].map((v) => Math.round(v * 255).toString(16).padStart(2, "0")).join("")
}

/**
 * CSS that colours each series in light and dark mode. Rules are scoped to
 * one plot, and follow Obsidian's theme classes, Quartz's saved-theme
 * attribute, and otherwise the system setting.
 */
export function themeCss(plotClass: string, colors: { light: string; dark: string }[]): string {
  const rules = (pick: "light" | "dark", prefix: string) =>
    colors
      .map((c, i) => `${prefix.split(",").map((p) => `${p} .${plotClass} .qp-s${i}`.trim()).join(",")}{color:${c[pick]}}`)
      .join("")
  return (
    rules("light", "") +
    `@media (prefers-color-scheme: dark){${rules("dark", "")}}` +
    rules("dark", ".theme-dark,[saved-theme=dark]") +
    rules("light", ".theme-light,[saved-theme=light]")
  )
}
