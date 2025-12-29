import { callable } from '@decky/api'
import { Results, Process, ScanOptions, ValueTypes } from '@/classes'
import { Settings } from '@/store'

const GetSetting = callable<[key: keyof Settings, fallback: unknown], unknown>('get_setting')
const SetSetting = callable<[key: keyof Settings, value: unknown], void>('set_setting')

const Version = callable<[], string>('version')
const SetRenderResultsThreshold = callable<[value: number], void>('set_render_results_threshold')
const Clear = callable<[], void>('clear')
const ResetScan = callable<[], void>('reset_scan')
const GetGameProcesses = callable<[appid: number], Process[] | null>('get_game_processes')
const SelectGameProcess = callable<[appid: number, pid: number], Process | null>('select_game_process')
const AutoSelectGameProcess = callable<[appid: number], Process | null>('auto_select_game_process')
const FirstScan = callable<
  [appid: number, value: string, type: ValueTypes, option: ScanOptions],
  Results | null
>('first_scan')
const NextScan = callable<[value: string], Results | null>('next_scan')
const ChangeValues = callable<[value: string, indexes: number[]], Results | null>('change_values')
const RefreshValues = callable<[], Results | null>('refresh_values')

export default {
  GetSetting,
  SetSetting,
  Version,
  SetRenderResultsThreshold,
  Clear,
  ResetScan,
  GetGameProcesses,
  SelectGameProcess,
  AutoSelectGameProcess,
  FirstScan,
  NextScan,
  ChangeValues,
  RefreshValues,
}
