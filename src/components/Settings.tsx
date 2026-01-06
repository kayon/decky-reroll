import { JSX, useEffect, useRef, useState } from 'react'
import {
  $settings,
  DEFAULT_RESULTS_THRESHOLD,
  DEFAULT_SCAN_OPTION,
  settings,
} from '@/stores/settings'
import {
  ButtonItem,
  Focusable,
  PanelSection,
  PanelSectionRow,
  SliderField,
} from '@decky/ui'
import {
  InternalRouting,
  MAX_RESULTS_THRESHOLD,
  MIN_RESULTS_THRESHOLD,
  ScanOptions,
} from '@/classes'
import Trans from '@/lib/i18n'
import SwitchButtons from '@/components/SwitchButtons'
import { $globalState, globalState } from '@/stores/global'
import { useSnapshot } from 'valtio'

const Settings = (): JSX.Element => {
  const globalStateSnap = useSnapshot(globalState)
  const snap = useSnapshot(settings)
  const [resultsThreshold, setResultsThreshold] = useState<number>(snap.ResultsThreshold)
  const [scanOption, setScanOption] = useState<number>(snap.ScanOption)
  const latestRef = useRef({ resultsThreshold, scanOption })

  const canReset = resultsThreshold !== DEFAULT_RESULTS_THRESHOLD || scanOption !== DEFAULT_SCAN_OPTION

  useEffect(() => {
    setResultsThreshold(snap.ResultsThreshold)
    setScanOption(snap.ScanOption)
  }, [snap.ResultsThreshold, snap.ScanOption])

  useEffect(() => {
    latestRef.current = { resultsThreshold, scanOption }
  }, [resultsThreshold, scanOption])

  useEffect(() => {
    return () => {
      if (latestRef.current.resultsThreshold !== settings.ResultsThreshold) {
        $settings.setResultsThreshold(latestRef.current.resultsThreshold)
      }
      if (latestRef.current.scanOption !== settings.ScanOption) {
        $settings.setScanOption(latestRef.current.scanOption)
      }
    }
  }, [])

  const handleResetDefault = () => {
    setResultsThreshold(DEFAULT_RESULTS_THRESHOLD)
    setScanOption(DEFAULT_SCAN_OPTION)
  }

  return (
    <Focusable
      autoFocus
      noFocusRing
      onCancelButton={() => {
        $globalState.navigation(InternalRouting.Main)
      }}
      style={{
        padding: 0,
      }}
    >
      <PanelSection title={Trans('SETTINGS', 'Settings')}>
        <PanelSectionRow>
          <SliderField
            label={`${Trans('RESULTS_THRESHOLD', 'Results threshold')}`}
            notchCount={4}
            notchLabels={[
              {
                notchIndex: 0,
                label: `${MIN_RESULTS_THRESHOLD}`,
                value: MIN_RESULTS_THRESHOLD,
              },
              {
                notchIndex: 1,
                label: '40',
                value: 40,
              },
              {
                notchIndex: 2,
                label: '70',
                value: 70,
              },
              {
                notchIndex: 3,
                label: `${MAX_RESULTS_THRESHOLD}`,
                value: MAX_RESULTS_THRESHOLD,
              },
            ]}
            notchTicksVisible={false}
            showValue
            value={resultsThreshold}
            resetValue={DEFAULT_RESULTS_THRESHOLD}
            step={1}
            min={MIN_RESULTS_THRESHOLD}
            max={MAX_RESULTS_THRESHOLD}
            onChange={setResultsThreshold}
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
                label: Trans('SCAN_OPTION_FLOAT_UNROUNDED', 'Unrounded'),
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
            onSelect={setScanOption}
            buttonStyle={{
              fontSize: '12px',
              height: '30px',
              flexBasis: '30px',
            }}
          />
        </PanelSectionRow>

        <PanelSectionRow>
          <ButtonItem layout="below" disabled={!canReset} onClick={handleResetDefault}>
            {Trans('RESET_DEFAULT', 'Reset to Default')}
          </ButtonItem>
        </PanelSectionRow>

        <div
          style={{
            width: '100%',
            fontSize: '10px',
            color: '#FFFFFF5F',
            margin: '8px 0',
            textAlign: 'right',
          }}
        >
          Core: v{globalStateSnap.version}
        </div>
      </PanelSection>
    </Focusable>
  )
}

export default Settings
