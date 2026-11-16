import { test } from 'node:test'
import assert from 'node:assert/strict'
import { bounds, signedArea } from './contour.ts'
import { traceSilhouette } from './silhouette.ts'
import { traceContours, type Coverage } from './trace.ts'

/** Coverage drawn from rows of characters: `#` is opaque, a digit is that many tenths of it, anything else is clear. */
function coverage(...rows: string[]): Coverage {
  const width = rows[0].length
  const data = new Uint8ClampedArray(width * rows.length * 4)
  rows.forEach((row, y) =>
    [...row].forEach((cell, x) => {
      data[(y * width + x) * 4 + 3] = cell === '#' ? 255 : /\d/.test(cell) ? Math.round((Number(cell) / 10) * 255) : 0
    }),
  )
  return { width, height: rows.length, data }
}

test('traces a filled block as one outline winding backwards', () => {
  const [outline, ...rest] = traceContours(coverage('....', '.##.', '.##.', '....'))
  assert.equal(rest.length, 0)
  assert.ok(signedArea(outline) < 0)
  // The edge lies half way between the centres of opaque and clear pixels.
  assert.deepEqual(bounds(outline), { left: 1, top: 1, right: 3, bottom: 3 })
})

test('places edges between pixels from their anti-aliased alpha', () => {
  const [outline] = traceContours(coverage('#####8'))
  // Alpha 0.8 next to clear: the half-way point is 0.8 → 0 crossing 0.5, 3/8 of a pixel on.
  assert.ok(Math.abs(bounds(outline).right - (5.5 + 0.375)) < 0.01)
})

test('holes wind the other way and drawing at the border is closed off', () => {
  const contours = traceContours(coverage('#####', '#...#', '#...#', '#####'))
  assert.equal(contours.length, 2)
  const [outer, hole] = [...contours].sort((a, b) => signedArea(a) - signedArea(b))
  assert.ok(signedArea(outer) < 0 && signedArea(hole) > 0)
  assert.ok(bounds(outer).left < 0.5, 'the outline runs outside the first column')
})

test('pieces keep their holes and detached parts stay separate', () => {
  // An "o" with a hole, and an "i" in two parts.
  const silhouette = traceSilhouette(
    coverage(
      '..........##.',
      '.#####.......',
      '.#...#....##.',
      '.#...#....##.',
      '.#####....##.',
      '.............',
    ),
    { x: 100, y: 50 },
    2,
  )
  assert.equal(silhouette.length, 3)
  assert.deepEqual(
    silhouette.map(({ holes }) => holes.length).sort(),
    [0, 0, 1],
  )
  const ring = silhouette.find(({ holes }) => holes.length === 1)!
  const box = bounds(ring.outline)
  assert.deepEqual([box.left, box.top], [100.5, 50.5], 'coordinates are mapped back with the origin and resolution')
})

test('diagonal touching pixels stay apart or join depending on the pixels between them', () => {
  assert.equal(traceContours(coverage('#.', '.#')).length, 2)
  assert.equal(traceContours(coverage('#2', '2#')).length, 1)
})
