import { test } from 'node:test'
import assert from 'node:assert/strict'
import { formatRoute, parseRoute } from './route.ts'

test('round-trips a route through the URL hash', () => {
  const route = { id: 'my-talk', position: { slide: 2, step: 1 } }
  assert.equal(formatRoute(route), '#/my-talk/3/1')
  assert.deepEqual(parseRoute('#/my-talk/3/1'), route)
})

test('defaults to the start of the presentation', () => {
  assert.deepEqual(parseRoute('#/my-talk'), { id: 'my-talk', position: { slide: 0, step: 0 } })
  assert.deepEqual(parseRoute('#/my-talk/nope/-4'), { id: 'my-talk', position: { slide: 0, step: 0 } })
})

test('an empty hash is no route', () => {
  assert.equal(parseRoute(''), undefined)
  assert.equal(parseRoute('#/'), undefined)
})
