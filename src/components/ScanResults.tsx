import React, { JSX } from 'react'
import { DialogButton, PanelSectionRow } from '@decky/ui'
import Trans from '@/lib/i18n'
import DigitRoller from '@/components/DigitRoller'
import { ActionSoundEffects, IsValueValid, PlaySound } from '@/lib/utils'
import AddressList from '@/components/AddressList'
import { useSnapshot } from 'valtio'
import { $globalState, globalState } from '@/stores/global'

interface ScanResultsProps {
  onChangeValues: (value: string, ...indexes: number[]) => void
  onRefreshValues: () => void
}

const ScanResults = (props: ScanResultsProps): JSX.Element => {
  const globalStateSnap = useSnapshot(globalState)

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    transition: 'background-color .32s cubic-bezier(0.17, 0.45, 0.14, 0.83)',
    paddingBlock: 0,
  }

  const checkInput = () => {
    if (!globalState.changeValue) {
      PlaySound(ActionSoundEffects.DigitRollerOut)
      return
    }
    const invalid = !IsValueValid(globalState.changeValue, globalState.scanType)
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
    if (!globalState.results || globalState.results.List.length === 0) {
      return
    }
    if (globalState.changeValueError) {
      return
    }
    props.onChangeValues(globalState.changeValue)
  }

  const handleRefreshValues = async () => {
    if (!globalState.results || globalState.results.List.length === 0) {
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
            overflow: hidden;
            > .btn-change-all {
              height: 20px !important;
              padding: 0 8px !important;
              font-size: 12px !important;
              min-width: 0 !important;
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

      <div className="scan-results-header">
        {globalStateSnap.footerLegendVisible &&
          globalStateSnap.results.List.length > 0 &&
          renderPagination()}
        <div
          className={`scan-results-found ${globalStateSnap.results.List.length > 0 ? 'changeable' : globalStateSnap.results.Count === 0 ? 'zero' : ''}`}
        >
          {Trans('FOUND', 'Found')}
          <b>{globalStateSnap.results.Count}</b>
        </div>
        {globalStateSnap.results.List.length > 1 ? (
          <div className="scan-results-action">
            <DialogButton className="btn-change-all" onClick={handleChangeAllValues}>
              {Trans('ACTION_CHANGE_ALL_VALUES', 'Change all')}
            </DialogButton>
          </div>
        ) : (
          globalStateSnap.results.Time && (
            <div className="scan-results-details">
              time<span>{globalStateSnap.results.Time}</span>
            </div>
          )
        )}
      </div>

      {globalStateSnap.results.List.length > 0 && (
        <PanelSectionRow>
          <DigitRoller
            value={globalStateSnap.changeValue}
            type={globalStateSnap.scanType}
            onChange={onChangeValue}
            onEnter={() => {
              PlaySound(ActionSoundEffects.DigitRollerIn)
            }}
            onLeave={checkInput}
            isError={globalStateSnap.changeValueError}
            showType={true}
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
        previewView={globalStateSnap.changeValue}
        onRefresh={handleRefreshValues}
        isFullscreen={!globalStateSnap.footerLegendVisible}
      />
    </div>
  )
}

export default ScanResults
