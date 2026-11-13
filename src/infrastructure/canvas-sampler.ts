import type { Particle, PointCloud } from '../domain/morph/point-cloud.ts'
import type { Sampler } from '../domain/morph/sampler.ts'
import type { Element } from '../domain/scene/element.ts'
import { stage } from '../domain/scene/stage.ts'
import { CanvasSurface } from './canvas-surface.ts'
import type { ImageLibrary } from './image-library.ts'

/** Pixels more transparent than this are not sampled. */
const minimumAlpha = 96

/** Samples elements by drawing them on a hidden canvas and reading back the pixels. */
export class CanvasSampler implements Sampler {
  readonly spacing: number
  readonly #context: CanvasRenderingContext2D
  readonly #surface: CanvasSurface

  constructor(images: ImageLibrary, spacing = 4) {
    const canvas = document.createElement('canvas')
    canvas.width = stage.width
    canvas.height = stage.height
    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (!context) throw new Error('Canvas 2D is not supported')
    this.spacing = spacing
    this.#context = context
    this.#surface = new CanvasSurface(context, images)
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
