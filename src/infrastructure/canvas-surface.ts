import { toCss, type Color } from '../domain/geometry/color.ts'
import { clamp01 } from '../domain/geometry/numbers.ts'
import type { Vector } from '../domain/geometry/vector.ts'
import type { PointCloud } from '../domain/morph/point-cloud.ts'
import type { FieldElement } from '../domain/scene/field.ts'
import type { LineStyle, ShapeStyle, Sketch, Surface, TextStyle, Transform } from '../domain/scene/surface.ts'
import type { FieldOverlay } from './field-overlay.ts'
import type { ImageLibrary } from './image-library.ts'

/** Draws elements with the Canvas 2D API. Expects the context to map stage coordinates already. */
export class CanvasSurface implements Surface {
  readonly #context: CanvasRenderingContext2D
  readonly #images: ImageLibrary
  readonly #fields: FieldOverlay | undefined

  constructor(context: CanvasRenderingContext2D, images: ImageLibrary, fields?: FieldOverlay) {
    this.#context = context
    this.#images = images
    this.#fields = fields
  }

  clear(color: Color): void {
    const context = this.#context
    context.save()
    context.resetTransform()
    context.fillStyle = toCss(color)
    context.fillRect(0, 0, context.canvas.width, context.canvas.height)
    context.restore()
  }

  place({ x, y, scale, rotation, opacity }: Transform, paint: () => void): void {
    if (opacity <= 0) return
    const context = this.#context
    context.save()
    context.translate(x, y)
    context.rotate((rotation * Math.PI) / 180)
    context.scale(scale, scale)
    context.globalAlpha *= clamp01(opacity)
    paint()
    context.restore()
  }

  text(lines: readonly string[], { size, font, weight, color, align, lineHeight }: TextStyle): void {
    const context = this.#context
    const leading = size * lineHeight
    const top = (-(lines.length - 1) * leading) / 2
    context.font = `${weight} ${size}px ${font}`
    context.textAlign = align
    context.textBaseline = 'middle'
    context.fillStyle = toCss(color)
    lines.forEach((line, index) => context.fillText(line, 0, top + index * leading))
  }

  image(source: string, width: number, height?: number): void {
    const image = this.#images.get(source)
    if (!image) return
    const drawnHeight = height ?? (width * image.naturalHeight) / image.naturalWidth
    this.#context.drawImage(image, -width / 2, -drawnHeight / 2, width, drawnHeight)
  }

  rect(width: number, height: number, radius: number, style: ShapeStyle): void {
    this.#context.beginPath()
    this.#context.roundRect(-width / 2, -height / 2, width, height, radius)
    this.#fillAndStroke(style)
  }

  circle(radius: number, style: ShapeStyle): void {
    this.#context.beginPath()
    this.#context.arc(0, 0, Math.max(0, radius), 0, Math.PI * 2)
    this.#fillAndStroke(style)
  }

  line(from: Vector, to: Vector, { color, lineWidth, arrow }: LineStyle): void {
    const context = this.#context
    context.strokeStyle = context.fillStyle = toCss(color)
    context.lineWidth = lineWidth
    context.lineCap = 'round'
    context.beginPath()
    context.moveTo(from.x, from.y)
    context.lineTo(to.x, to.y)
    context.stroke()
    if (arrow && (from.x !== to.x || from.y !== to.y)) this.#arrowHead(from, to, lineWidth * 4)
  }

  particles(cloud: PointCloud, size: number): void {
    const context = this.#context
    let style = ''
    for (const { x, y, color } of cloud) {
      const css = toCss(color)
      if (css !== style) context.fillStyle = style = css
      context.fillRect(x - size / 2, y - size / 2, size, size)
    }
  }

  sketch(draw: Sketch, time: number): void {
    this.#context.save()
    draw(this.#context, time)
    this.#context.restore()
  }

  field(field: FieldElement): void {
    this.#fields?.show(field)
  }

  #fillAndStroke({ fill, stroke, lineWidth }: ShapeStyle): void {
    const context = this.#context
    if (fill) {
      context.fillStyle = toCss(fill)
      context.fill()
    }
    if (stroke) {
      context.strokeStyle = toCss(stroke)
      context.lineWidth = lineWidth
      context.stroke()
    }
  }

  #arrowHead(from: Vector, to: Vector, size: number): void {
    const context = this.#context
    const angle = Math.atan2(to.y - from.y, to.x - from.x)
    const corner = (turn: number) => ({
      x: to.x - size * Math.cos(angle + turn),
      y: to.y - size * Math.sin(angle + turn),
    })
    const [left, right] = [corner(Math.PI / 7), corner(-Math.PI / 7)]
    context.beginPath()
    context.moveTo(to.x, to.y)
    context.lineTo(left.x, left.y)
    context.lineTo(right.x, right.y)
    context.closePath()
    context.fill()
  }
}
