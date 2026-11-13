import { test } from 'node:test'
import assert from 'node:assert/strict'
import { Outline } from './outline.ts'

const outline = new Outline([2, 1, 3])

test('moves through steps before moving to the next slide', () => {
  assert.deepEqual(outline.next({ slide: 0, step: 0 }), { slide: 0, step: 1 })
  assert.deepEqual(outline.next({ slide: 0, step: 1 }), { slide: 1, step: 0 })
  assert.equal(outline.next({ slide: 2, step: 2 }), undefined)
})

test('going back from an entrance lands on the last step of the previous slide', () => {
  assert.deepEqual(outline.previous({ slide: 2, step: 0 }), { slide: 1, step: 0 })
  assert.deepEqual(outline.previous({ slide: 1, step: 0 }), { slide: 0, step: 1 })
  assert.equal(outline.previous({ slide: 0, step: 0 }), undefined)
})

test('knows its ends and clamps positions into range', () => {
  assert.deepEqual(outline.first, { slide: 0, step: 0 })
  assert.deepEqual(outline.last, { slide: 2, step: 2 })
  assert.deepEqual(outline.clamp({ slide: 9, step: 9 }), { slide: 2, step: 2 })
  assert.deepEqual(outline.clamp({ slide: -1, step: 4 }), { slide: 0, step: 1 })
})
