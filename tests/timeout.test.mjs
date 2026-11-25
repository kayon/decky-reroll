import test from 'node:test'
import assert from 'node:assert/strict'
import { BackendTimeout, SCAN_TIMEOUT_MS, withTimeout } from '../src/lib/timeout.js'

test('a call that fails fails the same way, at once', async () => {
  const error = new Error('python exception')
  await assert.rejects(withTimeout(Promise.reject(error), 1000), error)
})

test('a call that never answers gives up with a BackendTimeout', async () => {
  const started = Date.now()
  await assert.rejects(withTimeout(new Promise(() => {}), 30), error => {
    assert.ok(error instanceof BackendTimeout)
    assert.equal(error.ms, 30)
    return true
  })
  assert.ok(Date.now() - started < 1000)
})
