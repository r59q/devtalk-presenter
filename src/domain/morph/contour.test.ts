import { test } from 'node:test'
import assert from 'node:assert/strict'
import { blendContours, contains, matchContours, perimeter, resample, signedArea, type Contour } from './contour.ts'

/** A square, wound the way traced outlines are. */
function square(x: number, y: number, size: number): Contour {
  return [
    { x, y },
    { x, y: y + size },
    { x: x + size, y: y + size },
    { x: x + size, y },
  ]
}

const near = (a: number, b: number) => Math.abs(a - b) < 1e-9

test('measures contours', () => {
  const box = square(0, 0, 10)
  assert.equal(signedArea(box), -100)
  assert.equal(perimeter(box), 40)
  assert.ok(contains(box, { x: 5, y: 5 }))
  assert.ok(!contains(box, { x: 15, y: 5 }))
})

test('resamples evenly along the contour', () => {
  const points = resample(square(0, 0, 10), 8)
  assert.equal(points.length, 8)
  points.forEach((point, index) => {
    const next = points[(index + 1) % points.length]
    assert.ok(near(Math.hypot(next.x - point.x, next.y - point.y), 5))
  })
})

test('matched contours have as many points, run the same way and start at matching places', () => {
  const from = square(0, 0, 10)
  // The same square, larger, elsewhere, starting at another corner and wound the other way.
  const to = [...square(100, 100, 30)].reverse()
  const [a, b] = matchContours(from, to)
  assert.equal(a.length, b.length)
  assert.ok(Math.sign(signedArea(a)) === Math.sign(signedArea(b)))
  // Corresponding points sit at the same place relative to each square.
  a.forEach((point, index) => {
    assert.ok(Math.abs((b[index].x - 100) / 3 - point.x) < 0.5)
    assert.ok(Math.abs((b[index].y - 100) / 3 - point.y) < 0.5)
  })
})

test('matched contours are fine enough to look smooth', () => {
  const [a] = matchContours(square(0, 0, 300), square(0, 0, 10))
  assert.ok(perimeter(a) / a.length <= 0.75)
})

test('blending goes from one contour to the other', () => {
  const [a, b] = matchContours(square(0, 0, 10), square(20, 0, 10))
  assert.deepEqual(blendContours(a, b, 0), a)
  assert.deepEqual(blendContours(a, b, 1), b)
  const middle = blendContours(a, b, 0.5)
  assert.ok(near(Math.min(...middle.map(({ x }) => x)), 10))
})
