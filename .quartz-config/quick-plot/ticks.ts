// Picks round tick values (1, 2 or 5 × 10ⁿ apart, or multiples of π) and
// formats their labels.

export interface Tick {
  value: number
  label: string
}

export function niceStep(span: number, target: number): number {
  const raw = span / target
  const magnitude = Math.pow(10, Math.floor(Math.log10(raw)))
  const scaled = raw / magnitude
  const nice = scaled < 1.5 ? 1 : scaled < 3 ? 2 : scaled < 7 ? 5 : 10
  return nice * magnitude
}

export function ticks(min: number, max: number, target: number, piTicks: boolean): Tick[] {
  return piTicks ? piBased(min, max, target) : decimal(min, max, target)
}

function decimal(min: number, max: number, target: number): Tick[] {
  const step = niceStep(max - min, target)
  const decimals = Math.max(0, -Math.floor(Math.log10(step) + 1e-9))
  const out: Tick[] = []
  for (let k = Math.ceil(min / step - 1e-9); k * step <= max + step * 1e-9; k++) {
    const value = k * step
    out.push({ value, label: formatDecimal(value, decimals) })
  }
  return out
}

function formatDecimal(value: number, decimals: number): string {
  const text = Math.abs(value) < 1e-12 ? "0" : value.toFixed(decimals)
  return text.replace("-", "−")
}

// Steps of π/4, π/2, π, 2π, … whichever gives about `target` ticks.
function piBased(min: number, max: number, target: number): Tick[] {
  const span = (max - min) / Math.PI
  const fractions = [1 / 4, 1 / 2, 1, 2, 5, 10]
  const fraction = fractions.find((f) => span / f <= target * 1.5) ?? niceStep(span, target)
  const step = fraction * Math.PI
  const out: Tick[] = []
  for (let k = Math.ceil(min / step - 1e-9); k * step <= max + step * 1e-9; k++) {
    out.push({ value: k * step, label: piLabel(k * fraction) })
  }
  return out
}

/** 0, π, −π, 2π, π/2, 3π/4 … for a multiple of π. */
function piLabel(multiple: number): string {
  if (Math.abs(multiple) < 1e-9) return "0"
  const sign = multiple < 0 ? "−" : ""
  const m = Math.abs(multiple)
  for (const den of [1, 2, 4]) {
    const num = Math.round(m * den)
    if (Math.abs(num / den - m) < 1e-9) {
      const top = num === 1 ? "π" : `${num}π`
      return sign + (den === 1 ? top : `${top}/${den}`)
    }
  }
  return sign + `${Number(m.toPrecision(3))}π`
}
