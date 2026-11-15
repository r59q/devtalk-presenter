import type { Easing } from '../animation/easing.ts'
import { mixColors, type Color } from '../geometry/color.ts'
import { clamp01, lerp } from '../geometry/numbers.ts'
import type { Vector } from '../geometry/vector.ts'
import type { Transform } from '../scene/surface.ts'
import { blendContours, bounds, centroid, contains, matchContours, signedArea, type Bounds, type Contour } from './contour.ts'
import { traceContours, type Coverage } from './trace.ts'

/** One connected filled area, such as a letter or the dot of an "i": its outline minus its holes. */
export interface Piece {
  readonly outline: Contour
  readonly holes: readonly Contour[]
}

/** How something looks, as filled pieces. Outlines and holes wind in opposite directions. */
export type Silhouette = readonly Piece[]

/** A piece drawn in one colour. */
export interface Figure extends Piece {
  readonly color: Color
}

/** Outlines smaller than this many square pixels are specks, not shapes. */
const minimumArea = 0.5

/**
 * Traces what was drawn in `coverage` into pieces. The coverage shows the drawing magnified
 * by `resolution` with `origin` at its top left corner; the pieces are in the drawing's own
 * coordinates again.
 */
export function traceSilhouette(coverage: Coverage, origin: Vector, resolution: number): Silhouette {
  const contours = traceContours(coverage)
    .filter((contour) => Math.abs(signedArea(contour)) >= minimumArea)
    .map((contour) => contour.map(({ x, y }) => ({ x: origin.x + x / resolution, y: origin.y + y / resolution })))
  return assemble(contours)
}

/** Gives each hole to the smallest filled outline around it. */
export function assemble(contours: readonly Contour[]): Silhouette {
  const outlines = contours.filter((contour) => signedArea(contour) < 0).map((outline) => ({ outline, area: -signedArea(outline), holes: [] as Contour[] }))
  for (const hole of contours.filter((contour) => signedArea(contour) > 0)) {
    const around = outlines.filter(({ outline }) => contains(outline, hole[0])).sort((a, b) => a.area - b.area)[0]
    around?.holes.push(hole)
  }
  return outlines.map(({ outline, holes }) => ({ outline, holes }))
}

/**
 * Sorts the pieces of text line by line, then from left to right. The lines are centred
 * vertically on the origin, `leading` apart, as text is drawn.
 */
export function inReadingOrder(silhouette: Silhouette, lines: number, leading: number): Silhouette {
  const placed = silhouette.map((piece) => ({ piece, middle: centroid(piece.outline) }))
  const top = (-(lines - 1) * leading) / 2
  const line = (y: number) => Math.round((y - top) / leading)
  return placed.sort((a, b) => line(a.middle.y) - line(b.middle.y) || a.middle.x - b.middle.x).map(({ piece }) => piece)
}

/** Moves a silhouette from an element's own coordinates onto the stage. */
export function placeSilhouette(silhouette: Silhouette, { x, y, scale, rotation }: Omit<Transform, 'opacity'>): Silhouette {
  const angle = (rotation * Math.PI) / 180
  const [cos, sin] = [Math.cos(angle) * scale, Math.sin(angle) * scale]
  const place = (contour: Contour) => contour.map((point) => ({ x: x + cos * point.x - sin * point.y, y: y + sin * point.x + cos * point.y }))
  return silhouette.map(({ outline, holes }) => ({ outline: place(outline), holes: holes.map(place) }))
}

/** Two pieces whose outlines and holes match point for point, so one can blend into the other. */
export interface PiecePair {
  readonly from: Piece
  readonly to: Piece
  /** Position of the pair in the sweep, 0–1. */
  readonly order: number
}

/**
 * Matches the pieces of two silhouettes, both read in order. When the counts differ, pieces
 * split or merge, so every piece of both sides takes part. An empty silhouette leaves the
 * pieces of the other one in place, for the morph to fade.
 */
export function pairSilhouettes(from: Silhouette, to: Silhouette): PiecePair[] {
  if (from.length === 0 || to.length === 0) return [...from, ...to].map((piece, index, all) => ({ ...pairPieces(piece, piece), order: index / all.length }))
  const count = Math.max(from.length, to.length)
  return Array.from({ length: count }, (_, index) => ({
    ...pairPieces(from[Math.floor((index * from.length) / count)], to[Math.floor((index * to.length) / count)]),
    order: index / count,
  }))
}

/**
 * Matches outline with outline and hole with hole. A hole without a partner on the other
 * side grows from, or shrinks into, a point where it would sit in the other piece.
 */
function pairPieces(from: Piece, to: Piece): { from: Piece; to: Piece } {
  const [fromOutline, toOutline] = matchContours(from.outline, to.outline)
  const fromBox = bounds(from.outline)
  const toBox = bounds(to.outline)
  const count = Math.max(from.holes.length, to.holes.length)
  const holes = Array.from({ length: count }, (_, index) => {
    const a = from.holes.length > 0 ? from.holes[Math.floor((index * from.holes.length) / count)] : undefined
    const b = to.holes.length > 0 ? to.holes[Math.floor((index * to.holes.length) / count)] : undefined
    if (a && b) return matchContours(a, b)
    if (a) return matchContours(a, collapsed(a, fromBox, toBox))
    return matchContours(collapsed(b!, toBox, fromBox), b!)
  })
  return {
    from: { outline: fromOutline, holes: holes.map(([hole]) => hole) },
    to: { outline: toOutline, holes: holes.map(([, hole]) => hole) },
  }
}

/** A hole shrunk to the point that corresponds to its centre in another piece. */
function collapsed(hole: Contour, own: Bounds, other: Bounds): Contour {
  const middle = centroid(hole)
  const across = (value: number, start: number, end: number, otherStart: number, otherEnd: number) =>
    end === start ? (otherStart + otherEnd) / 2 : lerp(otherStart, otherEnd, (value - start) / (end - start))
  const point = { x: across(middle.x, own.left, own.right, other.left, other.right), y: across(middle.y, own.top, own.bottom, other.top, other.bottom) }
  return hole.map(() => point)
}

/**
 * The figures part way through a morph. With a `sweep` above zero the first pieces set off
 * first and the last ones last, which reads as a wave. Colours blend along with the shapes.
 */
export function blendSilhouettes(pairs: readonly PiecePair[], t: number, sweep: number, ease: Easing, colors: { from: Color; to: Color }): Figure[] {
  const spread = clamp01(sweep) * 0.99
  return pairs.map(({ from, to, order }) => {
    const local = ease(clamp01((t - order * spread) / (1 - spread)))
    return {
      outline: blendContours(from.outline, to.outline, local),
      holes: from.holes.map((hole, index) => blendContours(hole, to.holes[index], local)),
      color: mixColors(colors.from, colors.to, local),
    }
  })
}
