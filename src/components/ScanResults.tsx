import { Results, ValueTypes } from '@/classes'
import React, { JSX, useSyncExternalStore } from 'react'
import { DialogButton, PanelSectionRow } from '@decky/ui'
import Trans from '@/lib/i18n'
import DigitRoller from '@/components/DigitRoller'
import { ActionSoundEffects, IsValueValid, PlaySound } from '@/lib/utils'
import AddressList from '@/components/AddressList'
import { $store } from '@/store'

interface ScanResultsProps {
  data: Results | null
  scanType: ValueTypes
  onChangeValues: (value: string, ...indexes: number[]) => void
  onRefreshValues: () => void
}

const ScanResults = (props: ScanResultsProps): JSX.Element => {
  const state = useSyncExternalStore($store.subscribe, $store.state)

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    transition: 'background-color .32s cubic-bezier(0.17, 0.45, 0.14, 0.83)',
    paddingBlock: 0,
  }

  const checkInput = () => {
    if (!state.changeValue) {
      PlaySound(ActionSoundEffects.DigitRollerOut)
      return
    }
    const invalid = !IsValueValid(state.changeValue, props.scanType)
    $store.setState({
      changeValueError: invalid,
    })
    if (invalid) {
      PlaySound(ActionSoundEffects.DigitRollerError)
    } else {
      PlaySound(ActionSoundEffects.DigitRollerOut)
    }
  }

  const onChangeValue = (value: string) => {
    $store.setState({
      changeValue: value,
    })
  }

  const handleChangeItemValue = async (index: number) => {
    if (state.changeValueError) {
      return
    }
    props.onChangeValues(state.changeValue, index)
  }

  const handleChangeAllValues = async () => {
    if (!props.data || props.data.List.length === 0) {
      return
    }
    if (state.changeValueError) {
      return
    }
    props.onChangeValues(state.changeValue)
  }

  const handleRefreshValues = async () => {
    if (!props.data || props.data.List.length === 0) {
      return
    }
    props.onRefreshValues()
  }

  if (!props.data) {
    return <></>
  }

  const renderPagination = () => {
    return (
      <div className="pagination">
        <div>
          {state.results_page}/{state.results_max_page}
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
        {state.footerLegendVisible && props.data.List.length > 0 && renderPagination()}
        <div
          className={`scan-results-found ${props.data.List.length > 0 ? 'changeable' : props.data.Count === 0 ? 'zero' : ''}`}
        >
          {Trans('FOUND', 'Found')}
          <b>{props.data.Count}</b>
        </div>
        {props.data.List.length > 1 ? (
          <div className="scan-results-action">
            <DialogButton className="btn-change-all" onClick={handleChangeAllValues}>
              {Trans('ACTION_CHANGE_ALL_VALUES', 'Change all')}
            </DialogButton>
          </div>
        ) : (
          props.data.Time && (
            <div className="scan-results-details">
              time<span>{props.data.Time}</span>
            </div>
          )
        )}
      </div>

      {props.data.List.length > 0 && (
        <PanelSectionRow>
          <DigitRoller
            value={state.changeValue}
            type={props.scanType}
            onChange={onChangeValue}
            onEnter={() => {
              PlaySound(ActionSoundEffects.DigitRollerIn)
            }}
            onLeave={checkInput}
            isError={state.changeValueError}
            showType={true}
            theme={{
              background: '#6bcc62',
              foreground: '#274a23',
            }}
          />
        </PanelSectionRow>
      )}

      <AddressList
        data={props.data.List}
        onSelectItem={handleChangeItemValue}
        previewView={state.changeValue}
        onRefresh={handleRefreshValues}
      />
    </div>
  )
}

export default ScanResults
