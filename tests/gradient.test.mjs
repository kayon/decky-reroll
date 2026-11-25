import test from 'node:test'
import assert from 'node:assert/strict'
import { ValueTypes } from '../src/classes.js'
import { gradientValues } from '../src/lib/gradient.js'

const { Int8, Int16, Int32, Int64, Float32, Float64 } = ValueTypes

test('a positive value goes down by one on each result', () => {
  assert.deepEqual(gradientValues('87', Int32, 5), ['87', '86', '85', '84', '83'])
})

test('a positive value stops at zero, it never turns negative', () => {
  assert.deepEqual(gradientValues('3', Int32, 6), ['3', '2', '1', '0', '0', '0'])
  assert.deepEqual(gradientValues('1', Int64, 3), ['1', '0', '0'])
})

test('a negative value goes away from zero and stops at the minimum of the type', () => {
  assert.deepEqual(gradientValues('-126', Int8, 5), ['-126', '-127', '-128', '-128', '-128'])
  assert.deepEqual(gradientValues('-32767', Int16, 3), ['-32767', '-32768', '-32768'])
  assert.deepEqual(gradientValues('-2147483647', Int32, 3), ['-2147483647', '-2147483648', '-2147483648'])
  assert.deepEqual(gradientValues('-9223372036854775807', Int64, 3), [
    '-9223372036854775807',
    '-9223372036854775808',
    '-9223372036854775808',
  ])
})

test('no gradient from zero, from text, or without result', () => {
  assert.equal(gradientValues('0', Int32, 5), null)
  assert.equal(gradientValues('+0000', Int32, 5), null)
  assert.equal(gradientValues('0.0', Float32, 5), null)
  assert.equal(gradientValues('', Int32, 5), null)
  assert.equal(gradientValues('abc', Int32, 5), null)
  assert.equal(gradientValues('1.5', Int32, 5), null)
  assert.equal(gradientValues('87', Int32, 0), null)
})
