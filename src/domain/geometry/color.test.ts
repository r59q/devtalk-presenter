import { test } from 'node:test'
import assert from 'node:assert/strict'
import { hex, mixColors, toCss } from './color.ts'

test('parses short and long hex colors', () => {
  assert.deepEqual(hex('#fff'), { r: 255, g: 255, b: 255, a: 1 })
  assert.deepEqual(hex('#00000000'), { r: 0, g: 0, b: 0, a: 0 })
  assert.deepEqual(hex('1e90ff'), { r: 30, g: 144, b: 255, a: 1 })
})

test('rejects malformed hex colors', () => {
  assert.throws(() => hex('#nope'))
})

test('mixes colors channel by channel', () => {
  const middle = mixColors(hex('#000'), hex('#fff'), 0.5)
  assert.equal(toCss(middle), 'rgba(128, 128, 128, 1)')
})
