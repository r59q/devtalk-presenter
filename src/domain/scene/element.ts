import { stage } from './stage.ts'
import type { Surface, Transform } from './surface.ts'

export interface Placement {
  readonly x?: number
  readonly y?: number
  readonly scale?: number
  /** Degrees, clockwise. */
  readonly rotation?: number
  readonly opacity?: number
}

/** Anything that can appear on a slide. Its properties are plain numbers so they can be animated. */
export abstract class Element implements Transform {
  x: number
  y: number
  scale: number
  rotation: number
  opacity: number

  constructor({ x = stage.center.x, y = stage.center.y, scale = 1, rotation = 0, opacity = 1 }: Placement = {}) {
    this.x = x
    this.y = y
    this.scale = scale
    this.rotation = rotation
    this.opacity = opacity
  }

  draw(surface: Surface, time: number): void {
    surface.place(this, () => this.paint(surface, time))
  }

  protected abstract paint(surface: Surface, time: number): void
}
