import { AppGame, InternalRouting, MultiResults, Process, Results, ValueTypes } from '@/classes'
import { proxy } from 'valtio'
import { SteamAppOverview } from '@decky/ui/dist/globals/steam-client/App'
import Backend from '@/lib/backend'
import { pickSelectedType, toResults } from '@/lib/multi'
import { ScanAction } from '@/lib/shortcut'
import { typesMask } from '@/lib/candidates'
import { SCAN_TIMEOUT_MS, withTimeout } from '@/lib/timeout'
import { NUM_SLOTS, nextSlot } from '@/lib/slots'
import Logger from '@/lib/Logger'

export const NUMBER_RESULTS_PRE_PAGE = 10

interface GlobalState {
  version: string
  route: InternalRouting
  // types forced by the user for the next first scan
  manualTypes: ValueTypes[]
  // the search that is looked at and worked on
  activeSlot: number
  // the type whose results are listed
  selectedType: ValueTypes | null
  // what R2 starts right now, null when it does nothing
  scanShortcut: ScanAction | null
  // the focus is on what changes values (header, value roller, list)
  scanShortcutBlocked: boolean
  scanValue: string
  scanValueError: boolean
  changeValue: string
  changeValueError: boolean
  loading: boolean
  game: AppGame | undefined
  process: Process | null
  results: Results | null
  // result of the multi-type scan: one entry per searched type
  multiResults: MultiResults | null
  results_page: number
  results_max_page: number
  // the frozen results of the listed type, by position
  frozenIndices: number[]
  // what the other slots show
  slots: SlotView[]
  footerLegendVisible: boolean
}

// What is kept for each slot: everything that belongs to one search
const SLOT_FIELDS = [
  'manualTypes',
  'selectedType',
  'scanValue',
  'scanValueError',
  'changeValue',
  'changeValueError',
  'results',
  'multiResults',
  'results_page',
  'results_max_page',
  'frozenIndices',
] as const
type SlotView = Pick<GlobalState, (typeof SLOT_FIELDS)[number]>

const emptySlot = (): SlotView => ({
  manualTypes: [],
  selectedType: null,
  scanValue: '',
  scanValueError: false,
  changeValue: '',
  changeValueError: true,
  results: null,
  multiResults: null,
  results_page: 1,
  results_max_page: 1,
  frozenIndices: [],
})

const initialState: GlobalState = {
  version: '0.0.0',
  route: InternalRouting.Main,
  manualTypes: [],
  activeSlot: 0,
  selectedType: null,
  scanShortcut: null,
  scanShortcutBlocked: false,
  scanValue: '',
  scanValueError: false,
  changeValue: '',
  changeValueError: false,
  loading: false,
  game: undefined,
  process: null,
  results: null,
  multiResults: null,
  results_page: 1,
  results_max_page: 1,
  frozenIndices: [],
  slots: Array.from({ length: NUM_SLOTS }, emptySlot),
  footerLegendVisible: false,
}

export const globalState = proxy<GlobalState>({ ...initialState })

// A copy of the fields of a slot that shares nothing with the state
const cloneSlot = (view: SlotView): SlotView => JSON.parse(JSON.stringify(view)) as SlotView

export const $globalState = {
  navigation: (route: InternalRouting) => {
    if (route !== globalState.route) {
      globalState.route = route
    }
  },

  // The user forces a type (or lets it go) for the next first scan
  toggleManualType: (type: ValueTypes) => {
    const types = globalState.manualTypes.includes(type)
      ? globalState.manualTypes.filter(t => t !== type)
      : [...globalState.manualTypes, type]
    globalState.manualTypes = types.sort((a, b) => a - b)
  },

  clearManualTypes: () => {
    globalState.manualTypes = []
  },

  setScanShortcutBlocked: (blocked: boolean) => {
    if (blocked !== globalState.scanShortcutBlocked) {
      globalState.scanShortcutBlocked = blocked
    }
  },

  setScanShortcut: (action: ScanAction | null) => {
    if (action !== globalState.scanShortcut) {
      globalState.scanShortcut = action
    }
  },

  // The search that is shown is forgotten; the others stay as they are
  resetScan: () => {
    Object.assign(globalState, emptySlot())
    Backend.ResetSlot(globalState.activeSlot).then()
  },

  // Every search is forgotten (another game, another process)
  resetAllSlots: (withoutBackend = false) => {
    Object.assign(globalState, emptySlot())
    globalState.slots = Array.from({ length: NUM_SLOTS }, emptySlot)
    if (!withoutBackend) {
      Backend.Clear().then()
    }
  },

  // The user goes to another slot
  switchSlot: (target: number): boolean => {
    if (globalState.loading || target === globalState.activeSlot || target < 0 || target >= NUM_SLOTS) {
      return false
    }
    const copy = {} as Record<string, unknown>
    for (const field of SLOT_FIELDS) {
      copy[field] = globalState[field]
    }
    globalState.slots[globalState.activeSlot] = cloneSlot(copy as SlotView)
    Object.assign(globalState, cloneSlot(globalState.slots[target]))
    globalState.activeSlot = target
    return true
  },

  // L1 (-1) and R1 (+1)
  cycleSlot: (delta: number): boolean => $globalState.switchSlot(nextSlot(globalState.activeSlot, delta)),

  setFrozenIndices: (indices: number[]) => {
    globalState.frozenIndices = indices
  },

  setScanValue: (value: string) => {
    globalState.scanValue = value
    // the value to write starts as the searched one, sign included
    globalState.changeValue = value
    globalState.changeValueError = false
  },

  setGame: (game: SteamAppOverview | undefined) => {
    const nextGame: AppGame | undefined = game
      ? {
          appid: game.appid,
          gameid: game.gameid,
          display_name: game.display_name,
          icon_hash: game.icon_hash,
          local_cache_version: game.local_cache_version ?? 0,
        }
      : undefined
    if (globalState.game?.gameid !== nextGame?.gameid) {
      globalState.game = nextGame
      globalState.process = null
      if (globalState.route === InternalRouting.ProcessDetails) {
        globalState.route = InternalRouting.Main
      }
      $globalState.resetAllSlots()
    }
  },

  autoSelectGameProcess: async (): Promise<boolean> => {
    if (!globalState.game) {
      return false
    }
    if (globalState.process !== null) {
      return true
    }
    globalState.process = await Backend.AutoSelectGameProcess(globalState.game.appid)
    $globalState.resetAllSlots()
    return globalState.process !== null
  },

  selectGameProcess: async (pid: number) => {
    if (!globalState.game) {
      return
    }
    if (globalState.process?.PID === pid) {
      return
    }
    globalState.process = await Backend.SelectGameProcess(globalState.game.appid, pid)
    $globalState.resetAllSlots()
  },

  setResults: (results: Results | null) => {
    if (results) {
      if (results.List === null ) {
        results.List = []
      }
      globalState.results_max_page = Math.max(Math.ceil(results.List.length / NUMBER_RESULTS_PRE_PAGE), 1)
      if (globalState.results_page > globalState.results_max_page) {
        globalState.results_page = 1
      }
    } else {
      globalState.results_page = 1
      globalState.results_max_page = 1
    }
    globalState.results = results
  },

  // Keeps the result of a multi-type scan, and shows the list of one of its types
  setMultiResults: (multiResults: MultiResults | null) => {
    globalState.multiResults = multiResults
    if (!multiResults) {
      globalState.selectedType = null
      $globalState.setResults(null)
      return
    }
    globalState.selectedType = pickSelectedType(multiResults, globalState.selectedType)
    $globalState.setResults(toResults(multiResults, globalState.selectedType))
  },

  // The user looks at the results of another type
  selectType: (type: ValueTypes) => {
    if (!globalState.multiResults || type === globalState.selectedType) {
      return
    }
    globalState.selectedType = type
    globalState.results_page = 1
    $globalState.setResults(toResults(globalState.multiResults, type))
  },

  // The user knows which type holds the value
  keepOnly: async (type: ValueTypes) => {
    if (globalState.loading || !globalState.multiResults) {
      return
    }
    const slot = globalState.activeSlot
    try {
      const results = await withTimeout(Backend.KeepOnlyMulti(slot, typesMask([type])), SCAN_TIMEOUT_MS)
      // the user may have gone to another slot while the backend was working
      if (results !== null && slot === globalState.activeSlot) {
        $globalState.setMultiResults(results)
      }
    } catch (error) {
      Logger.error('KeepOnly', error)
    }
  },

  setResultsCurrentPage: (page: number): boolean => {
    if (page >= 1 && page <= globalState.results_max_page && globalState.results_page !== page) {
      globalState.results_page = page
      return true
    }
    return false
  },

  updateResultsValues: (newList: string[][]) => {
    if (globalState.results) {
      globalState.results.List = newList
    }
  },

  updateRootContainerHeight: (height: number) => {
    // 通常是480 当 FooterLegend 显示时为 440
    // usually 480, 440 when the FooterLegend is shown
    const visible = height < 480
    if (visible !== globalState.footerLegendVisible) {
      globalState.footerLegendVisible = visible
    }
  },
}
