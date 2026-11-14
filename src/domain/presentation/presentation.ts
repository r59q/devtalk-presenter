import { paint, type Color, type ColorValue } from '../geometry/color.ts'
import type { Slide } from './slide.ts'

export interface PresentationOptions {
  readonly background?: ColorValue
}

export class Presentation {
  readonly title: string
  readonly slides: readonly Slide[]
  readonly background: Color

  constructor(title: string, slides: readonly Slide[], { background = '#0d1117' }: PresentationOptions = {}) {
    if (slides.length === 0) throw new Error(`"${title}" needs at least one slide`)
    this.title = title
    this.slides = slides
    this.background = paint(background)
  }
}
