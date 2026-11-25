import React, { JSX, useEffect } from 'react'
import { DialogButton, Focusable, GamepadButton, PanelSectionRow } from '@decky/ui'
import Trans from '@/lib/i18n'
import DigitRoller from '@/components/DigitRoller'
import { ActionSoundEffects, IsValueValid, PlaySound } from '@/lib/utils'
import AddressList from '@/components/AddressList'
import { TypeTabs } from '@/components/TypeChips'
import { ValueTypes } from '@/classes'
import { pickFreezeAllAction } from '@/lib/shortcut'
import { gradientValues } from '@/lib/gradient'
import { isParked, truncatedTypes } from '@/lib/multi'
import { useSnapshot } from 'valtio'
import { $globalState, globalState } from '@/stores/global'
import Backend from '@/lib/backend'

interface ScanResultsProps {
  onChangeValues: (value: string, ...indexes: number[]) => void
  onChangeGradient: (values: string[]) => void
  onRefreshValues: () => void
}

// Counts the changes of the locks made here
let freezeEpoch = 0

const ScanResults = (props: ScanResultsProps): JSX.Element => {
  const globalStateSnap = useSnapshot(globalState)
  // kept in the store, per slot: going to another slot shows them at once
  const frozenIndices = globalStateSnap.frozenIndices

  // explanations for the types that cannot be listed (too many results)
  const noticeStyle: React.CSSProperties = { fontSize: '11px', lineHeight: '14px', padding: '4px 0' }
  const truncated = globalStateSnap.multiResults ? truncatedTypes(globalStateSnap.multiResults) : []
  const parked = isParked(globalStateSnap.multiResults, globalStateSnap.selectedType)

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    transition: 'background-color .32s cubic-bezier(0.17, 0.45, 0.14, 0.83)',
    paddingBlock: 0,
  }

  // the frozen values are those of the type that is listed
  const syncFrozenIndices = () => {
    const slot = globalState.activeSlot
    const type = globalState.selectedType
    const epoch = freezeEpoch
    if (type === null) {
      $globalState.setFrozenIndices([])
      return
    }
    Backend.GetFrozenIndicesMulti(slot, type).then((res) => {
      // the user may have gone to another slot or type
      if (
        Array.isArray(res) &&
        epoch === freezeEpoch &&
        slot === globalState.activeSlot &&
        type === globalState.selectedType
      ) {
        $globalState.setFrozenIndices(res)
      }
    })
  }

  useEffect(() => {
    syncFrozenIndices()
  }, [globalStateSnap.results, globalStateSnap.selectedType, globalStateSnap.activeSlot])

  // the zone below can disappear with the focus in it (reset)
  useEffect(() => {
    return () => $globalState.setScanShortcutBlocked(false)
  }, [])

  // R2 is taken by the zone that changes values, and does nothing there
  // @ts-expect-error: supports returning false for bubbling despite void type definition
  const handleZoneButtonDown = (event: CustomEvent<{ button: number }>) => {
    if (event.detail.button !== GamepadButton.TRIGGER_RIGHT) {
      return false
    }
  }

  const checkInput = () => {
    if (!globalState.changeValue) {
      PlaySound(ActionSoundEffects.DigitRollerOut)
      return
    }
    if (globalState.selectedType === null) {
      return
    }
    const invalid = !IsValueValid(globalState.changeValue, globalState.selectedType)
    globalState.changeValueError = invalid
    if (invalid) {
      PlaySound(ActionSoundEffects.DigitRollerError)
    } else {
      PlaySound(ActionSoundEffects.DigitRollerOut)
    }
  }

  const onChangeValue = (value: string) => {
    globalState.changeValue = value
  }

  const handleChangeItemValue = async (index: number) => {
    if (globalState.changeValueError) {
      return
    }
    props.onChangeValues(globalState.changeValue, index)
  }

  const handleChangeAllValues = async () => {
    if (!globalState.results || globalState.results.List.length === 0 || globalState.selectedType === null) {
      return
    }
    // checked again here
    const invalid = !globalState.changeValue || !IsValueValid(globalState.changeValue, globalState.selectedType)
    globalState.changeValueError = invalid
    if (invalid) {
      PlaySound(ActionSoundEffects.DigitRollerError)
      return
    }
    props.onChangeValues(globalState.changeValue)
  }

  // L4 / the Gradient button
  const handleGradient = async () => {
    if (!globalState.results || globalState.results.List.length === 0 || globalState.selectedType === null) {
      return
    }
    const invalid = !globalState.changeValue || !IsValueValid(globalState.changeValue, globalState.selectedType)
    globalState.changeValueError = invalid
    const values = invalid
      ? null
      : gradientValues(globalState.changeValue, globalState.selectedType, globalState.results.List.length)
    if (values === null) {
      // not a value, or zero: the same value everywhere is not a gradient
      PlaySound(ActionSoundEffects.DigitRollerError)
      return
    }
    props.onChangeGradient(values)
  }

  const handleToggleFreezeAll = async () => {
    if (!globalState.results || globalState.results.List.length === 0 || globalState.selectedType === null) {
      return
    }
    const type = globalState.selectedType
    const slot = globalState.activeSlot

    // freeze them all; as soon as one is frozen, unfreeze them all
    const nextFreeze = pickFreezeAllAction(frozenIndices.length, globalState.results.List.length) === 'freeze'
    // the value of every result as it is now, read once
    const values = globalState.results.List.map(row => row[1] || globalState.changeValue)

    freezeEpoch++
    $globalState.setFrozenIndices(nextFreeze ? values.map((_, i) => i) : [])
    PlaySound(ActionSoundEffects.DigitRollerTyping)

    const locked = await Backend.FreezeAllMulti(slot, type, values, nextFreeze)
    freezeEpoch++
    if (Array.isArray(locked) && slot === globalState.activeSlot && type === globalState.selectedType) {
      $globalState.setFrozenIndices(locked)
    }
  }

  const handleToggleFreezeItem = async (index: number, currentValue: string) => {
    if (globalState.selectedType === null) {
      return
    }
    const willFreeze = !frozenIndices.includes(index)

    const previous = [...globalState.frozenIndices]
    freezeEpoch++
    $globalState.setFrozenIndices(willFreeze ? [...previous, index] : previous.filter((i) => i !== index))
    PlaySound(ActionSoundEffects.DigitRollerTyping)

    await Backend.ToggleFreezeMulti(globalState.activeSlot, globalState.selectedType, index, currentValue, willFreeze)
    freezeEpoch++
  }

  const handleRefreshValues = async () => {
    if (globalState.loading || !globalState.results || globalState.results.List.length === 0) {
      return
    }
    props.onRefreshValues()
  }

  if (!globalStateSnap.results) {
    return <></>
  }

  const renderPagination = () => {
    return (
      <div className="pagination">
        <div>
          {globalStateSnap.results_page}/{globalStateSnap.results_max_page}
        </div>
      </div>
    )
  }

  return (
    <div style={containerStyle}>
      {globalStateSnap.multiResults && (
        <PanelSectionRow>
          <TypeTabs
            multi={globalStateSnap.multiResults}
            selected={globalStateSnap.selectedType}
            disabled={globalStateSnap.loading}
          />
        </PanelSectionRow>
      )}
      <style>{`
        .scan-results-header {
          display: flex;
          overflow: hidden;
          flex-wrap: nowrap;
          font-size: 14px;
          line-height: 20px;
          height: 20px;
          color: #dcdedf;
          max-width: 100%;
          align-items: center;
          padding: 8px 0;
          position: relative;
          
          &:after {
            content: "";
            position: absolute;
            left: 0;
            right: 0;
            bottom: -0.5px;
            height: 1px;
            background: rgba(255, 255, 255, .1);
          }
          
          > .pagination {
            flex-shrink: 0;
            display: flex;
            align-items: center;
            padding-right: 8px;
            > div {
              height: 20px;
              width: 32px;
              display: flex;
              justify-content: center;
              align-items: center;
              border-radius: 2px;
              color: #23262e;
              background-color: white;
              font-size: 12px;
            }
          }
          
          > .scan-results-found {
            flex-shrink: 0;
            display: flex;
            align-items: center;
            gap: 4px;
            
            > b {
              font-weight: normal;
              color: #f0ad4e;
            }
            
            &.changeable > b {
              color: #6bcc62;
            }
            &.zero > b {
              color: #f27481;
            }
          }
          
          > .scan-results-action {
            flex-shrink: 0;
            margin-left: auto;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 4px;
            overflow: hidden;
            > .btn-change-all {
              height: 20px !important;
              padding: 0 6px !important;
              font-size: 11px !important;
              min-width: 0 !important;
            }
            > .btn-lock-value {
              height: 20px !important;
              padding: 0 6px !important;
              font-size: 11px !important;
              min-width: 0 !important;
              background-color: ${frozenIndices.length > 0 ? '#5dade2' : 'rgba(255, 255, 255, 0.2)'};
              color: ${frozenIndices.length > 0 ? '#23262e' : 'white'};
            }
          }
          
          > .scan-results-details {
            margin-left: auto;
            display: flex;
            align-items: center;
            justify-content: flex-end;
            overflow: hidden;
            gap: 4px;
            font-size: 10px;
            color: #969696;
            font-style: italic;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
        }
      `}</style>
      {truncated.length > 0 && (
        <div style={{ ...noticeStyle, color: '#f27481' }}>
          {truncated.join(', ')}: {Trans('NOTICE_TRUNCATED', 'more results than can be kept, dropped.')}
        </div>
      )}
      <Focusable
        noFocusRing
        onGamepadFocus={() => $globalState.setScanShortcutBlocked(true)}
        onGamepadBlur={() => $globalState.setScanShortcutBlocked(false)}
        onButtonDown={handleZoneButtonDown}
        style={{ display: 'flex', flexDirection: 'column' }}
      >
      <div className="scan-results-header">
        {globalStateSnap.footerLegendVisible &&
          globalStateSnap.results.List.length > 0 &&
          globalStateSnap.results_max_page > 1 &&
          renderPagination()}
        <div
          className={`scan-results-found ${
            globalStateSnap.results.List.length > 0
              ? 'changeable'
              : globalStateSnap.results.Count === 0
              ? 'zero'
              : ''
          }`}
        >
          {Trans('FOUND', 'Found')}
          <b>{globalStateSnap.results.Count}</b>
        </div>
        {globalStateSnap.results.List.length > 0 ? (
          // the two buttons are side by side
          <Focusable className="scan-results-action" flow-children="horizontal" noFocusRing>
            <DialogButton
              className="btn-lock-value"
              onClick={handleToggleFreezeAll}
              onOKActionDescription={
                frozenIndices.length > 0 ? Trans('ACTION_UNFREEZE', 'Unlock') : Trans('ACTION_FREEZE', 'Lock')
              }
            >
              {frozenIndices.length > 0 ? Trans('ACTION_UNFREEZE', 'Unlock') : Trans('ACTION_FREEZE', 'Lock')}
            </DialogButton>
            {globalStateSnap.results.List.length > 1 && (
              <DialogButton
                className="btn-change-all"
                onClick={handleChangeAllValues}
                onOKActionDescription={Trans('ACTION_CHANGE_ALL_VALUES', 'Change all')}
              >
                {Trans('ACTION_CHANGE_ALL_VALUES', 'Change all')}
              </DialogButton>
            )}
            {globalStateSnap.results.List.length > 1 && (
              <DialogButton
                className="btn-change-all"
                onClick={handleGradient}
                onOKActionDescription={Trans('ACTION_GRADIENT', 'Gradient')}
              >
                {Trans('ACTION_GRADIENT', 'Gradient')}
              </DialogButton>
            )}
          </Focusable>
        ) : (
          globalStateSnap.results.Time && (
            <div className="scan-results-details">
              time<span>{globalStateSnap.results.Time}</span>
            </div>
          )
        )}
      </div>
      {parked && (
        <div style={{ ...noticeStyle, color: '#d9a05b' }}>
          {Trans('NOTICE_PARKED', 'Too many results to list.')}{' '}
          {Trans('NOTICE_PARKED_HINT', 'Change the value in the game, then Next Scan, to narrow them down.')}
        </div>
      )}
      {globalStateSnap.results.List.length > 0 && (
        <PanelSectionRow>
          <DigitRoller
            value={globalStateSnap.changeValue}
            type={globalStateSnap.selectedType ?? ValueTypes.Int32}
            onChange={onChangeValue}
            onEnter={() => {
              PlaySound(ActionSoundEffects.DigitRollerIn)
            }}
            onLeave={checkInput}
            isError={globalStateSnap.changeValueError}
            showType={true}
            // shortcuts while the roller has the focus
            secondaryShortcut={{
              label:
                frozenIndices.length > 0
                  ? Trans('ACTION_UNFREEZE_ALL', 'Unlock all')
                  : Trans('ACTION_FREEZE_ALL', 'Lock all'),
              run: handleToggleFreezeAll,
            }}
            leftTriggerShortcut={{
              label: Trans('ACTION_SET_ALL', 'Set all'),
              run: handleChangeAllValues,
            }}
            rearLeftShortcut={{
              label: Trans('ACTION_GRADIENT', 'Gradient'),
              run: handleGradient,
            }}
            theme={{
              background: '#6bcc62',
              foreground: '#274a23',
            }}
            isFullscreen={globalStateSnap.footerLegendVisible}
          />
        </PanelSectionRow>
      )}
      <AddressList
        data={globalStateSnap.results.List}
        page={globalStateSnap.results_page}
        maxPage={globalStateSnap.results_max_page}
        setPage={$globalState.setResultsCurrentPage}
        onSelectItem={handleChangeItemValue}
        frozenIndices={[...frozenIndices]}
        onToggleFreezeItem={handleToggleFreezeItem}
        previewView={globalStateSnap.changeValue}
        onRefresh={handleRefreshValues}
        isFullscreen={!globalStateSnap.footerLegendVisible}
      />
      </Focusable>
    </div>
  )
}

export default ScanResults