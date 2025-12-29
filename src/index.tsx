import {
  PanelSection,
  PanelSectionRow,
  quickAccessMenuClasses,
} from '@decky/ui'
import { definePlugin } from '@decky/api'
import React, { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { RiDiceFill } from 'react-icons/ri'
import DigitRoller from './components/DigitRoller'
import {
  InternalRouting,
  ValueTypes,
} from './classes'
import {
  ActionSoundEffects,
  IsValueValid,
  PlaySound,
  ValueTypeMap,
  ValueTypeOptions,
} from './lib/utils'
import Logger from './lib/Logger'
import { AppLifetimeNotification } from '@decky/ui/src/globals/steam-client/GameSessions'
import { Unregisterable } from '@decky/ui/src/globals/steam-client/shared'
import { $settings, $store } from '@/store'
import GameSession from '@/components/GameSession'
import MainActions from '@/components/MainActions'
import Backend from '@/lib/backend'
import Loading from '@/components/Loading'
import ScanResults from '@/components/ScanResults'
import SwitchButtons from '@/components/SwitchButtons'
import PanelContainer from '@/components/PanelContainer'
import GameProcess from '@/components/GameProcess'
import Settings from '@/components/Settings'

function Content() {
  const state = useSyncExternalStore($store.subscribe, $store.state)

  useEffect(() => {
    $store.setGame(window.SteamUIStore.MainRunningApp)
  }, [])

  const FirstScannable = useMemo<boolean>(() => {
    if (!state.game) {
      return false
    }
    if (state.scanValueError) {
      return false
    }
    // 在NextScan阶段, 但结果数不是0
    if (state.results && state.results.Count !== 0) {
      return false
    }
    const num = Number(state.scanValue)
    // 首次扫描不能为0
    return !(isNaN(num) || num === 0)
  }, [state.game, state.scanValueError, state.scanValue, state.results])

  const NextScannable = useMemo<boolean>(() => {
    if (state.scanValueError) {
      return false
    }
    return !!(state.results && state.results.Count > 0)
  }, [state.results, state.scanValueError])

  const Resettable = useMemo<boolean>(() => {
    // 有任意结果后可重置
    return !!state.results
  }, [state.results])

  const handleChangeScanType = (type: ValueTypes) => {
    $store.setState({
      scanType: type,
      scanValue: '',
      scanValueError: false,
    })
    PlaySound(ActionSoundEffects.ScanTypeChanged)
  }

  const handleChangeScanValue = (value: string) => {
    $store.setState({
      scanValue: value,
    })
  }

  const handleCheckScanValue = () => {
    if (!state.scanValue) {
      PlaySound(ActionSoundEffects.DigitRollerOut)
      return
    }
    const invalid = !IsValueValid(state.scanValue, state.scanType)
    $store.setState({
      scanValueError: invalid,
    })
    if (invalid) {
      PlaySound(ActionSoundEffects.DigitRollerError)
    } else {
      PlaySound(ActionSoundEffects.DigitRollerOut)
    }
  }

  const handleFirstScan = async () => {
    if (!state.game) {
      return
    }
    $store.setState({ loading: true })
    const results = await Backend.FirstScan(
      state.game.appid,
      state.scanValue,
      state.scanType,
      $settings.ScanOption
    )
    $store.setState({
      loading: false,
      results: results,
    })
    PlaySound(ActionSoundEffects.FirstScan)
    Logger.debug(
      'FirstScan',
      `AppID:${state.game.appid}`,
      state.scanValue,
      ValueTypeMap.get(state.scanType),
      'Results:',
      results
    )
  }

  const handleNextScan = async () => {
    if (!state.game || !state.results) {
      return
    }
    $store.setState({ loading: true })
    const results = await Backend.NextScan(state.scanValue)
    $store.setState({
      loading: false,
      results: results,
    })
    PlaySound(ActionSoundEffects.NextScan)
    Logger.debug('NextScan', state.scanValue, 'Results:', results)
  }

  const handleResetScan = async () => {
    $store.setState({
      scanValue: '',
      scanValueError: false,
      results: null,
    })
    await Backend.ResetScan()
  }

  const handleChangeValues = async (value: string, ...indexes: number[]) => {
    const results = await Backend.ChangeValues(value, indexes)
    $store.setState({
      results: results,
    })
    PlaySound(ActionSoundEffects.ChangeValues)
    Logger.debug('ChangeValues', 'Results:', results)
  }

  const handleRefreshValues = async () => {
    if (state.loading) {
      return
    }
    const results = await Backend.RefreshValues()
    $store.updateResultsValues(results?.List ?? [])
  }

  const renderMainPanel = () => {
    return (
      <>
        {!NextScannable && (
          <PanelSectionRow>
            <SwitchButtons
              options={ValueTypeOptions}
              selected={state.scanType}
              onSelect={handleChangeScanType}
              disabled={state.loading}
              focusable
            />
          </PanelSectionRow>
        )}
        <PanelSectionRow>
          <DigitRoller
            value={state.scanValue}
            type={state.scanType}
            onChange={handleChangeScanValue}
            onEnter={() => {
              $store.setState({ scanValueError: false })
              PlaySound(ActionSoundEffects.DigitRollerIn)
            }}
            onLeave={handleCheckScanValue}
            isError={state.scanValueError}
            disabled={state.loading}
            showType={NextScannable}
          />
        </PanelSectionRow>

        <PanelSectionRow>
          <MainActions
            firstScannable={FirstScannable}
            nextScannable={NextScannable}
            resettable={Resettable}
            disabled={state.loading}
            onFirstScan={handleFirstScan}
            onNextScan={handleNextScan}
            onResetScan={handleResetScan}
          />
        </PanelSectionRow>

        <ScanResults
          data={state.results}
          scanType={state.scanType}
          onChangeValues={handleChangeValues}
          onRefreshValues={handleRefreshValues}
        />
      </>
    )
  }

  if (state.route === InternalRouting.Settings) {
    return <Settings />
  }

  return (
    <PanelContainer>
      <PanelSection>
        <PanelSectionRow>
          <GameSession game={state.game} disabled={state.loading} />
        </PanelSectionRow>

        {state.route === InternalRouting.Main && renderMainPanel()}
        {state.route === InternalRouting.ProcessDetails && <GameProcess />}
      </PanelSection>
    </PanelContainer>
  )
}

function TitleContent() {
  const state = useSyncExternalStore($store.subscribe, $store.state)
  const [version, setVersion] = useState<string>('')

  useEffect(() => {
    Backend.Version().then(v => {
      setVersion(v)
      Logger.log('Core', `v${v}`)
    })
  }, [])

  const pluginTitleStyles: React.CSSProperties = {
    display: 'flex',
    flex: 1,
    alignItems: 'center',
    gap: 4,
  }

  return (
    <div style={pluginTitleStyles}>
      <style>{`
      .${quickAccessMenuClasses.TabGroupPanel} > .Panel.Focusable > div:last-child > div {
        padding-bottom: 0 !important;
      }
      `}</style>
      {state.loading ? <Loading /> : <RiDiceFill style={{ fontSize: '26px' }} />}
      <span>Reroll</span>
      <span
        style={{
          marginLeft: 'auto',
          fontSize: '12px',
          color: '#FFFFFF3F',
          fontWeight: 'normal',
        }}
      >
        Core: v{version}
      </span>
    </div>
  )
}

export default definePlugin(() => {
  Logger.debug('Loaded')

  $settings.init().then(() => {
    Logger.log('Settings', $settings.state())
    Backend.SetRenderResultsThreshold($settings.ResultsThreshold)
  })

  const registry: Unregisterable[] = []

  registry.push(
    window.SteamClient.GameSessions.RegisterForAppLifetimeNotifications(
      (notification: AppLifetimeNotification) => {
        Logger.debug('AppLifetimeNotification', notification)
        if (!notification.bRunning) {
          $store.setGame(undefined)
        }
      }
    )
  )

  registry.push(
    window.SteamClient.Apps.RegisterForGameActionUserRequest(
      (
        _gameActionId: number,
        _appId: string,
        action: string,
        requestedAction: string
      ) => {
        Logger.debug('GameActionUserRequest', action, requestedAction)
        // 在 AppLifetimeNotifications 中不设置
        // 防止过早打开 GameProcess 选择了错误的进程
        if (requestedAction === 'CreatingProcess') {
          $store.setGame(window.SteamUIStore.MainRunningApp)
        }
      }
    )
  )

  return {
    name: 'Reroll',
    titleView: <TitleContent />,
    content: <Content />,
    icon: <RiDiceFill style={{ fontSize: '20px' }} />,
    onDismount() {
      Logger.debug('Dismount')
      for (const reg of registry) {
        reg.unregister()
      }
    },
  }
})
