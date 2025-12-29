import { JSX, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { $settings, $store } from '@/store'
import { Focusable, PanelSection, PanelSectionRow, SliderField } from '@decky/ui'
import {
  InternalRouting,
  MAX_RESULTS_THRESHOLD,
  MIN_RESULTS_THRESHOLD,
  ScanOptions,
} from '@/classes'
import Trans from '@/lib/i18n'
import SwitchButtons from '@/components/SwitchButtons'

const Settings = (): JSX.Element => {
  const settings = useSyncExternalStore($settings.subscribe, $settings.state)
  const [resultsThreshold, setResultsThreshold] = useState<number>(settings.ResultsThreshold)
  const [scanOption, setScanOption] = useState<number>(settings.ScanOption)
  const latestSetting = useRef({ resultsThreshold, scanOption })

  useEffect(() => {
    latestSetting.current = { resultsThreshold, scanOption }
  }, [resultsThreshold, scanOption])

  useEffect(() => {
    return () => {
      if (latestSetting.current.resultsThreshold !== settings.ResultsThreshold) {
        $settings.setResultsThreshold(latestSetting.current.resultsThreshold)
      }
      if (latestSetting.current.scanOption !== settings.ScanOption) {
        $settings.setScanOption(latestSetting.current.scanOption)
      }
    }
  }, [settings.ResultsThreshold, settings.ScanOption])

  return (
    <Focusable
      autoFocus
      noFocusRing
      onCancelButton={() => {
        $store.navigation(InternalRouting.Main)
      }}
      style={{
        padding: 0,
      }}
    >
      <PanelSection title={Trans('SETTINGS', 'Settings')}>
        <PanelSectionRow>
          <SliderField
            label={`${Trans('RESULTS_THRESHOLD', 'Results threshold')}`}
            notchCount={3}
            notchLabels={[
              {
                notchIndex: 0,
                label: `${MIN_RESULTS_THRESHOLD}`,
                value: MIN_RESULTS_THRESHOLD,
              },
              {
                notchIndex: 1,
                label: `${MAX_RESULTS_THRESHOLD - MIN_RESULTS_THRESHOLD / 2}`,
                value: MAX_RESULTS_THRESHOLD - MIN_RESULTS_THRESHOLD / 2,
              },
              {
                notchIndex: 2,
                label: `${MAX_RESULTS_THRESHOLD}`,
                value: MAX_RESULTS_THRESHOLD,
              },
            ]}
            notchTicksVisible={false}
            showValue
            value={resultsThreshold}
            resetValue={30}
            step={1}
            min={MIN_RESULTS_THRESHOLD}
            max={MAX_RESULTS_THRESHOLD}
            onChange={value => setResultsThreshold(value)}
          />
        </PanelSectionRow>
        <PanelSectionRow>
          <div
            style={{
              fontSize: '16px',
              lineHeight: '20px',
              color: '#dcdedf',
              padding: '8px 0 0',
            }}
          >
            {Trans('SCAN_OPTION_FLOAT', 'Floating Point Options')}
          </div>

          <SwitchButtons
            vertical
            options={[
              {
                label: Trans('SCAN_OPTION_FLOAT_UNROUNDED', 'Fast'),
                value: ScanOptions.FloatUnrounded,
              },
              {
                label: Trans('SCAN_OPTION_FLOAT_ROUNDED', 'Rounding (Nearest)'),
                value: ScanOptions.FloatRounded,
              },
              {
                label: Trans('SCAN_OPTION_FLOAT_EXTREME', 'Rounding (Extreme)'),
                value: ScanOptions.FloatExtreme,
              },
              {
                label: Trans('SCAN_OPTION_FLOAT_TRUNCATED', 'Truncated'),
                value: ScanOptions.FloatTruncated,
              },
            ]}
            selected={scanOption}
            onSelect={value => setScanOption(value)}
            buttonStyle={{
              fontSize: '12px',
              height: '30px',
              flexBasis: '30px',
            }}
          />
        </PanelSectionRow>
      </PanelSection>
    </Focusable>
  )
}

export default Settings
