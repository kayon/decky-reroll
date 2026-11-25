import { callable } from '@decky/api'
import { MultiResults, Results, Process, ScanOptions, ValueTypes } from '@/classes'
import { Settings } from '@/stores/settings'

const GetSetting = callable<[key: keyof Settings, fallback: unknown], unknown>('get_setting')
const SetSetting = callable<[key: keyof Settings, value: unknown], void>('set_setting')

const Version = callable<[], string>('version')
const SetRenderResultsThreshold = callable<[value: number], void>('set_render_results_threshold')
const Clear = callable<[], void>('clear')
const ResetScan = callable<[], void>('reset_scan')
// Forgets the search of one slot; the other slots stay as they are
const ResetSlot = callable<[slot: number], void>('reset_slot')
const GetGameProcesses = callable<[appid: number], Process[] | null>('get_game_processes')
const SelectGameProcess = callable<[appid: number, pid: number], Process | null>('select_game_process')
const AutoSelectGameProcess = callable<[appid: number], Process | null>('auto_select_game_process')
const FirstScan = callable<
  [appid: number, value: string, type: ValueTypes, option: ScanOptions, emulator: boolean],
  Results | null
>('first_scan')
const NextScan = callable<[value: string], Results | null>('next_scan')
const UndoScan = callable<[], Results | null>('undo_scan')
const ChangeValues = callable<[value: string, indexes: number[]], Results | null>('change_values')
const RefreshValues = callable<[], Results | null>('refresh_values')
const ToggleFreeze = callable<[index: number, value: string, freeze: boolean], { success: boolean, frozen: boolean }>('toggle_freeze')
const ClearFrozen = callable<[], { success: boolean }>('clear_frozen')
const GetFrozenIndices = callable<[], number[]>('get_frozen_indices')

// Multi-type scan: every type the value can be searched in, at once
const FirstScanMulti = callable<
  [slot: number, appid: number, value: string, option: ScanOptions, emulator: boolean, typesMask: number],
  MultiResults | null
>('first_scan_multi')
const NextScanMulti = callable<[slot: number, value: string], MultiResults | null>('next_scan_multi')
const UndoScanMulti = callable<[slot: number], MultiResults | null>('undo_scan_multi')
// Drops the types that are not in typesMask
const KeepOnlyMulti = callable<[slot: number, typesMask: number], MultiResults | null>('keep_only_multi')
const ChangeValuesMulti = callable<
  [slot: number, type: ValueTypes, value: string, indexes: number[]],
  MultiResults | null
>('change_values_multi')
// One value per result, to tell the addresses apart (see lib/gradient.ts)
const ChangeValuesGradient = callable<
  [slot: number, type: ValueTypes, values: string[], indexes: number[]],
  MultiResults | null
>('change_values_gradient')
const RefreshValuesMulti = callable<[slot: number], MultiResults | null>('refresh_values_multi')
const ToggleFreezeMulti = callable<
  [slot: number, type: ValueTypes, index: number, value: string, freeze: boolean],
  { success: boolean; frozen: boolean }
>('toggle_freeze_multi')
// Locks every result of the type at once
const FreezeAllMulti = callable<[slot: number, type: ValueTypes, values: string[], freeze: boolean], number[]>(
  'freeze_all_multi'
)
const GetFrozenIndicesMulti = callable<[slot: number, type: ValueTypes], number[]>('get_frozen_indices_multi')

export default {
  GetSetting,
  SetSetting,
  Version,
  SetRenderResultsThreshold,
  Clear,
  ResetScan,
  ResetSlot,
  GetGameProcesses,
  SelectGameProcess,
  AutoSelectGameProcess,
  FirstScan,
  NextScan,
  UndoScan,
  ChangeValues,
  RefreshValues,
  ToggleFreeze,
  ClearFrozen,
  GetFrozenIndices,
  FirstScanMulti,
  NextScanMulti,
  UndoScanMulti,
  KeepOnlyMulti,
  ChangeValuesMulti,
  ChangeValuesGradient,
  RefreshValuesMulti,
  ToggleFreezeMulti,
  GetFrozenIndicesMulti,
  FreezeAllMulti,
}