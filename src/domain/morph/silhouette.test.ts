import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ease } from '../animation/easing.ts'
import { hex } from '../geometry/color.ts'
import { bounds, centroid, signedArea, type Contour } from './contour.ts'
import { assemble, blendSilhouettes, inReadingOrder, pairSilhouettes, placeSilhouette, type Piece } from './silhouette.ts'

function square(x: number, y: number, size: number): Contour {
  return [
    { x, y },
    { x, y: y + size },
    { x: x + size, y: y + size },
    { x: x + size, y },
  ]
}

/** A hole winds the other way round from an outline. */
const hole = (x: number, y: number, size: number) => [...square(x, y, size)].reverse()
const solid = (x: number, y: number, size = 10): Piece => ({ outline: square(x, y, size), holes: [] })
const ring = (x: number, y: number): Piece => ({ outline: square(x, y, 10), holes: [hole(x + 3, y + 3, 4)] })
const colors = { from: hex('#f00'), to: hex('#00f') }
const left = (contour: Contour) => bounds(contour).left

test('holes go to the outline around them', () => {
  const silhouette = assemble([square(0, 0, 10), hole(2, 2, 3), square(20, 0, 10), hole(22, 2, 3), hole(25, 5, 3)])
  assert.deepEqual(
    silhouette.map(({ outline, holes }) => [left(outline), holes.length]),
    [
      [0, 1],
      [20, 2],
    ],
  )
})

test('a hole inside a piece inside a hole belongs to the innermost outline', () => {
  const silhouette = assemble([square(0, 0, 100), hole(10, 10, 80), square(30, 30, 40), hole(40, 40, 20)])
  const inner = silhouette.find(({ outline }) => left(outline) === 30)!
  const outer = silhouette.find(({ outline }) => left(outline) === 0)!
  assert.equal(inner.holes.length, 1)
  assert.equal(left(inner.holes[0]), 40)
  assert.equal(outer.holes.length, 1)
})

test('reads pieces line by line, left to right', () => {
  // Two lines, 100 apart, centred on the origin: at y = -50 and y = 50.
  const order = inReadingOrder([solid(50, 40), solid(0, 40), solid(60, -60), solid(10, -45)], 2, 100)
  assert.deepEqual(
    order.map(({ outline }) => [left(outline), bounds(outline).top]),
    [
      [10, -45],
      [60, -60],
      [0, 40],
      [50, 40],
    ],
  )
})

test('places a silhouette with position, scale and rotation', () => {
  const [piece] = placeSilhouette([solid(0, 0)], { x: 100, y: 200, scale: 2, rotation: 90 })
  const box = bounds(piece.outline)
  // Rotated a quarter turn clockwise on screen, so x runs down and y runs left.
  assert.deepEqual(
    [box.left, box.top, box.right, box.bottom].map(Math.round),
    [80, 200, 100, 220],
  )
  assert.ok(signedArea(piece.outline) < 0, 'placing keeps the winding')
})

test('every piece of both sides takes part when the counts differ', () => {
  const pairs = pairSilhouettes([solid(0, 0), solid(20, 0)], [solid(0, 50), solid(20, 50), solid(40, 50)])
  assert.equal(pairs.length, 3)
  assert.deepEqual(
    pairs.map(({ from, to }) => [left(from.outline), left(to.outline)]),
    [
      [0, 0],
      [0, 20],
      [20, 40],
    ],
  )
  pairs.forEach(({ from, to }) => assert.equal(from.outline.length, to.outline.length))
})

test('the blend starts and ends exactly on each side', () => {
  const pairs = pairSilhouettes([ring(0, 0)], [solid(100, 0, 20), solid(140, 0)])
  const [start] = blendSilhouettes(pairs, 0, 0.35, ease.inOut, colors)
  assert.deepEqual(bounds(start.outline), bounds(square(0, 0, 10)))
  assert.deepEqual(start.color, colors.from)
  const end = blendSilhouettes(pairs, 1, 0.35, ease.inOut, colors)
  assert.deepEqual(
    end.map(({ outline }) => bounds(outline)),
    [bounds(square(100, 0, 20)), bounds(square(140, 0, 10))],
  )
  assert.deepEqual(end[0].color, colors.to)
})

test('a hole without a partner shrinks to nothing instead of vanishing', () => {
  const [pair] = pairSilhouettes([ring(0, 0)], [solid(100, 0)])
  assert.equal(pair.to.holes.length, 1)
  const gone = pair.to.holes[0]
  assert.equal(signedArea(gone), 0)
  // It shrinks to where the hole would be in the other piece: its middle.
  assert.deepEqual(centroid(gone), { x: 105, y: 5 })

  const [halfway] = blendSilhouettes([pair], 0.5, 0, ease.linear, colors)
  const area = signedArea(halfway.holes[0])
  assert.ok(area > 0 && area < 16, 'still a hole, but smaller')
})

test('holes that are there on both sides blend into each other', () => {
  const [pair] = pairSilhouettes([ring(0, 0)], [ring(100, 0)])
  const [halfway] = blendSilhouettes([pair], 0.5, 0, ease.linear, colors)
  assert.ok(Math.abs(signedArea(halfway.holes[0]) - 16) < 1e-6)
  assert.ok(Math.abs(left(halfway.holes[0]) - 53) < 1e-6)
})

test('an empty side leaves the other in place', () => {
  const pairs = pairSilhouettes([], [solid(0, 0), solid(20, 0)])
  assert.equal(pairs.length, 2)
  for (const t of [0, 0.5, 1]) {
    assert.deepEqual(
      blendSilhouettes(pairs, t, 0.35, ease.inOut, colors).map(({ outline }) => left(outline)),
      [0, 20],
    )
  }
  assert.deepEqual(pairSilhouettes([], []), [])
})

test('with a sweep, the first pieces set off before the last ones', () => {
  const pairs = pairSilhouettes([solid(0, 0), solid(20, 0)], [solid(0, 100), solid(20, 100)])
  const [first, last] = blendSilhouettes(pairs, 0.4, 1, ease.linear, colors)
  assert.ok(bounds(first.outline).top > bounds(last.outline).top)
})
