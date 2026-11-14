import type { Color } from '../geometry/color.ts'
import type { Vector } from '../geometry/vector.ts'
import type { PointCloud } from '../morph/point-cloud.ts'
import type { FieldElement } from './field.ts'

export interface Transform {
  readonly x: number
  readonly y: number
  readonly scale: number
  /** Degrees, clockwise. */
  readonly rotation: number
  /** 0–1. */
  readonly opacity: number
}

export type TextAlign = 'left' | 'center' | 'right'

export interface TextStyle {
  readonly size: number
  readonly font: string
  readonly weight: number
  readonly color: Color
  readonly align: TextAlign
  readonly lineHeight: number
}

export interface ShapeStyle {
  readonly fill?: Color
  readonly stroke?: Color
  readonly lineWidth: number
}

export interface LineStyle {
  readonly color: Color
  readonly lineWidth: number
  readonly arrow: boolean
}

/** Free-form drawing in stage coordinates, relative to the element's position. */
export type Sketch = (context: CanvasRenderingContext2D, time: number) => void

/**
 * The port elements draw themselves onto. Drawing calls are made in local coordinates:
 * the origin is the position given to `place`.
 */
export interface Surface {
  clear(color: Color): void
  place(transform: Transform, paint: () => void): void
  text(lines: readonly string[], style: TextStyle): void
  /** Without a height the image keeps its aspect ratio. */
  image(source: string, width: number, height?: number): void
  rect(width: number, height: number, radius: number, style: ShapeStyle): void
  circle(radius: number, style: ShapeStyle): void
  line(from: Vector, to: Vector, style: LineStyle): void
  particles(cloud: PointCloud, size: number): void
  sketch(draw: Sketch, time: number): void
  field(field: FieldElement): void
}
