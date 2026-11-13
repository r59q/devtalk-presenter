import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ease } from '../animation/easing.ts'
import { hex } from '../geometry/color.ts'
import { blend, pairClouds, type PointCloud } from './point-cloud.ts'

const white = hex('#fff')
const cloud = (...xs: number[]): PointCloud => xs.map((x) => ({ x, y: 0, color: white }))

test('pairs clouds of different sizes, keeping left-to-right order', () => {
  const pairs = pairClouds(cloud(30, 10, 20), cloud(100, 200, 300, 400, 500, 600))
  assert.equal(pairs.length, 6)
  assert.deepEqual(
    pairs.map(({ from, to }) => [from.x, to.x]),
    [
      [10, 100],
      [10, 200],
      [20, 300],
      [20, 400],
      [30, 500],
      [30, 600],
    ],
  )
})

test('an empty cloud fades in place of the other one', () => {
  const pairs = pairClouds([], cloud(5))
  assert.equal(pairs[0].from.x, 5)
  assert.equal(pairs[0].from.color.a, 0)
  assert.equal(pairs[0].to.color.a, 1)
  assert.deepEqual(pairClouds([], []), [])
})

test('blending moves particles from start to end', () => {
  const pairs = pairClouds(cloud(0, 10), cloud(100, 110))
  assert.deepEqual(
    blend(pairs, 0, 0.5, ease.linear).map(({ x }) => x),
    [0, 10],
  )
  assert.deepEqual(
    blend(pairs, 1, 0.5, ease.linear).map(({ x }) => x),
    [100, 110],
  )
})

test('with a sweep, left particles set off before right ones', () => {
  const pairs = pairClouds(cloud(0, 10), cloud(100, 110))
  const [left, right] = blend(pairs, 0.4, 1, ease.linear)
  assert.ok(left.x - 0 > right.x - 10)
})
