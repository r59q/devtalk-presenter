import { Element, type Placement } from './element.ts'
import type { Sketch, Surface } from './surface.ts'

/**
 * Escape hatch for arbitrary drawing. Without a position the origin is the top left
 * corner of the stage, so the sketch draws in plain stage coordinates.
 */
export class SketchElement extends Element {
  readonly sketch: Sketch

  constructor(sketch: Sketch, placement: Placement = {}) {
    super({ x: 0, y: 0, ...placement })
    this.sketch = sketch
  }

  protected paint(surface: Surface, time: number): void {
    surface.sketch(this.sketch, time)
  }
}
