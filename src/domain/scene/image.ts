import { Element, type Placement } from './element.ts'
import type { Surface } from './surface.ts'

export interface ImageOptions extends Placement {
  readonly width: number
  /** Leave out to keep the image's aspect ratio. */
  readonly height?: number
}

export class ImageElement extends Element {
  readonly source: string
  width: number
  height: number | undefined

  constructor(source: string, options: ImageOptions) {
    super(options)
    this.source = source
    this.width = options.width
    this.height = options.height
  }

  protected paint(surface: Surface): void {
    surface.image(this.source, this.width, this.height)
  }
}
