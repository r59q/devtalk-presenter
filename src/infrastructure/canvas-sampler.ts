import { hex } from '../domain/geometry/color.ts'
import type { Particle, PointCloud } from '../domain/morph/point-cloud.ts'
import type { Sampler } from '../domain/morph/sampler.ts'
import { traceSilhouette, type Silhouette } from '../domain/morph/silhouette.ts'
import type { Element } from '../domain/scene/element.ts'
import { stage } from '../domain/scene/stage.ts'
import type { TextStyle } from '../domain/scene/surface.ts'
import { CanvasSurface } from './canvas-surface.ts'
import type { ImageLibrary } from './image-library.ts'

/** Pixels more transparent than this are not sampled. */
const minimumAlpha = 96

/** Largest canvas text is traced on, in pixels. Larger texts are traced with less detail. */
const maximumTracePixels = 4_000_000

/** Traced texts kept, so that jumping between steps does not trace the same text again. */
const tracesKept = 64

/** Samples elements by drawing them on a hidden canvas and reading back the pixels. */
export class CanvasSampler implements Sampler {
  readonly spacing: number
  readonly #context: CanvasRenderingContext2D
  readonly #surface: CanvasSurface
  readonly #tracing: CanvasRenderingContext2D
  readonly #tracingSurface: CanvasSurface
  readonly #traces = new Map<string, Silhouette>()

  constructor(images: ImageLibrary, spacing = 4) {
    this.spacing = spacing
    this.#context = hiddenContext(stage.width, stage.height)
    this.#surface = new CanvasSurface(this.#context, images)
    this.#tracing = hiddenContext(1, 1)
    this.#tracingSurface = new CanvasSurface(this.#tracing, images)
  }

  sample(element: Element, time: number): PointCloud {
    const { width, height } = stage
    this.#context.clearRect(0, 0, width, height)
    const opacity = element.opacity
    element.opacity = 1
    try {
      element.draw(this.#surface, time)
    } finally {
      element.opacity = opacity
    }
    return this.#readPixels(this.#context.getImageData(0, 0, width, height).data)
  }

  trace(lines: readonly string[], style: TextStyle, detail: number): Silhouette {
    if (lines.every((line) => line.trim() === '')) return []
    const key = JSON.stringify([lines, style.font, style.size, style.weight, style.align, style.lineHeight, detail])
    const kept = this.#traces.get(key)
    if (kept) return kept
    const silhouette = this.#traceText(lines, style, detail)
    if (this.#traces.size >= tracesKept) this.#traces.delete(this.#traces.keys().next().value!)
    this.#traces.set(key, silhouette)
    return silhouette
  }

  /** Draws the text magnified on a canvas just large enough for it and traces the pixels. */
  #traceText(lines: readonly string[], style: TextStyle, detail: number): Silhouette {
    const context = this.#tracing
    const box = measure(context, lines, style)
    const [width, height] = [box.right - box.left, box.bottom - box.top]
    const resolution = Math.min(detail, Math.sqrt(maximumTracePixels / (width * height)))
    const canvas = context.canvas
    canvas.width = Math.ceil(width * resolution)
    canvas.height = Math.ceil(height * resolution)
    context.setTransform(resolution, 0, 0, resolution, -box.left * resolution, -box.top * resolution)
    // The same drawing code as on screen, so the outlines are those of the text the audience sees.
    this.#tracingSurface.text(lines, { ...style, color: hex('#fff') })
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height)
    return traceSilhouette(pixels, { x: box.left, y: box.top }, resolution)
  }

  #readPixels(pixels: Uint8ClampedArray): PointCloud {
    const cloud: Particle[] = []
    const offset = Math.floor(this.spacing / 2)
    for (let y = offset; y < stage.height; y += this.spacing) {
      for (let x = offset; x < stage.width; x += this.spacing) {
        const index = (y * stage.width + x) * 4
        if (pixels[index + 3] < minimumAlpha) continue
        cloud.push({ x, y, color: { r: pixels[index], g: pixels[index + 1], b: pixels[index + 2], a: 1 } })
      }
    }
    return cloud
  }
}

function hiddenContext(width: number, height: number): CanvasRenderingContext2D {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) throw new Error('Canvas 2D is not supported')
  return context
}

/** Where the text's ink is, in its own coordinates, with a margin for glyphs that overhang their metrics. */
function measure(context: CanvasRenderingContext2D, lines: readonly string[], { size, font, weight, align, lineHeight }: TextStyle) {
  context.font = `${weight} ${size}px ${font}`
  context.textAlign = align
  context.textBaseline = 'middle'
  const leading = size * lineHeight
  const top = (-(lines.length - 1) * leading) / 2
  let [left, right, upper, lower] = [0, 0, top, top]
  lines.forEach((line, index) => {
    const metrics = context.measureText(line)
    const y = top + index * leading
    left = Math.min(left, -metrics.actualBoundingBoxLeft)
    right = Math.max(right, metrics.actualBoundingBoxRight)
    upper = Math.min(upper, y - metrics.actualBoundingBoxAscent)
    lower = Math.max(lower, y + metrics.actualBoundingBoxDescent)
  })
  const margin = 2 + size * 0.1
  return { left: left - margin, top: upper - margin, right: right + margin, bottom: lower + margin }
}
