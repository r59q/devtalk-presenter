import { paint, type Color, type ColorValue } from '../geometry/color.ts'
import type { Vector } from '../geometry/vector.ts'
import { Element, type Placement } from './element.ts'
import type { Surface } from './surface.ts'

export interface ShapeOptions extends Placement {
  readonly fill?: ColorValue
  readonly stroke?: ColorValue
  readonly lineWidth?: number
}

abstract class Shape extends Element {
  fill: Color | undefined
  stroke: Color | undefined
  lineWidth: number

  constructor(options: ShapeOptions) {
    super(options)
    this.fill = options.fill === undefined ? undefined : paint(options.fill)
    this.stroke = options.stroke === undefined ? undefined : paint(options.stroke)
    this.lineWidth = options.lineWidth ?? 4
  }
}

export interface RectOptions extends ShapeOptions {
  readonly width: number
  readonly height: number
  readonly radius?: number
}

export class RectElement extends Shape {
  width: number
  height: number
  radius: number

  constructor(options: RectOptions) {
    super(options)
    this.width = options.width
    this.height = options.height
    this.radius = options.radius ?? 0
  }

  protected paint(surface: Surface): void {
    surface.rect(this.width, this.height, this.radius, this)
  }
}

export interface CircleOptions extends ShapeOptions {
  readonly radius: number
}

export class CircleElement extends Shape {
  radius: number

  constructor(options: CircleOptions) {
    super(options)
    this.radius = options.radius
  }

  protected paint(surface: Surface): void {
    surface.circle(this.radius, this)
  }
}

export interface LineOptions extends Omit<Placement, 'x' | 'y'> {
  readonly from: Vector
  readonly to: Vector
  readonly color?: ColorValue
  readonly lineWidth?: number
  readonly arrow?: boolean
}

/** A straight line between two stage points. Its position is the midpoint. */
export class LineElement extends Element {
  /** Half of the line, from the midpoint towards `to`. */
  readonly #half: Vector
  color: Color
  lineWidth: number
  arrow: boolean
  /** Share of the line drawn, 0–1. Animate it to draw the line in. */
  progress = 1

  constructor({ from, to, color = '#e6edf3', lineWidth = 4, arrow = false, ...placement }: LineOptions) {
    super({ ...placement, x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 })
    this.#half = { x: (to.x - from.x) / 2, y: (to.y - from.y) / 2 }
    this.color = paint(color)
    this.lineWidth = lineWidth
    this.arrow = arrow
  }

  protected paint(surface: Surface): void {
    const { x, y } = this.#half
    const end = { x: -x + 2 * x * this.progress, y: -y + 2 * y * this.progress }
    surface.line({ x: -x, y: -y }, end, this)
  }
}
