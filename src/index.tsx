import { PanelSection, PanelSectionRow, quickAccessMenuClasses } from '@decky/ui'
import { definePlugin } from '@decky/api'
import React, { useEffect, useMemo } from 'react'
import { RiDiceFill } from 'react-icons/ri'
import DigitRoller from './components/DigitRoller'
import { InternalRouting } from './classes'
import { ActionSoundEffects, AUTO_ROLLER, IsValueValid, PlaySound } from '@/lib/utils'
import { candidateTypes, typesMask, typesToSearch } from '@/lib/candidates'
import { hasUsableResults } from '@/lib/multi'
import { SCAN_TIMEOUT_MS, withTimeout } from '@/lib/timeout'
import { pickScanAction } from '@/lib/shortcut'
import Logger from '@/lib/Logger'
import { AppLifetimeNotification } from '@decky/ui/src/globals/steam-client/GameSessions'
import { Unregisterable } from '@decky/ui/src/globals/steam-client/shared'
import { $globalState, globalState } from '@/stores/global'
import GameSession from '@/components/GameSession'
import MainActions from '@/components/MainActions'
import Backend from '@/lib/backend'
import Loading from '@/components/Loading'
import ScanResults from '@/components/ScanResults'
import { TypePicker } from '@/components/TypeChips'
import PanelContainer from '@/components/PanelContainer'
import SlotTabs from '@/components/SlotTabs'
import GameProcess from '@/components/GameProcess'
import Settings from '@/components/Settings'
import { useSnapshot } from 'valtio'
import { $settings, settings } from '@/stores/settings'
import Disclaimer from '@/components/Disclaimer'

// The list is refreshed every second
let refreshInFlight = false

function Content() {
  const globalStateSnap = useSnapshot(globalState)
  const settingsSnap = useSnapshot(settings)

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
    // 在NextScan阶段, 但结果数不是0: some type still has results to refine
    if (hasUsableResults(globalStateSnap.multiResults)) {
      return false
    }
    const num = Number(globalStateSnap.scanValue)
    // 首次扫描不能为0
    // the first scan cannot be 0
    if (isNaN(num) || num === 0) {
      return false
    }
    // at least one type must be searched
    return typesToSearch(candidateTypes(globalStateSnap.scanValue, false), [...globalStateSnap.manualTypes]).length > 0
  }, [
    globalStateSnap.game,
    globalStateSnap.scanValueError,
    globalStateSnap.scanValue,
    globalStateSnap.multiResults,
    globalStateSnap.manualTypes,
  ])

  const NextScannable = useMemo<boolean>(() => {
    if (globalStateSnap.scanValueError) {
      return false
    }
    return hasUsableResults(globalStateSnap.multiResults)
  }, [globalStateSnap.multiResults, globalStateSnap.scanValueError])

  const UndoScannable = useMemo<boolean>(() => {
    return !!globalStateSnap.multiResults && globalStateSnap.multiResults.CanUndo
  }, [globalStateSnap.multiResults])

  const Resettable = useMemo<boolean>(() => {
    // 有任意结果后可重置
    // resettable once there is any result
    return !!globalStateSnap.multiResults
  }, [globalStateSnap.multiResults])

  const handleCheckScanValue = () => {
    if (!globalState.scanValue) {
      PlaySound(ActionSoundEffects.DigitRollerOut)
      return
    }
    const invalid = !IsValueValid(globalState.scanValue, AUTO_ROLLER)
    globalState.scanValueError = invalid
    if (invalid) {
      PlaySound(ActionSoundEffects.DigitRollerError)
    } else {
      PlaySound(ActionSoundEffects.DigitRollerOut)
    }
  }

  // Runs a call to the backend while the spinner turns
  const runWithSpinner = async <T,>(name: string, call: () => Promise<T>): Promise<T | undefined> => {
    globalState.loading = true
    try {
      return await withTimeout(call(), SCAN_TIMEOUT_MS)
    } catch (error) {
      Logger.error(name, error)
      PlaySound(ActionSoundEffects.DigitRollerError)
      return undefined
    } finally {
      globalState.loading = false
    }
  }

  const handleFirstScan = async () => {
    if (!globalState.game) {
      return
    }
    // automatic: the backend picks every type that can hold the value
    const mask = globalState.manualTypes.length > 0 ? typesMask([...globalState.manualTypes]) : 0
    const appid = globalState.game.appid
    const results = await runWithSpinner('FirstScan', () =>
      Backend.FirstScanMulti(globalState.activeSlot, appid, globalState.scanValue, settings.ScanOption, settings.EmulatorMode, mask)
    )
    if (results === undefined) {
      return
    }
    $globalState.setMultiResults(results)
    PlaySound(ActionSoundEffects.FirstScan)
    Logger.debug(
      'FirstScan',
      `AppID:${globalState.game.appid}`,
      globalState.scanValue,
      `types mask:${mask}`,
      'Results:',
      results
    )
  }

  const handleNextScan = async () => {
    if (!globalState.game || !globalState.multiResults) {
      return
    }
    const results = await runWithSpinner('NextScan', () => Backend.NextScanMulti(globalState.activeSlot, globalState.scanValue))
    if (results === undefined) {
      return
    }
    $globalState.setMultiResults(results)
    PlaySound(ActionSoundEffects.NextScan)
    Logger.debug('NextScan', globalState.scanValue, 'Results:', results)
  }

  const handleUndoScan = async () => {
    const results = await runWithSpinner('UndoScan', () => Backend.UndoScanMulti(globalState.activeSlot))
    if (results === undefined) {
      return
    }
    if (results !== null) {
      $globalState.setMultiResults(results)
    }
    PlaySound(ActionSoundEffects.NextScan)
    Logger.debug('UndoScan', 'Results:', results)
  }

  const handleResetScan = async () => {
    $globalState.resetScan()
  }

  // R2: the scan that is available, wherever the focus is
  const scanAction = pickScanAction({
    loading: globalStateSnap.loading,
    firstScannable: FirstScannable,
    nextScannable: NextScannable,
  })
  // the legends show R2 only when it does something
  useEffect(() => {
    const available = globalStateSnap.route === InternalRouting.Main && !globalStateSnap.scanShortcutBlocked
    $globalState.setScanShortcut(available ? scanAction : null)
  }, [scanAction, globalStateSnap.route, globalStateSnap.scanShortcutBlocked])

  const handleScanShortcut = () => {
    // not from what changes values: a scan must not start by mistake there
    if (globalState.route !== InternalRouting.Main || globalState.scanShortcutBlocked) {
      return
    }
    const action = pickScanAction({
      loading: globalState.loading,
      firstScannable: FirstScannable,
      nextScannable: NextScannable,
    })
    if (action === 'first') {
      handleFirstScan()
    } else if (action === 'next') {
      handleNextScan()
    } else if (!globalState.loading) {
      PlaySound(ActionSoundEffects.DigitRollerError)
    }
  }

  // writes into the results of the type that is listed
  const handleChangeValues = async (value: string, ...indexes: number[]) => {
    if (globalState.selectedType === null) {
      return
    }
    const slot = globalState.activeSlot
    try {
      const results = await withTimeout(
        Backend.ChangeValuesMulti(slot, globalState.selectedType, value, indexes),
        SCAN_TIMEOUT_MS
      )
      // the user may have gone to another slot while the backend was working
      if (results !== null && slot === globalState.activeSlot) {
        $globalState.setMultiResults(results)
      }
      PlaySound(ActionSoundEffects.ChangeValues)
      Logger.debug('ChangeValues', 'Results:', results)
    } catch (error) {
      Logger.error('ChangeValues', error)
      PlaySound(ActionSoundEffects.DigitRollerError)
    }
  }

  // writes a gradient into the results of the type that is listed
  const handleChangeGradient = async (values: string[]) => {
    if (globalState.selectedType === null) {
      return
    }
    const slot = globalState.activeSlot
    const indexes = values.map((_, i) => i)
    try {
      const results = await withTimeout(
        Backend.ChangeValuesGradient(slot, globalState.selectedType, values, indexes),
        SCAN_TIMEOUT_MS
      )
      if (results !== null && slot === globalState.activeSlot) {
        $globalState.setMultiResults(results)
      }
      PlaySound(ActionSoundEffects.ChangeValues)
      Logger.debug('ChangeGradient', 'Results:', results)
    } catch (error) {
      Logger.error('ChangeGradient', error)
      PlaySound(ActionSoundEffects.DigitRollerError)
    }
  }

  const handleRefreshValues = async () => {
    if (globalState.loading || refreshInFlight) {
      return
    }
    refreshInFlight = true
    const slot = globalState.activeSlot
    try {
      const results = await withTimeout(Backend.RefreshValuesMulti(slot), SCAN_TIMEOUT_MS)
      if (results === null || slot !== globalState.activeSlot) {
        return
      }
      // only the values change: the page and the selected type stay
      globalState.multiResults = results
      const listed = results.Types.find(t => t.Type === globalState.selectedType)
      $globalState.updateResultsValues(listed?.List ?? [])
    } catch (error) {
      // called every second
      Logger.debug('RefreshValues', error)
    } finally {
      refreshInFlight = false
    }
  }

  // L1 / R1: the previous / next slot, wherever the focus is
  const handleSlotShortcut = (delta: number) => {
    if (globalState.route !== InternalRouting.Main) {
      return
    }
    if ($globalState.cycleSlot(delta)) {
      PlaySound(ActionSoundEffects.ScanTypeChanged)
    } else if (globalState.loading) {
      PlaySound(ActionSoundEffects.DigitRollerError)
    }
  }

  const renderMainPanel = () => {
    return (
      <>
        <PanelSectionRow>
          <SlotTabs />
        </PanelSectionRow>

        <PanelSectionRow>
          <DigitRoller
            value={globalStateSnap.scanValue}
            type={AUTO_ROLLER}
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
            leaveEditingOnRightTrigger
            isFullscreen={globalStateSnap.footerLegendVisible}
          />
        </PanelSectionRow>

        {!NextScannable && (
          <PanelSectionRow>
            <TypePicker
              value={globalStateSnap.scanValue}
              manualTypes={[...globalStateSnap.manualTypes]}
              disabled={globalStateSnap.loading}
            />
          </PanelSectionRow>
        )}

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

        <ScanResults
          onChangeValues={handleChangeValues}
          onChangeGradient={handleChangeGradient}
          onRefreshValues={handleRefreshValues}
        />
      </>
    )
  }

  if (!settingsSnap.HasAcceptedDisclaimer) {
    return <Disclaimer onAgree={$settings.acceptDisclaimer} />
  }

  if (globalStateSnap.route === InternalRouting.Settings) {
    return <Settings />
  }

  return (
    <PanelContainer
      onRightTrigger={handleScanShortcut}
      onBumper={globalStateSnap.route === InternalRouting.Main ? handleSlotShortcut : undefined}
    >
      <PanelSection>
        <PanelSectionRow>
          <GameSession game={globalStateSnap.game} disabled={globalStateSnap.loading} />
        </PanelSectionRow>

        {globalStateSnap.route === InternalRouting.Main && renderMainPanel()}
        {globalStateSnap.route === InternalRouting.ProcessDetails && (
          <GameProcess
            game={globalStateSnap.game}
            process={globalStateSnap.process}
            isFullscreen={!globalStateSnap.footerLegendVisible}
          />
        )}
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
      (_gameActionId: number, _appId: string, action: string, requestedAction: string) => {
        Logger.debug('GameActionUserRequest', action, requestedAction)
        // 在 AppLifetimeNotifications 中不设置
        // not set in AppLifetimeNotifications
        // 防止过早打开 GameProcess 选择了错误的进程
        // avoids GameProcess opening too early and picking the wrong process
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
