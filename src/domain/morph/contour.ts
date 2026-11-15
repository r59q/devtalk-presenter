import { lerp } from '../geometry/numbers.ts'
import type { Vector } from '../geometry/vector.ts'

/** A closed outline as a polygon: the last point connects back to the first. */
export type Contour = readonly Vector[]

/** Positive when the points run counter-clockwise in a y-up frame, i.e. clockwise on screen. */
export function signedArea(contour: Contour): number {
  let twice = 0
  contour.forEach((point, index) => {
    const next = contour[(index + 1) % contour.length]
    twice += point.x * next.y - next.x * point.y
  })
  return twice / 2
}

export function perimeter(contour: Contour): number {
  let length = 0
  contour.forEach((point, index) => {
    const next = contour[(index + 1) % contour.length]
    length += Math.hypot(next.x - point.x, next.y - point.y)
  })
  return length
}

/** The average of the points, which is enough to tell where a contour is. */
export function centroid(contour: Contour): Vector {
  if (contour.length === 0) return { x: 0, y: 0 }
  let x = 0
  let y = 0
  for (const point of contour) {
    x += point.x
    y += point.y
  }
  return { x: x / contour.length, y: y / contour.length }
}

export interface Bounds {
  readonly left: number
  readonly top: number
  readonly right: number
  readonly bottom: number
}

export function bounds(contour: Contour): Bounds {
  let [left, top, right, bottom] = [Infinity, Infinity, -Infinity, -Infinity]
  for (const { x, y } of contour) {
    left = Math.min(left, x)
    top = Math.min(top, y)
    right = Math.max(right, x)
    bottom = Math.max(bottom, y)
  }
  return { left, top, right, bottom }
}

/** Whether a point lies inside the contour, by the even-odd rule. */
export function contains(contour: Contour, { x, y }: Vector): boolean {
  let inside = false
  for (let index = 0, previous = contour.length - 1; index < contour.length; previous = index++) {
    const a = contour[index]
    const b = contour[previous]
    if (a.y > y !== b.y > y && x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x) inside = !inside
  }
  return inside
}

/** `count` points spread evenly along the contour, starting at its first point. */
export function resample(contour: Contour, count: number): Vector[] {
  const length = perimeter(contour)
  if (contour.length === 0) return []
  if (length === 0) return Array.from({ length: count }, () => contour[0])
  const points: Vector[] = []
  let segment = 0
  let walked = 0
  for (let index = 0; index < count; index++) {
    const target = (index * length) / count
    let a = contour[segment]
    let b = contour[(segment + 1) % contour.length]
    let span = Math.hypot(b.x - a.x, b.y - a.y)
    while (walked + span < target && segment < contour.length - 1) {
      walked += span
      segment++
      a = contour[segment]
      b = contour[(segment + 1) % contour.length]
      span = Math.hypot(b.x - a.x, b.y - a.y)
    }
    const t = span === 0 ? 0 : Math.min(1, (target - walked) / span)
    points.push({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) })
  }
  return points
}

/** Stage pixels between neighbouring points of a matched contour. */
const spacing = 0.75
const minimumPoints = 24
const maximumPoints = 4000

/**
 * Gives two contours the same number of points, with point `i` of one matching point `i` of
 * the other: both run the same way round and start where their shapes correspond best, so
 * blending between them deforms one shape into the other without twisting.
 */
export function matchContours(from: Contour, to: Contour): [Vector[], Vector[]] {
  const wanted = Math.ceil(Math.max(perimeter(from), perimeter(to)) / spacing)
  const count = Math.min(maximumPoints, Math.max(minimumPoints, wanted))
  const source = resample(from, count)
  let target = resample(to, count)
  if (Math.sign(signedArea(source)) * Math.sign(signedArea(target)) < 0) target = target.reverse()
  const offset = bestOffset(source, target)
  return [source, [...target.slice(offset), ...target.slice(0, offset)]]
}

/** Points compared for each candidate start, and candidate starts tried in the coarse pass. */
const probes = 64
const coarseStarts = 256

/** The rotation of `to` that best lines its shape up with `from`, ignoring position and size. */
function bestOffset(from: Vector[], to: Vector[]): number {
  const count = from.length
  const a = normalize(from)
  const b = normalize(to)
  const stride = Math.max(1, Math.floor(count / probes))
  const cost = (offset: number) => {
    let sum = 0
    for (let index = 0; index < count; index += stride) {
      const p = a[index]
      const q = b[(index + offset) % count]
      sum += (p.x - q.x) ** 2 + (p.y - q.y) ** 2
    }
    return sum
  }
  const step = Math.max(1, Math.floor(count / coarseStarts))
  let best = 0
  let lowest = Infinity
  for (let offset = 0; offset < count; offset += step) {
    const value = cost(offset)
    if (value < lowest) [best, lowest] = [offset, value]
  }
  const coarse = best
  for (let offset = coarse - step + 1; offset < coarse + step; offset++) {
    const wrapped = (offset + count) % count
    const value = cost(wrapped)
    if (value < lowest) [best, lowest] = [wrapped, value]
  }
  return best
}

/** Centred on the origin and scaled to unit spread, so only the shape counts. */
function normalize(points: Vector[]): Vector[] {
  const middle = centroid(points)
  const spread = Math.sqrt(points.reduce((sum, { x, y }) => sum + (x - middle.x) ** 2 + (y - middle.y) ** 2, 0) / points.length) || 1
  return points.map(({ x, y }) => ({ x: (x - middle.x) / spread, y: (y - middle.y) / spread }))
}

/** Point by point blend of two matched contours. */
export function blendContours(from: Contour, to: Contour, t: number): Vector[] {
  return from.map((point, index) => ({ x: lerp(point.x, to[index].x, t), y: lerp(point.y, to[index].y, t) }))
}
