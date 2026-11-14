import { clamp, lerp } from './numbers.ts'

export interface Color {
  readonly r: number
  readonly g: number
  readonly b: number
  /** Alpha in the range 0–1. */
  readonly a: number
}

export const transparent: Color = { r: 0, g: 0, b: 0, a: 0 }

/** Parses `#rgb`, `#rgba`, `#rrggbb` and `#rrggbbaa`. */
export function hex(value: string): Color {
  const digits = value.replace(/^#/, '')
  const expanded = digits.length <= 4 ? [...digits].map((d) => d + d).join('') : digits
  if (!/^([0-9a-f]{6}|[0-9a-f]{8})$/i.test(expanded)) {
    throw new Error(`Invalid hex color: ${value}`)
  }
  const channel = (index: number) => parseInt(expanded.slice(index, index + 2), 16)
  return {
    r: channel(0),
    g: channel(2),
    b: channel(4),
    a: expanded.length === 8 ? channel(6) / 255 : 1,
  }
}

export function mixColors(from: Color, to: Color, t: number): Color {
  return {
    r: lerp(from.r, to.r, t),
    g: lerp(from.g, to.g, t),
    b: lerp(from.b, to.b, t),
    a: lerp(from.a, to.a, t),
  }
}

export function withAlpha(color: Color, a: number): Color {
  return { ...color, a }
}

export function toCss(color: Color): string {
  const channel = (value: number) => Math.round(clamp(value, 0, 255))
  return `rgba(${channel(color.r)}, ${channel(color.g)}, ${channel(color.b)}, ${clamp(color.a, 0, 1)})`
}

/** A color, or a hex string such as `#58a6ff`. */
export type ColorValue = Color | string

export function paint(value: ColorValue): Color {
  return typeof value === 'string' ? hex(value) : value
}
