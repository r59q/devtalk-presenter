import type { Element } from '../scene/element.ts'
import type { PointCloud } from './point-cloud.ts'

/** Port that turns how an element looks into points, so any element can be morphed. */
export interface Sampler {
  /** Distance between sampled points, in stage pixels. */
  readonly spacing: number
  sample(element: Element, time: number): PointCloud
}
