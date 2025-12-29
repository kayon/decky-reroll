import {
  AppGame,
  InternalRouting,
  MIN_RESULTS_THRESHOLD,
  Process,
  Results,
  ScanOptions,
  ValueTypes,
} from '@/classes'
import { SteamAppOverview } from '@decky/ui/dist/globals/steam-client/App'
import Backend from '@/lib/backend'

export const NUMBER_RESULTS_PRE_PAGE = 10

export interface Settings {
  ScanOption: ScanOptions
  ResultsThreshold: number
}

interface GlobalState {
  route: InternalRouting
  scanType: ValueTypes
  scanValue: string
  scanValueError: boolean
  changeValue: string
  changeValueError: boolean
  loading: boolean
  game: AppGame | undefined
  process: Process | null
  results: Results | null
  results_page: number
  results_max_page: number
  footerLegendVisible: boolean
}

const initialState: GlobalState = {
  route: InternalRouting.Main,
  scanType: ValueTypes.Int32,
  scanValue: '',
  scanValueError: false,
  changeValue: '',
  changeValueError: false,
  loading: false,
  game: undefined,
  process: null,
  results: null,
  results_page: 1,
  results_max_page: 1,
  footerLegendVisible: false,
}

let store = { ...initialState }
const globalStateListeners = new Set<() => void>()

export const $store = {
  state: () => store,

  subscribe: (callback: () => void) => {
    globalStateListeners.add(callback)
    return () => globalStateListeners.delete(callback)
  },

  navigation: (route: InternalRouting) => {
    if (route !== store.route) {
      store = { ...store, route: route }
      globalStateListeners.forEach(callback => callback())
    }
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
    const isGameChanged = store.game?.gameid !== nextGame?.gameid

    if (isGameChanged) {
      store = {
        ...store,
        game: nextGame,
        process: null,
        scanValue: '',
        scanValueError: false,
        changeValue: '',
        changeValueError: false,
        results: null,
      }
      if (store.route === InternalRouting.ProcessDetails) {
        store = { ...store, route: InternalRouting.Main }
      }
      Backend.Clear().then()
    }
    globalStateListeners.forEach(callback => callback())
  },

  setState: (nextState: Partial<GlobalState>) => {
    if (nextState.results && nextState.results.List === null) {
      nextState.results.List = []
    }
    if ('scanValue' in nextState) {
      nextState.changeValue = nextState.scanValue
      nextState.changeValueError = nextState.scanValueError ?? store.scanValueError
    }
    // 当存在结果
    if ('results' in nextState) {
      const newResults = nextState.results
      if (!newResults || !newResults.List || newResults.List.length === 0) {
        nextState.results_page = 1
        nextState.results_max_page = 1
      } else {
        const listLength = newResults.List.length
        const maxPage = Math.ceil(listLength / NUMBER_RESULTS_PRE_PAGE)
        nextState.results_max_page = maxPage
        if (store.results_page > maxPage) {
          nextState.results_page = 1
        }
      }
    }
    store = { ...store, ...nextState }
    globalStateListeners.forEach(callback => callback())
  },

  setPage: (page: number): boolean => {
    if (page < 1 || page > store.results_max_page) {
      return false
    }
    if (store.results_page === page) {
      return false
    }
    store = { ...store, results_page: page }
    globalStateListeners.forEach(callback => callback())
    return true
  },

  updateRootContainerHeight: (height: number) => {
    // 通常是480 当 FooterLegend 显示时为 440
    const visible = height < 480
    if (visible !== store.footerLegendVisible) {
      store = { ...store, footerLegendVisible: visible }
      globalStateListeners.forEach(callback => callback())
    }
  },

  updateResultsValues: (newList: string[][]) => {
    if (!store.results) {
      return
    }
    const updateResults = {
      ...store.results,
      List: newList,
    }
    store = { ...store, results: updateResults }
    globalStateListeners.forEach(callback => callback())
  },
}

const settingsListeners = new Set<() => void>()
const initialSettings: Settings = {
  ResultsThreshold: MIN_RESULTS_THRESHOLD,
  ScanOption: ScanOptions.FloatUnrounded,
}
let settings = { ...initialSettings }

export const $settings = {
  get ResultsThreshold() {
    return settings.ResultsThreshold
  },
  get ScanOption() {
    return settings.ScanOption
  },

  init: async () => {
    settings.ResultsThreshold = (await Backend.GetSetting(
      'ResultsThreshold',
      30
    )) as number

    settings.ScanOption = (await Backend.GetSetting(
      'ScanOption',
      ScanOptions.FloatRounded
    )) as ScanOptions
  },

  subscribe: (callback: () => void) => {
    settingsListeners.add(callback)
    return () => settingsListeners.delete(callback)
  },

  state: () => settings,

  async setResultsThreshold(value: number) {
    if (value !== settings.ResultsThreshold) {
      settings = { ...settings, ResultsThreshold: value }
      await Backend.SetRenderResultsThreshold(settings.ResultsThreshold)
      await Backend.SetSetting('ResultsThreshold', settings.ResultsThreshold)
      settingsListeners.forEach(callback => callback())
    }
  },

  async setScanOption(value: ScanOptions) {
    if (value !== settings.ScanOption) {
      settings = { ...settings, ScanOption: value }
      await Backend.SetSetting('ScanOption', settings.ScanOption)
      settingsListeners.forEach(callback => callback())
    }
  },
}
