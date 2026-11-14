import type { PointCloud } from '../morph/point-cloud.ts'
import { Element } from './element.ts'
import type { Surface } from './surface.ts'

/** A cloud of colored dots in stage coordinates. Morphs are drawn with it. */
export class ParticlesElement extends Element {
  cloud: PointCloud = []
  size: number

  constructor(size: number) {
    super({ x: 0, y: 0 })
    this.size = size
  }

  protected paint(surface: Surface): void {
    surface.particles(this.cloud, this.size)
  }
}
