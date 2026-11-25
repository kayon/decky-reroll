import { MultiResults, Results, TypeResults, ValueTypes } from '../classes'

// What a React snapshot of the state is: the same data, read only
export type ReadonlyDeep<T> = T extends (infer U)[]
  ? readonly ReadonlyDeep<U>[]
  : T extends object
    ? { readonly [K in keyof T]: ReadonlyDeep<T[K]> }
    : T

// A type whose results can still be refined or written
export const isUsable = (type: ReadonlyDeep<TypeResults>): boolean =>
  (type.Status === 'ok' || type.Status === 'parked') && type.Count > 0

// The type whose results are shown
export const pickSelectedType = (multi: MultiResults, current: ValueTypes | null): ValueTypes | null => {
  const kept = multi.Types.find(t => t.Type === current)
  if (kept && isUsable(kept)) {
    return kept.Type
  }
  const listed = multi.Types.find(t => isUsable(t) && t.Status === 'ok' && (t.List?.length ?? 0) > 0)
  if (listed) {
    return listed.Type
  }
  return multi.Types.find(isUsable)?.Type ?? null
}

// "Keep only this type"
export const canKeepOnly = (multi: ReadonlyDeep<MultiResults> | null, type: ValueTypes): boolean => {
  if (!multi) {
    return false
  }
  const chip = multi.Types.find(t => t.Type === type)
  return !!chip && isUsable(chip) && multi.Types.some(t => t.Type !== type && isUsable(t))
}

// The types whose results were dropped because there were more than can be kept
export const truncatedTypes = (multi: ReadonlyDeep<MultiResults>): string[] =>
  multi.Types.filter(t => t.Status === 'truncated').map(t => t.Name)

// A type with too many results to list
export const isParked = (multi: ReadonlyDeep<MultiResults> | null, type: ValueTypes | null): boolean =>
  !!multi && multi.Types.some(t => t.Type === type && t.Status === 'parked')

// Whether another scan can refine something: some type still has results
export const hasUsableResults = (multi: ReadonlyDeep<MultiResults> | null): boolean =>
  !!multi && multi.Types.some(isUsable)

// The single-list view the result list works with, for one type
export const toResults = (multi: MultiResults, type: ValueTypes | null): Results => {
  const entry = multi.Types.find(t => t.Type === type)
  return {
    Count: entry?.Count ?? 0,
    List: entry?.List ?? [],
    Round: multi.Round,
    Time: multi.Time,
    CanUndo: multi.CanUndo,
  }
}
