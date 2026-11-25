import { MIN_RESULTS_THRESHOLD, ScanOptions } from '@/classes'
import { proxy } from 'valtio'
import Backend from '@/lib/backend'

export const DEFAULT_RESULTS_THRESHOLD = 40
export const DEFAULT_SCAN_OPTION = ScanOptions.FloatRounded

export interface Settings {
  ResultsThreshold: number
  ScanOption: ScanOptions
  HasAcceptedDisclaimer: boolean
  EmulatorMode: boolean
}

const initialSettings = {
  ResultsThreshold: MIN_RESULTS_THRESHOLD,
  ScanOption: ScanOptions.FloatUnrounded,
  HasAcceptedDisclaimer: false,
  EmulatorMode: false,
}

export const settings = proxy<Settings>({...initialSettings})

export const $settings = {
  async init() {
    settings.ResultsThreshold = (await Backend.GetSetting(
      'ResultsThreshold',
      DEFAULT_RESULTS_THRESHOLD
    )) as number

    settings.ScanOption = (await Backend.GetSetting(
      'ScanOption',
      DEFAULT_SCAN_OPTION
    )) as ScanOptions

    settings.HasAcceptedDisclaimer = (await Backend.GetSetting(
      'HasAcceptedDisclaimer',
      false
    )) as boolean

    settings.EmulatorMode = (await Backend.GetSetting('EmulatorMode', false)) as boolean

    await Backend.SetRenderResultsThreshold(settings.ResultsThreshold)
  },

  async setEmulatorMode(value: boolean) {
    if (value !== settings.EmulatorMode) {
      settings.EmulatorMode = value
      await Backend.SetSetting('EmulatorMode', settings.EmulatorMode)
    }
  },

  async setResultsThreshold(value: number) {
    if (value !== settings.ResultsThreshold) {
      settings.ResultsThreshold = value
      await Backend.SetRenderResultsThreshold(settings.ResultsThreshold)
      await Backend.SetSetting('ResultsThreshold', settings.ResultsThreshold)
    }
  },

  async setScanOption(value: ScanOptions) {
    if (value !== settings.ScanOption) {
      settings.ScanOption = value
      await Backend.SetSetting('ScanOption', settings.ScanOption)
    }
  },

  async acceptDisclaimer() {
    if (!settings.HasAcceptedDisclaimer) {
      settings.HasAcceptedDisclaimer = true
      await Backend.SetSetting('HasAcceptedDisclaimer', true)
    }
  }
}