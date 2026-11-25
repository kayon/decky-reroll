import { ValueTypes } from '../classes'

// Which types can hold what the user typed

const ALL_TYPES = [
  ValueTypes.Int8,
  ValueTypes.Int16,
  ValueTypes.Int32,
  ValueTypes.Int64,
  ValueTypes.Float32,
  ValueTypes.Float64,
]

const MAX_EXACT_FLOAT32 = 2n ** 24n
const MAX_EXACT_FLOAT64 = 2n ** 53n

const INTEGER = /^[+-]?[0-9]+$/
const DECIMAL = /^[0-9+\-.eE]+$/
const HAS_DIGIT = /[0-9]/

export const candidateTypes = (raw: string, allowZero: boolean): ValueTypes[] => {
  const text = raw.trim()
  if (text === '') {
    return []
  }
  if (INTEGER.test(text)) {
    return integerTypes(text, allowZero)
  }
  if (DECIMAL.test(text) && HAS_DIGIT.test(text)) {
    return decimalTypes(text, allowZero)
  }
  return []
}

const integerTypes = (text: string, allowZero: boolean): ValueTypes[] => {
  const negative = text[0] === '-'
  const n = BigInt(text.replace(/^[+-]/, '')) * (negative ? -1n : 1n)
  if (n === 0n) {
    return allowZero ? [...ALL_TYPES] : []
  }

  const types: ValueTypes[] = []
  if (negative) {
    if (n < -(2n ** 63n)) {
      return []
    }
    if (n >= -(2n ** 7n)) types.push(ValueTypes.Int8)
    if (n >= -(2n ** 15n)) types.push(ValueTypes.Int16)
    if (n >= -(2n ** 31n)) types.push(ValueTypes.Int32)
    types.push(ValueTypes.Int64)
    if (n >= -MAX_EXACT_FLOAT32) types.push(ValueTypes.Float32)
    if (n >= -MAX_EXACT_FLOAT64) types.push(ValueTypes.Float64)
    return types
  }

  if (n >= 2n ** 64n) {
    return []
  }
  if (n < 2n ** 8n) types.push(ValueTypes.Int8)
  if (n < 2n ** 16n) types.push(ValueTypes.Int16)
  if (n < 2n ** 32n) types.push(ValueTypes.Int32)
  types.push(ValueTypes.Int64)
  if (n <= MAX_EXACT_FLOAT32) types.push(ValueTypes.Float32)
  if (n <= MAX_EXACT_FLOAT64) types.push(ValueTypes.Float64)
  return types
}

const decimalTypes = (text: string, allowZero: boolean): ValueTypes[] => {
  const value = Number(text)
  if (!Number.isFinite(value)) {
    return []
  }
  if (value === 0) {
    return allowZero ? [ValueTypes.Float32, ValueTypes.Float64] : []
  }
  const types: ValueTypes[] = []
  // a float32 that overflows is infinite, one that underflows silently becomes 0
  const single = Math.fround(value)
  if (Number.isFinite(single) && single !== 0) {
    types.push(ValueTypes.Float32)
  }
  types.push(ValueTypes.Float64)
  return types
}

// What the types of a scan are told to be searched
export const typesToSearch = (candidates: ValueTypes[], manual: ValueTypes[]): ValueTypes[] =>
  manual.length === 0 ? candidates : candidates.filter(type => manual.includes(type))

// Bit mask the backend takes: one bit per type number, 0 = every type that fits
export const typesMask = (types: ValueTypes[]): number =>
  types.reduce((mask, type) => mask | (1 << type), 0)

// 4200000 -> "4.2M", 1500 -> "1.5K"
export const formatCount = (count: number): string => {
  const compact = (value: number, unit: string) => {
    const text = value >= 100 ? Math.round(value).toString() : value.toFixed(1).replace(/\.0$/, '')
    return `${text}${unit}`
  }
  if (count >= 1e6) {
    return compact(count / 1e6, 'M')
  }
  if (count >= 1e4) {
    return compact(count / 1e3, 'K')
  }
  return count.toString()
}
