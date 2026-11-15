import type { Element } from '../scene/element.ts'
import type { TextStyle } from '../scene/surface.ts'
import type { PointCloud } from './point-cloud.ts'
import type { Silhouette } from './silhouette.ts'

/** Port that turns how an element looks into data, so it can be morphed. */
export interface Sampler {
  /** Distance between sampled points, in stage pixels. */
  readonly spacing: number
  sample(element: Element, time: number): PointCloud
  /**
   * Traces text exactly as it is drawn, in the text's own coordinates: the origin is its
   * position, before scale and rotation. `detail` is how many traced pixels to use per unit,
   * so more detail keeps magnified text smooth.
   */
  trace(lines: readonly string[], style: TextStyle, detail: number): Silhouette
}
