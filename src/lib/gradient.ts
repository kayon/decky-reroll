import { ValueTypes } from '../classes'

// The gradient written over the results of a type

const INT_MIN: Partial<Record<ValueTypes, bigint>> = {
  [ValueTypes.Int8]: -(2n ** 7n),
  [ValueTypes.Int16]: -(2n ** 15n),
  [ValueTypes.Int32]: -(2n ** 31n),
  [ValueTypes.Int64]: -(2n ** 63n),
}

// The values of `count` results, or null when there is no gradient to make
export const gradientValues = (start: string, type: ValueTypes, count: number): string[] | null => {
  if (count <= 0) {
    return null
  }
  const text = start.trim()
  if (type === ValueTypes.Float32 || type === ValueTypes.Float64) {
    const first = parseFloat(text)
    if (!isFinite(first) || first === 0) {
      return null
    }
    return Array.from({ length: count }, (_, i) => String(first > 0 ? Math.max(first - i, 0) : first - i))
  }
  let first: bigint
  try {
    first = BigInt(text)
  } catch {
    return null
  }
  if (first === 0n) {
    return null
  }
  const min = INT_MIN[type]
  if (min === undefined) {
    return null
  }
  return Array.from({ length: count }, (_, i) => {
    const value = first - BigInt(i)
    return String(first > 0n ? (value < 0n ? 0n : value) : value < min ? min : value)
  })
}
