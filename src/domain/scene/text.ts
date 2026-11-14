import { paint, type Color, type ColorValue } from '../geometry/color.ts'
import { Element, type Placement } from './element.ts'
import type { Surface, TextAlign } from './surface.ts'

export const fonts = {
  sans: 'Inter, "Segoe UI", system-ui, -apple-system, sans-serif',
  mono: '"JetBrains Mono", "Fira Code", ui-monospace, SFMono-Regular, Menlo, monospace',
} as const

/** Text can be fixed or computed on every frame, e.g. from what the audience typed. */
export type TextContent = string | (() => string)

export interface TextOptions extends Placement {
  readonly size?: number
  readonly font?: string
  readonly weight?: number
  readonly color?: ColorValue
  readonly align?: TextAlign
  readonly lineHeight?: number
}

export class TextElement extends Element {
  content: TextContent
  size: number
  font: string
  weight: number
  color: Color
  align: TextAlign
  lineHeight: number
  /** Share of characters shown, 0–1. Animate it for a typewriter effect. */
  reveal = 1

  constructor(content: TextContent, options: TextOptions = {}) {
    super(options)
    this.content = content
    this.size = options.size ?? 64
    this.font = options.font ?? fonts.sans
    this.weight = options.weight ?? 600
    this.color = paint(options.color ?? '#e6edf3')
    this.align = options.align ?? 'center'
    this.lineHeight = options.lineHeight ?? 1.25
  }

  get text(): string {
    return typeof this.content === 'function' ? this.content() : this.content
  }

  protected paint(surface: Surface): void {
    const characters = [...this.text]
    const visible = characters.slice(0, Math.round(characters.length * this.reveal)).join('')
    surface.text(visible.split('\n'), this)
  }
}
