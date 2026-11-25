// R2 starts the scan that is available

export type ScanAction = 'first' | 'next'

// X on the roller that writes values
export const pickFreezeAllAction = (frozenCount: number, resultCount: number): 'freeze' | 'unfreeze' | null => {
  if (resultCount <= 0) {
    return null
  }
  return frozenCount > 0 ? 'unfreeze' : 'freeze'
}

// First scan when it is the only one available, else next scan when it is
export const pickScanAction = (state: {
  loading: boolean
  firstScannable: boolean
  nextScannable: boolean
}): ScanAction | null => {
  if (state.loading) {
    return null
  }
  if (state.firstScannable) {
    return 'first'
  }
  if (state.nextScannable) {
    return 'next'
  }
  return null
}
