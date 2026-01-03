import {
  PanelSection,
  PanelSectionRow,
  quickAccessMenuClasses,
} from '@decky/ui'
import { definePlugin } from '@decky/api'
import React, { useEffect, useMemo } from 'react'
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
} from '@/lib/utils'
import Logger from '@/lib/Logger'
import { AppLifetimeNotification } from '@decky/ui/src/globals/steam-client/GameSessions'
import { Unregisterable } from '@decky/ui/src/globals/steam-client/shared'
import { $globalState, globalState } from '@/stores/global'
import GameSession from '@/components/GameSession'
import MainActions from '@/components/MainActions'
import Backend from '@/lib/backend'
import Loading from '@/components/Loading'
import ScanResults from '@/components/ScanResults'
import SwitchButtons from '@/components/SwitchButtons'
import PanelContainer from '@/components/PanelContainer'
import GameProcess from '@/components/GameProcess'
import Settings from '@/components/Settings'
import { useSnapshot } from 'valtio'
import { $settings, settings } from '@/stores/settings'

function Content() {
  const globalStateSnap = useSnapshot(globalState)

  useEffect(() => {
    $globalState.setGame(window.SteamUIStore.MainRunningApp)
  }, [])

  const FirstScannable = useMemo<boolean>(() => {
    if (!globalStateSnap.game) {
      return false
    }
    if (globalStateSnap.scanValueError) {
      return false
    }
    // 在NextScan阶段, 但结果数不是0
    if (globalStateSnap.results && globalStateSnap.results.Count !== 0) {
      return false
    }
    const num = Number(globalStateSnap.scanValue)
    // 首次扫描不能为0
    return !(isNaN(num) || num === 0)
  }, [
    globalStateSnap.game,
    globalStateSnap.scanValueError,
    globalStateSnap.scanValue,
    globalStateSnap.results,
  ])

  const NextScannable = useMemo<boolean>(() => {
    if (globalStateSnap.scanValueError) {
      return false
    }
    return !!(globalStateSnap.results && globalStateSnap.results.Count > 0)
  }, [globalStateSnap.results, globalStateSnap.scanValueError])

  const UndoScannable = useMemo<boolean>(() => {
    return !!globalStateSnap.results && globalStateSnap.results.CanUndo
  }, [globalStateSnap.results])

  const Resettable = useMemo<boolean>(() => {
    // 有任意结果后可重置
    return !!globalStateSnap.results
  }, [globalStateSnap.results])

  const handleChangeScanType = (type: ValueTypes) => {
    $globalState.setScanType(type)
    PlaySound(ActionSoundEffects.ScanTypeChanged)
  }

  const handleCheckScanValue = () => {
    if (!globalState.scanValue) {
      PlaySound(ActionSoundEffects.DigitRollerOut)
      return
    }
    const invalid = !IsValueValid(globalState.scanValue, globalState.scanType)
    globalState.scanValueError = invalid
    if (invalid) {
      PlaySound(ActionSoundEffects.DigitRollerError)
    } else {
      PlaySound(ActionSoundEffects.DigitRollerOut)
    }
  }

  const handleFirstScan = async () => {
    if (!globalState.game) {
      return
    }
    globalState.loading = true
    const results = await Backend.FirstScan(
      globalState.game.appid,
      globalState.scanValue,
      globalState.scanType,
      settings.ScanOption
    )
    globalState.loading = false
    $globalState.setResults(results)
    PlaySound(ActionSoundEffects.FirstScan)
    Logger.debug(
      'FirstScan',
      `AppID:${globalState.game.appid}`,
      globalState.scanValue,
      ValueTypeMap.get(globalState.scanType),
      'Results:',
      results
    )
  }

  const handleNextScan = async () => {
    if (!globalState.game || !globalState.results) {
      return
    }
    globalState.loading = true
    const results = await Backend.NextScan(globalState.scanValue)
    globalState.loading = false
    $globalState.setResults(results)
    PlaySound(ActionSoundEffects.NextScan)
    Logger.debug('NextScan', globalState.scanValue, 'Results:', results)
  }

  const handleUndoScan = async () => {
    globalState.loading = true
    const results = await Backend.UndoScan()
    globalState.loading = false
    if (results !== null) {
      $globalState.setResults(results)
    }
    PlaySound(ActionSoundEffects.NextScan)
    Logger.debug('UndoScan', 'Results:', results)
  }

  const handleResetScan = async () => {
    $globalState.resetScan()
  }

  const handleChangeValues = async (value: string, ...indexes: number[]) => {
    const results = await Backend.ChangeValues(value, indexes)
    $globalState.setResults(results)
    PlaySound(ActionSoundEffects.ChangeValues)
    Logger.debug('ChangeValues', 'Results:', results)
  }

  const handleRefreshValues = async () => {
    if (globalState.loading) {
      return
    }
    const results = await Backend.RefreshValues()
    $globalState.updateResultsValues(results?.List ?? [])
  }

  const renderMainPanel = () => {
    return (
      <>
        {!NextScannable && (
          <PanelSectionRow>
            <SwitchButtons
              options={ValueTypeOptions}
              selected={globalStateSnap.scanType}
              onSelect={handleChangeScanType}
              disabled={globalStateSnap.loading}
              focusable
            />
          </PanelSectionRow>
        )}
        <PanelSectionRow>
          <DigitRoller
            value={globalStateSnap.scanValue}
            type={globalStateSnap.scanType}
            onChange={$globalState.setScanValue}
            onEnter={() => {
              globalState.scanValueError = false
              PlaySound(ActionSoundEffects.DigitRollerIn)
            }}
            onLeave={handleCheckScanValue}
            isError={globalStateSnap.scanValueError}
            disabled={globalStateSnap.loading}
            showType={NextScannable}
            autoFocus
          />
        </PanelSectionRow>

        <PanelSectionRow>
          <MainActions
            firstScannable={FirstScannable}
            nextScannable={NextScannable}
            undoScannable={UndoScannable}
            resettable={Resettable}
            disabled={globalStateSnap.loading}
            onFirstScan={handleFirstScan}
            onNextScan={handleNextScan}
            onUndoScan={handleUndoScan}
            onResetScan={handleResetScan}
          />
        </PanelSectionRow>

        <ScanResults onChangeValues={handleChangeValues} onRefreshValues={handleRefreshValues} />
      </>
    )
  }

  if (globalStateSnap.route === InternalRouting.Settings) {
    return <Settings />
  }

  return (
    <PanelContainer>
      <PanelSection>
        <PanelSectionRow>
          <GameSession game={globalStateSnap.game} disabled={globalStateSnap.loading} />
        </PanelSectionRow>

        {globalStateSnap.route === InternalRouting.Main && renderMainPanel()}
        {globalStateSnap.route === InternalRouting.ProcessDetails && <GameProcess
          game={globalStateSnap.game}
          process={globalStateSnap.process}
          isFullscreen={!globalStateSnap.footerLegendVisible}
        />}
      </PanelSection>
    </PanelContainer>
  )
}

function TitleContent() {
  const globalStateSnap = useSnapshot(globalState)

  useEffect(() => {
    Backend.Version().then(v => {
      globalState.version = v
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
      {globalStateSnap.loading ? <Loading /> : <RiDiceFill style={{ fontSize: '26px' }} />}
      <span>Reroll</span>
    </div>
  )
}

export default definePlugin(() => {
  Logger.debug('Loaded')

  $settings.init().then(() => {
    Logger.log('Settings', settings)
  })

  const registry: Unregisterable[] = []

  registry.push(
    window.SteamClient.GameSessions.RegisterForAppLifetimeNotifications(
      (notification: AppLifetimeNotification) => {
        Logger.debug('AppLifetimeNotification', notification)
        if (!notification.bRunning) {
          $globalState.setGame(undefined)
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
          $globalState.setGame(window.SteamUIStore.MainRunningApp)
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
