import { test } from 'node:test'
import assert from 'node:assert/strict'
import type { AnimationContext } from './animation.ts'
import { ease } from './easing.ts'
import { delay, parallel, sequence, stagger, wait } from './timeline.ts'
import { animate, call } from './tween.ts'
import { Scene } from '../scene/scene.ts'

const context: AnimationContext = { scene: new Scene(), sampler: { spacing: 1, sample: () => [] } }
const linear = { ease: ease.linear, duration: 1 }

test('a sequence starts each animation from where the previous one left off', () => {
  const box = { x: 0 }
  const moves = sequence(animate(box, { x: 10 }, linear), animate(box, { x: 30 }, linear))
  assert.equal(moves.duration, 2)

  moves.start(context)
  moves.update(0.5)
  assert.equal(box.x, 10)
  moves.update(0.75)
  assert.equal(box.x, 20)
  moves.update(1)
  assert.equal(box.x, 30)
})

test('jumping straight to the end applies every animation in order', () => {
  const box = { x: 0, y: 0 }
  const moves = sequence(animate(box, { x: 5 }, linear), wait(2), animate(box, { x: 9, y: 1 }, linear))
  moves.start(context)
  moves.update(1)
  assert.deepEqual(box, { x: 9, y: 1 })
})

test('parallel animations last as long as the longest one', () => {
  const box = { x: 0, y: 0 }
  const both = parallel(animate(box, { x: 1 }, { duration: 1 }), animate(box, { y: 1 }, { duration: 3 }))
  assert.equal(both.duration, 3)
})

test('stagger and delay offset the start of animations', () => {
  const box = { a: 0, b: 0 }
  const staggered = stagger(1, animate(box, { a: 1 }, linear), animate(box, { b: 1 }, linear))
  assert.equal(staggered.duration, 2)
  staggered.start(context)
  staggered.update(0.25)
  assert.deepEqual(box, { a: 0.5, b: 0 })

  assert.equal(delay(2, wait(1)).duration, 3)
})

test('call runs its action when reached', () => {
  let calls = 0
  const step = sequence(wait(1), call(() => calls++))
  step.start(context)
  step.update(0.5)
  assert.equal(calls, 0)
  step.update(1)
  assert.equal(calls, 1)
})
