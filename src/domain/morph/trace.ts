import type { Vector } from '../geometry/vector.ts'
import type { Contour } from './contour.ts'

/** Pixels with their alpha in every fourth byte, laid out like `ImageData`. */
export interface Coverage {
  readonly width: number
  readonly height: number
  readonly data: ArrayLike<number>
}

/** Half way between transparent and opaque, where an anti-aliased edge really is. */
const threshold = 127.5

/**
 * Finds the outlines of everything drawn in `coverage` (marching squares). Edges are placed
 * between pixels by interpolating their alpha, so anti-aliased drawing gives outlines that
 * are accurate to a fraction of a pixel. Coordinates are in pixels; pixel centres sit at
 * half-pixel positions. Filled areas wind one way and holes the other: outlines of filled
 * areas have a negative `signedArea`.
 */
export function traceContours({ width, height, data }: Coverage): Contour[] {
  const columns = width + 2
  const alpha = (x: number, y: number) => (x < 0 || y < 0 || x >= width || y >= height ? 0 : data[(y * width + x) * 4 + 3])
  // Grid points run from -1 to width/height, so that drawing touching the border is closed off.
  // An edge leaves a grid point to the right (even id) or downwards (odd id).
  const edge = (x: number, y: number, down: boolean) => ((y + 1) * columns + (x + 1)) * 2 + (down ? 1 : 0)
  const points = new Map<number, Vector>()
  const next = new Map<number, number>()

  const crossing = (x: number, y: number, down: boolean): number => {
    const id = edge(x, y, down)
    if (!points.has(id)) {
      const a = alpha(x, y)
      const b = down ? alpha(x, y + 1) : alpha(x + 1, y)
      const t = (threshold - a) / (b - a)
      points.set(id, down ? { x: x + 0.5, y: y + 0.5 + t } : { x: x + 0.5 + t, y: y + 0.5 })
    }
    return id
  }

  for (let y = -1; y < height; y++) {
    for (let x = -1; x < width; x++) {
      const values = [alpha(x, y), alpha(x + 1, y), alpha(x + 1, y + 1), alpha(x, y + 1)]
      const corners = values.map((value) => value > threshold)
      if (corners[0] === corners[1] && corners[1] === corners[2] && corners[2] === corners[3]) continue
      // The cell's sides clockwise on screen: top, right, bottom, left.
      const sides = [
        () => crossing(x, y, false),
        () => crossing(x + 1, y, true),
        () => crossing(x, y + 1, false),
        () => crossing(x, y, true),
      ]
      const entering: number[] = []
      const leaving: number[] = []
      corners.forEach((inside, index) => {
        const following = corners[(index + 1) % 4]
        if (inside === following) return
        ;(inside ? leaving : entering).push(index)
      })
      // Each outline enters filled area at one side and leaves it at the next side clockwise
      // that leaves it. Where diagonal corners are filled, the cell's centre decides whether
      // the two filled corners connect.
      const connected = entering.length === 2 && values.reduce((sum, value) => sum + value) / 4 > threshold
      for (const side of entering) {
        const partner = connected
          ? (leaving.findLast((other) => other < side) ?? leaving[leaving.length - 1])
          : (leaving.find((other) => other > side) ?? leaving[0])
        next.set(sides[side](), sides[partner]())
      }
    }
  }

  const contours: Contour[] = []
  for (const start of next.keys()) {
    if (!points.has(start)) continue
    const contour: Vector[] = []
    let id = start
    while (points.has(id)) {
      contour.push(points.get(id)!)
      points.delete(id)
      id = next.get(id)!
    }
    if (contour.length > 2) contours.push(contour)
  }
  return contours
}
