import test from 'node:test'
import assert from 'node:assert/strict'
import { ValueTypes } from '../src/classes.js'
import { canKeepOnly, hasUsableResults, isParked, pickSelectedType, toResults, truncatedTypes } from '../src/lib/multi.js'

const { Int16, Int32, Int64, Float32, Float64 } = ValueTypes

const type = (Type, Count, Status = 'ok', List = null) => ({ Type, Name: ValueTypes[Type], Count, Status, List })
const multi = (...Types) => ({ Types, Round: 2, Time: '3ms', CanUndo: true })

test('keeps the type being looked at while it has results', () => {
  const m = multi(type(Int32, 3, 'ok', [['A', '1']]), type(Int64, 5, 'ok', [['B', '1']]))
  assert.equal(pickSelectedType(m, Int64), Int64)
  assert.equal(pickSelectedType(m, Int32), Int32)
})

test('leaves a type that has nothing left', () => {
  for (const status of ['empty', 'dropped', 'truncated']) {
    const m = multi(type(Int32, 0, status), type(Int64, 5, 'ok', [['B', '1']]))
    assert.equal(pickSelectedType(m, Int32), Int64, status)
  }
  // results that exist but status says they are gone
  assert.equal(pickSelectedType(multi(type(Int32, 4, 'dropped'), type(Int64, 1, 'ok', [['B', '1']])), Int32), Int64)
})

test('toResults gives the list view of one type', () => {
  const list = [['147551B0', '1000']]
  const m = multi(type(Int32, 12, 'ok', list), type(Int64, 3))
  assert.deepEqual(toResults(m, Int32), { Count: 12, List: list, Round: 2, Time: '3ms', CanUndo: true })
  // a type that is parked or has no list: a count and an empty list, never null
  assert.deepEqual(toResults(m, Int64), { Count: 3, List: [], Round: 2, Time: '3ms', CanUndo: true })
  assert.deepEqual(toResults(m, null), { Count: 0, List: [], Round: 2, Time: '3ms', CanUndo: true })
  assert.deepEqual(toResults(m, Float64), { Count: 0, List: [], Round: 2, Time: '3ms', CanUndo: true })
})

test('keep only is not offered when no other type has results: nothing to drop', () => {
  const alone = multi(type(Int32, 3), type(Int64, 0, 'empty'), type(Float32, 4, 'dropped'))
  assert.equal(canKeepOnly(alone, Int32), false)
  // a parked type counts as having results
  const withParked = multi(type(Int32, 3), type(Int16, 4000000, 'parked'))
  assert.equal(canKeepOnly(withParked, Int32), true)
  assert.equal(canKeepOnly(withParked, Int16), true)
})
