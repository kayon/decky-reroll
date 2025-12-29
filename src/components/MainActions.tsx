import React, { JSX, useState } from 'react'
import { DialogButton, Focusable } from '@decky/ui'
import Trans from '@/lib/i18n'
import { FaCog } from 'react-icons/fa'
import { InternalRouting } from '@/classes'
import { $store } from '@/store'

interface MainActionsProps {
  firstScannable: boolean
  nextScannable: boolean
  resettable: boolean
  disabled: boolean

  onFirstScan: () => void
  onNextScan: () => void
  onResetScan: () => void
}

const MainActions = (props: MainActionsProps): JSX.Element => {
  const [isHover, setIsHover] = useState(false)

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    transition: 'background-color .32s cubic-bezier(0.17, 0.45, 0.14, 0.83)',
    padding: 0,
    ...(props.disabled ? { opacity: 0.5 } : {}),
  }

  const wrapperStyles: React.CSSProperties = {
    ...(isHover
      ? { backgroundColor: 'rgba(255, 255, 255, 0.15)' }
      : { backgroundColor: 'rgba(255, 255, 255, 0)' }),
  }

  const handleOpenSetting = () => {
    $store.navigation(InternalRouting.Settings)
  }

  return (
    <Focusable
      style={containerStyle}
      onGamepadFocus={() => {
        setIsHover(true)
      }}
      onGamepadBlur={() => {
        setIsHover(false)
      }}
    >
      <style>{`
        .main-actions-container {
          width: 100%;
          display: flex;
          padding: 4px 16px;
          margin: 0 -16px;
          transition: background-color .32s cubic-bezier(0.17, 0.45, 0.14, 0.83);
          gap: 2px;
          position: relative;
          
          &:after {
            content: "";
            position: absolute;
            left: 16px;
            right: 16px;
            bottom: -0.5px;
            height: 1px;
            background: rgba(255, 255, 255, .1);
          }
        }
      `}</style>
      <div className="main-actions-container" style={wrapperStyles}>
        <style>{`
          .btn-action {
            flex: 1;
            min-width: 0 !important;
            height: 28px !important;
            padding: 0 !important;
            padding-inline: 0 !important;
            font-size: 12px !important;
            overflow: hidden !important;
            display: flex;
            align-items: center;
            &.setting {
              flex: none;
              width: 28px;
              font-size: 18px;
            }
          }
        `}</style>
        <DialogButton
          key={1}
          className="btn-action"
          onClick={props.onFirstScan}
          disabled={props.disabled || !props.firstScannable}
          focusable={!props.disabled && props.firstScannable}
        >
          {Trans('FIRST_SCAN', 'First Scan')}
        </DialogButton>

        <DialogButton
          key={2}
          className="btn-action"
          onClick={props.onNextScan}
          disabled={props.disabled || !props.nextScannable}
          focusable={!props.disabled && props.nextScannable}
        >
          {Trans('NEXT_SCAN', 'Next Scan')}
        </DialogButton>

        <DialogButton
          key={3}
          className="btn-action"
          onClick={props.onResetScan}
          disabled={props.disabled || !props.resettable}
          focusable={!props.disabled && props.resettable}
        >
          {Trans('RESET_SCAN', 'Reset')}
        </DialogButton>

        {!props.resettable && (
          <DialogButton key={4} className="btn-action setting" onClick={handleOpenSetting}>
            <FaCog />
          </DialogButton>
        )}
      </div>
    </Focusable>
  )
}

export default MainActions
