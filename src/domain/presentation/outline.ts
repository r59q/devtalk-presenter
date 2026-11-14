import { clamp } from '../geometry/numbers.ts'

/** Where the presentation is: a slide, and how many of its steps have played. Both zero based. */
export interface Position {
  readonly slide: number
  /** 0 is the entrance. */
  readonly step: number
}

/** The shape of a presentation: how many steps each slide has. Knows how to move through it. */
export class Outline {
  readonly #stepCounts: readonly number[]

  constructor(stepCounts: readonly number[]) {
    if (stepCounts.length === 0 || stepCounts.some((count) => count < 1)) {
      throw new Error('Every slide needs at least its entrance step')
    }
    this.#stepCounts = stepCounts
  }

  get slideCount(): number {
    return this.#stepCounts.length
  }

  get first(): Position {
    return { slide: 0, step: 0 }
  }

  get last(): Position {
    const slide = this.#stepCounts.length - 1
    return { slide, step: this.lastStep(slide) }
  }

  next({ slide, step }: Position): Position | undefined {
    if (step < this.lastStep(slide)) return { slide, step: step + 1 }
    if (slide < this.#stepCounts.length - 1) return { slide: slide + 1, step: 0 }
    return undefined
  }

  previous({ slide, step }: Position): Position | undefined {
    if (step > 0) return { slide, step: step - 1 }
    if (slide > 0) return { slide: slide - 1, step: this.lastStep(slide - 1) }
    return undefined
  }

  /** The nearest valid position, e.g. after slides were removed from a script. */
  clamp({ slide, step }: Position): Position {
    const validSlide = clamp(Math.trunc(slide), 0, this.#stepCounts.length - 1)
    return { slide: validSlide, step: clamp(Math.trunc(step), 0, this.lastStep(validSlide)) }
  }

  /** The number of steps `slide` has after its entrance. */
  lastStep(slide: number): number {
    return this.#stepCounts[slide] - 1
  }
}
