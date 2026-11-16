import type { Figure } from '../morph/silhouette.ts'
import { Element } from './element.ts'
import type { Surface } from './surface.ts'

/** Filled shapes in stage coordinates. Vector morphs are drawn with it. */
export class FiguresElement extends Element {
  figures: readonly Figure[] = []

  constructor() {
    super({ x: 0, y: 0 })
  }

  protected paint(surface: Surface): void {
    surface.figures(this.figures)
  }
}
