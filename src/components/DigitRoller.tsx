import React, { JSX, useState, useEffect, useRef, useMemo } from 'react'
import { ValueTypes } from '@/classes'
import { Focusable } from '@decky/ui'
import { FaCaretUp, FaCaretDown } from 'react-icons/fa'
import { GamepadButton } from '@decky/ui/dist/components/FooterLegend'
import Trans from '@/lib/i18n'
import { GamepadEventDetail } from '@decky/ui/src/components/FooterLegend'
import {
  ActionSoundEffects,
  AUTO_ROLLER,
  DigitRollerMetadata,
  PlaySound,
  RollerType,
  SIGN_CHARSET,
  ValueTypeMap,
} from '@/lib/utils'
import SharedDpad from '@/components/SharedDpad'
import SharedButtons from '@/components/SharedButtons'

// An action the roller offers while it has the focus
export interface RollerShortcut {
  label: string
  run: () => void
}

interface DigitRollerProps {
  value: string
  // a type of value
  type: RollerType
  onChange: (value: string) => void
  onEnter?: () => void
  onLeave?: () => void
  disabled?: boolean
  isError?: boolean
  showType?: boolean
  theme?: DigitRollerTheme
  autoFocus?: boolean
  mute?: boolean
  isFullscreen?: boolean
  // X, focused or editing
  secondaryShortcut?: RollerShortcut
  // L2, focused or editing
  leftTriggerShortcut?: RollerShortcut
  // L4 (the upper back button on the left), focused or editing
  rearLeftShortcut?: RollerShortcut
  // R2 starts a scan from this roller (the panel handles it)
  leaveEditingOnRightTrigger?: boolean
}

export interface DigitRollerTheme {
  background: string
  foreground: string
}

const defaultTheme: DigitRollerTheme = {
  background: '#FFFFFF',
  foreground: '#23262e',
}

const DigitRoller = (props: DigitRollerProps): JSX.Element => {
  const theme = props.theme ?? defaultTheme
  const [isEditing, setIsEditing] = useState(false)
  const prevIsEditing = useRef(isEditing)
  const meta = DigitRollerMetadata(props.type, props.value)
  const [digits, setDigits] = useState<string[]>(meta.initialDigits)
  const [cursor, setCursor] = useState(meta.length - 1)
  const [isHover, setIsHover] = useState(false)
  const lastCancelTime = useRef(0)

  const editingActions = {
    // FooterLegend 溢出了, 这里隐藏一些吧
    // FooterLegend overflows, hide a few here
    // [GamepadButton.DIR_UP]: Trans('ACTION_INCREASE', 'Increase'),
    // [GamepadButton.DIR_DOWN]: Trans('ACTION_DECREASE', 'Decrease'),
    // [GamepadButton.DIR_LEFT]: Trans('ACTION_MOVE', 'Move'),
    // [GamepadButton.DIR_RIGHT]: Trans('ACTION_MOVE', 'Move'),
    // SECONDARY = X
    [GamepadButton.SECONDARY]: props.secondaryShortcut?.label ?? Trans('ACTION_RESET', 'Reset'),
    // OPTIONS = Y
    [GamepadButton.OPTIONS]: Trans('ACTION_DIGIT_MAX', 'Max'),
    // OPTIONS = A
    [GamepadButton.OK]: Trans('ACTION_DIGIT_MIN', 'Min'),
    // CANCEL = B
    [GamepadButton.CANCEL]: Trans('ACTION_BACK', 'Back'),
    ...(props.leftTriggerShortcut ? { [GamepadButton.TRIGGER_LEFT]: props.leftTriggerShortcut.label } : {}),
  }
  const nonEditingActions = {
    [GamepadButton.OK]: Trans('ACTION_EDIT', 'Edit'),
    [GamepadButton.CANCEL]: Trans('ACTION_BACK', 'Back'),
    ...(props.secondaryShortcut ? { [GamepadButton.SECONDARY]: props.secondaryShortcut.label } : {}),
    ...(props.leftTriggerShortcut ? { [GamepadButton.TRIGGER_LEFT]: props.leftTriggerShortcut.label } : {}),
  }

  // a signed roller starts with a sign slot, which is not a digit
  const signSlots = meta.signed ? 1 : 0
  const charsetAt = (index: number) => (index < signSlots ? SIGN_CHARSET : meta.charset)

  const leadingZeroCount = useMemo(() => {
    const idx = digits.findIndex((d, i) => i >= signSlots && d !== '0')
    return idx === -1 ? digits.length - 1 : idx
  }, [digits, signSlots])

  useEffect(() => {
    setDigits(DigitRollerMetadata(props.type, props.value).initialDigits)
  }, [props.value, props.type])

  useEffect(() => {
    setCursor(meta.length - 1)
  }, [meta.length])

  useEffect(() => {
    // 当使用触摸点击改变了焦点, 退出编辑
    // leave editing when a touch click changes the focus
    if (!isHover && isEditing) {
      setIsEditing(false)
    }
  }, [isHover, isEditing])

  useEffect(() => {
    if (!prevIsEditing.current && isEditing) {
      props.onEnter?.()
    }
    if (prevIsEditing.current && !isEditing) {
      props.onLeave?.()
    }
    prevIsEditing.current = isEditing
  }, [isEditing, props, props.onEnter, props.onLeave])

  // @ts-expect-error: supports returning false for bubbling despite void type definition
  const handleDirection = (event: CustomEvent<GamepadEventDetail>) => {
    if (!isEditing) {
      return false
    }
    if (!props.mute) {
      PlaySound(ActionSoundEffects.DigitRollerTyping)
    }

    const button = event.detail.button
    const maxLen = digits.length
    const charset = charsetAt(cursor)
    if (button === GamepadButton.DIR_RIGHT) {
      setCursor(p => (p + 1) % maxLen)
    } else if (button === GamepadButton.DIR_LEFT) {
      setCursor(p => (p - 1 + maxLen) % maxLen)
    } else if (button === GamepadButton.DIR_UP || button === GamepadButton.DIR_DOWN) {
      const dir = button === GamepadButton.DIR_UP ? 1 : -1
      const curCharIdx = charset.indexOf(digits[cursor])
      const nextIdx = (curCharIdx + dir + charset.length) % charset.length

      const newDigits = [...digits]
      newDigits[cursor] = charset[nextIdx]
      setDigits(newDigits)
      props.onChange(newDigits.join(''))
    }
  }

  // X: the shortcut of the roller if it has one, else Reset
  // @ts-expect-error: supports returning false for bubbling despite void type definition
  const handleSecondaryButton = () => {
    if (props.secondaryShortcut) {
      props.secondaryShortcut.run()
      return
    }
    if (!isEditing) {
      return false
    }
    props.onChange('')
    setCursor(meta.length - 1)
  }
  // L2 and L4: the shortcuts of the roller
  // @ts-expect-error: supports returning false for bubbling despite void type definition
  const handleButtonDown = (event: CustomEvent<GamepadEventDetail>) => {
    if (event.detail.button === GamepadButton.TRIGGER_RIGHT && props.leaveEditingOnRightTrigger) {
      if (isEditing && !event.detail.is_repeat) {
        setIsEditing(false)
      }
      return false
    }
    const shortcut =
      event.detail.button === GamepadButton.TRIGGER_LEFT
        ? props.leftTriggerShortcut
        : event.detail.button === GamepadButton.REAR_LEFT_UPPER
        ? props.rearLeftShortcut
        : undefined
    if (!shortcut) {
      return false
    }
    if (!event.detail.is_repeat) {
      shortcut.run()
    }
  }
  // Y: Max
  // @ts-expect-error: supports returning false for bubbling despite void type definition
  const handleOptionsButton = () => {
    if (!isEditing) {
      return false
    }
    // 将当前光标位置设为 9 (the sign slot: '-')
    // set the digit at the cursor to 9
    const max = cursor < signSlots ? '-' : '9'
    if (digits[cursor] !== max) {
      const newDigits = [...digits]
      newDigits[cursor] = max
      props.onChange(newDigits.join(''))
    }
  }

  // A: Min
  // @ts-expect-error: supports returning false for bubbling despite void type definition
  const handleOkButton = (event: CustomEvent<GamepadEventDetail>) => {
    if (!isEditing) {
      // 未使用onOKButton时, A 本身就是默认 Focus 触发 onActivate
      // without onOKButton, A's default focus triggers onActivate
      // 但使用了onOKButton后, 即使返回 false 也不再冒泡
      // but with onOKButton, returning false no longer bubbles
      // 导致无法获取焦点, 这里使用click强制focus
      // so focus cannot be gained; force it with click here
      // 或许有更优雅的办法, 但这至少起作用了
      // maybe there is a cleaner way, but this works
      ;(event.currentTarget as HTMLElement).click()
      return false
    }
    // 将当前光标位置设为 0 (the sign slot: '+')
    // set the digit at the cursor to 0
    const min = cursor < signSlots ? '+' : '0'
    if (digits[cursor] !== min) {
      const newDigits = [...digits]
      newDigits[cursor] = min
      props.onChange(newDigits.join(''))
    }
  }

  const wrapperStyles: React.CSSProperties = {
    display: 'flex',
    paddingInline: '16px',
    paddingBlock: props.isFullscreen ? '4px' : '8px',
    margin: '0 -16px',
    transition: 'background-color .32s cubic-bezier(0.17, 0.45, 0.14, 0.83)',
    backgroundColor: isHover ? '#32373d' : 'transparent',
    gap: 2,
  }

  const focusableStyles: React.CSSProperties = {
    ...(isEditing
      ? { backgroundColor: theme.background, color: theme.foreground }
      : props.isError
        ? { backgroundColor: 'rgba(242, 116, 129, 0.15)', color: '#f27481' }
        : {
            backgroundColor: `color-mix(in srgb, ${theme.background} 15%, transparent)`,
            color: `color-mix(in srgb, ${theme.background} 90%, transparent)`,
          }),
  }

  const valueTypeStyles: React.CSSProperties = {
    flex: '0 0 auto',
    width: '18px',
    writingMode: 'vertical-rl',
    textOrientation: 'sideways',
    textTransform: 'uppercase',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    whiteSpace: 'nowrap',
    fontSize: '8px',
    letterSpacing: '0',
    overflow: 'hidden',
    borderRadius: '2px',
    ...(props.disabled ? { opacity: 0.5 } : {}),
    ...(props.disabled ? { opacity: 0.5 } : {}),
    ...focusableStyles,
  }

  const containerStyles: React.CSSProperties = {
    flex: '1',
    display: 'flex',
    height: '40px',
    width: '100%',
    gap:
      props.type === ValueTypes.Int64 || props.type === ValueTypes.Float64 || props.type === AUTO_ROLLER
        ? 0
        : '2px',
    alignItems: 'center',
    borderRadius: '2px',
    alignContent: 'center',
    justifyContent: 'center',
    flexWrap: 'nowrap',
    overflow: 'hidden',
    ...(props.disabled ? { opacity: 0.5 } : {}),
    ...focusableStyles,
  }

  const renderGuide = () => {
    return (
      <>
        <style>{`
        .digit-roller-guide {
          display: flex;
          gap: 16px;
          align-items: center;
          justify-content: center;
          position: absolute;
          height: 36px;
          width: 100%;
          top: -40px;
          left: -16px;
          padding: 4px 16px 0 16px;
          background-color: #32373d;
          color: white;
          z-index: 5;
          overflow: hidden;
        }
      `}</style>
        <div className="digit-roller-guide">
          <SharedDpad left={true} right={true}>
            <div>{Trans('ACTION_MOVE', 'Move')}</div>
          </SharedDpad>
          <SharedDpad up={true} down={true}>
            <div>{Trans('ACTION_INCREASE', 'Increase')}</div>
            <div>{Trans('ACTION_DECREASE', 'Decrease')}</div>
          </SharedDpad>
          <SharedButtons y={true} a={true}>
            <div>{Trans('ACTION_DIGIT_MAX', 'Max')}</div>
            <div>{Trans('ACTION_DIGIT_MIN', 'Min')}</div>
          </SharedButtons>
          <SharedButtons x={true}>
            <div>{props.secondaryShortcut?.label ?? Trans('ACTION_RESET', 'Reset')}</div>
          </SharedButtons>
        </div>
      </>
    )
  }

  return (
    <Focusable
      autoFocus={props.autoFocus}
      onGamepadDirection={handleDirection}
      onSecondaryButton={handleSecondaryButton}
      onButtonDown={handleButtonDown}
      onOptionsButton={handleOptionsButton}
      onOKButton={handleOkButton}
      onGamepadFocus={() => {
        setIsHover(true)
      }}
      onGamepadBlur={() => {
        setIsHover(false)
      }}
      // @ts-expect-error: supports returning false for bubbling despite void type definition
      onActivate={() => {
        if (props.disabled) {
          return false
        }
        setIsEditing(true)
      }}
      // @ts-expect-error: supports returning false for bubbling despite void type definition
      onCancel={() => {
        const now = Date.now()
        if (!isEditing) {
          // 防止输入B连发直接退到了插件列表页
          // stop a repeated B press from leaving straight to the plugin list
          if (lastCancelTime.current > 0 && now - lastCancelTime.current < 500) {
            // prevent
            return
          }
          // fallthrough
          return false
        }
        // 记录退出编辑模式的时间, 在一定间隔内阻止下一次Cancel
        // record when editing was left; block the next Cancel for a short while
        lastCancelTime.current = now
        setIsEditing(false)
      }}
      actionDescriptionMap={isEditing ? editingActions : nonEditingActions}
      style={{
        padding: '0',
        position: 'relative',
      }}
    >
      {isEditing && renderGuide()}
      <div style={wrapperStyles}>
        {props.showType && (
          <div style={valueTypeStyles}>{props.type === AUTO_ROLLER ? 'auto' : ValueTypeMap.get(props.type)}</div>
        )}

        <div style={containerStyles}>
          {digits.map((d, i) => {
            const isActive = isEditing && i === cursor
            // a '+' is the default: shown faintly, like the leading zeros
            const opacity = i < signSlots ? (d === '-' ? 1.0 : 0.3) : i < leadingZeroCount ? 0.3 : 1.0
            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  width: '12px',
                }}
              >
                <FaCaretUp
                  style={{
                    fontSize: '10px',
                    visibility: isActive ? 'visible' : 'hidden',
                    marginBottom: '-4px',
                  }}
                />
                <div
                  style={{
                    fontSize: '16px',
                    // fontFamily: 'monospace',
                    opacity,
                  }}
                >
                  {d}
                </div>
                <FaCaretDown
                  style={{
                    fontSize: '10px',
                    visibility: isActive ? 'visible' : 'hidden',
                    marginTop: '-4px',
                  }}
                />
              </div>
            )
          })}
        </div>
      </div>
    </Focusable>
  )
}

export default DigitRoller
