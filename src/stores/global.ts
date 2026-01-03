import { AppGame, InternalRouting, Process, Results, ValueTypes } from '@/classes'
import { proxy } from 'valtio'
import { SteamAppOverview } from '@decky/ui/dist/globals/steam-client/App'
import Backend from '@/lib/backend'

export const NUMBER_RESULTS_PRE_PAGE = 10

interface GlobalState {
  version: string
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
  version: '0.0.0',
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

export const globalState = proxy<GlobalState>({ ...initialState })

export const $globalState = {
  navigation: (route: InternalRouting) => {
    if (route !== globalState.route) {
      globalState.route = route
    }
  },

  setScanType: (scanType: ValueTypes) => {
    globalState.scanType = scanType
    globalState.scanValue = ''
    globalState.scanValueError = false
  },

  resetScan: (withoutBackend = false) => {
    globalState.scanValue = ''
    globalState.scanValueError = false
    globalState.changeValue = ''
    globalState.changeValueError = true
    globalState.results = null
    if (!withoutBackend) {
      Backend.ResetScan().then()
    }
  },

  setScanValue: (value: string) => {
    globalState.scanValue = value
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
      $globalState.resetScan(true)

      globalState.game = nextGame
      globalState.process = null
      if (globalState.route === InternalRouting.ProcessDetails) {
        globalState.route = InternalRouting.Main
      }
      Backend.Clear().then()
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
    $globalState.resetScan()
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
    $globalState.resetScan()
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
    const visible = height < 480
    if (visible !== globalState.footerLegendVisible) {
      globalState.footerLegendVisible = visible
    }
  },
}
