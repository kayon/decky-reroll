import React, { JSX, useState } from 'react'
import { DialogButton, Focusable } from '@decky/ui'
import { NavEntryPositionPreferences } from '@decky/ui/src/components/FooterLegend'

interface SwitchButtonOption<T> {
  label: React.ReactNode
  value: T
}

interface SwitchButtonProps<T> {
  options: SwitchButtonOption<T>[]
  selected: T
  onSelect: (value: T) => void
  disabled?: boolean
  buttonStyle?: React.CSSProperties
  focusable?: boolean
  vertical?: boolean
}

function SwitchButtons<T>(props: SwitchButtonProps<T>): JSX.Element {
  const [isHover, setIsHover] = useState(false)

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    padding: '8px 16px',
    margin: '0 -16px',
    transition: 'background-color .32s cubic-bezier(0.17, 0.45, 0.14, 0.83)',
    backgroundColor: props.focusable ? (isHover ? '#32373d' : 'transparent') : 'transparent',
    ...(props.disabled ? { opacity: 0.5 } : {}),
    ...(props.vertical ? { flexDirection: 'column', gap: '1px' } : {}),
  }

  return (
    <Focusable
      style={containerStyle}
      navEntryPreferPosition={
        props.vertical
          ? NavEntryPositionPreferences.MAINTAIN_Y
          : NavEntryPositionPreferences.MAINTAIN_X
      }
      onGamepadFocus={() => {
        setIsHover(true)
      }}
      onGamepadBlur={() => {
        setIsHover(false)
      }}
      className={`switch-buttons ${props.vertical ? 'vertical' : ''}`}
    >
      {props.options.map((option, index) => {
        const isSelected = props.selected === option.value
        const isFirst = index === 0
        const isLast = index === props.options.length - 1

        const verticalStyles: React.CSSProperties = {
          borderLeft: '2px solid transparent',
          ...(isSelected ? { borderLeftColor: 'white' } : { borderLeftColor: 'transparent' }),
          ...(isFirst && { borderRadius: '2px 2px 0 0' }),
          ...(isLast && { borderRadius: '0 0 2px 2px' }),
        }

        const horizontalStyles: React.CSSProperties = {
          borderBottom: '2px solid transparent',
          ...(isSelected ? { borderBottomColor: 'white' } : { borderBottomColor: 'transparent' }),
          ...(isFirst && { borderRadius: '2px 0 0 2px' }),
          ...(isLast && { borderRadius: '0 2px 2px 0' }),
        }

        return (
          <DialogButton
            key={`${option.label}-${option.value}`}
            disabled={isSelected || props.disabled}
            focusable={!isSelected && !props.disabled}
            onClick={() => props.onSelect(option.value)}
            style={{
              flex: '1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: 0,
              fontSize: '10px',
              borderRadius: 0,
              padding: 0,
              height: '30px',
              ...(props.vertical
                ? verticalStyles : horizontalStyles),
              ...props.buttonStyle,
            }}
          >
            {option.label}
          </DialogButton>
        )
      })}
    </Focusable>
  )
}

export default SwitchButtons
