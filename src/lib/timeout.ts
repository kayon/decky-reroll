// A scan takes milliseconds, a few seconds on a very big game
export const SCAN_TIMEOUT_MS = 60_000

export class BackendTimeout extends Error {
  constructor(public readonly ms: number) {
    super(`no answer from the backend after ${ms} ms`)
    this.name = 'BackendTimeout'
  }
}

// The promise, or a BackendTimeout when it takes more than `ms`
export const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> =>
  new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new BackendTimeout(ms)), ms)
    promise.then(
      value => {
        clearTimeout(timer)
        resolve(value)
      },
      error => {
        clearTimeout(timer)
        reject(error)
      }
    )
  })
