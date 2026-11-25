import React, { JSX, useEffect, useRef } from 'react'
import { Focusable, GamepadButton } from '@decky/ui'
import { useSnapshot } from 'valtio'
import Trans from '@/lib/i18n'
import { $globalState, globalState } from '@/stores/global'
import { keepLegendOnOneLine } from '@/lib/legend'

interface PanelContainerProps {
  children: React.ReactNode
  hidden?: boolean
  // R2, wherever the focus is in the panel
  onRightTrigger?: () => void
  // L1 (-1) and R1 (+1), wherever the focus is in the panel
  onBumper?: (delta: number) => void
}

const PanelContainer = (props: PanelContainerProps): JSX.Element => {
  const containerRef = useRef<HTMLDivElement>(null)
  const globalStateSnap = useSnapshot(globalState)
  const tabLabel = Trans('ACTION_TAB', 'Tab')
  // left out of the legend: B always goes back and the D-pad always moves
  const backLabel = Trans('ACTION_BACK', 'Back')
  const moveLabel = Trans('ACTION_MOVE', 'Move')

  // The legend of Steam wraps onto several lines once our shortcuts are in it
  const hasTabs = Boolean(props.onBumper)
  useEffect(() => {
    if (!hasTabs || !containerRef.current) {
      return
    }
    return keepLegendOnOneLine(containerRef.current.ownerDocument, tabLabel, [backLabel, moveLabel])
  }, [hasTabs, tabLabel, backLabel, moveLabel])

  useEffect(() => {
    if (!containerRef.current) {
      return
    }
    const root = containerRef.current.closest('[id^="quickaccess_content"]') as HTMLDivElement
    if (!root) {
      return
    }
    // The panel scrolls vertically like any other plugin

    const resizeObserver = new ResizeObserver(entries => {
      if (entries.length > 0) {
        const { height } = entries[0].contentRect
        if (height > 0) {
          $globalState.updateRootContainerHeight(height)
        }
      }
    })
    resizeObserver.observe(root)
    return () => {
      resizeObserver.disconnect()
    }
  }, [containerRef])

  // The buttons that nothing below handles come up to here
  // @ts-expect-error: supports returning false for bubbling despite void type definition
  const handleButtonDown = (event: CustomEvent<{ button: number; is_repeat?: boolean }>) => {
    const button = event.detail.button
    if (props.onBumper && (button === GamepadButton.BUMPER_LEFT || button === GamepadButton.BUMPER_RIGHT)) {
      if (!event.detail.is_repeat) {
        props.onBumper(button === GamepadButton.BUMPER_LEFT ? -1 : 1)
      }
      return
    }
    if (button !== GamepadButton.TRIGGER_RIGHT || !props.onRightTrigger) {
      return false
    }
    // a trigger held down must not start scan after scan
    if (!event.detail.is_repeat) {
      props.onRightTrigger()
    }
  }

  return (
    <Focusable
      ref={containerRef}
      className="reroll-panel-container"
      noFocusRing
      onButtonDown={handleButtonDown}
      // the legend of Steam is in the language of Steam
      onOKActionDescription={Trans('ACTION_SELECT', 'Select')}
      onCancelActionDescription={Trans('ACTION_BACK', 'Back')}
      // R2 in the legend of Steam, only when it starts something
      actionDescriptionMap={{
        ...(globalStateSnap.scanShortcut ? { [GamepadButton.TRIGGER_RIGHT]: Trans('ACTION_SCAN', 'Scan') } : {}),
        ...(props.onBumper
          ? {
              // the same label on both: Steam shows them as one entry
              [GamepadButton.BUMPER_LEFT]: tabLabel,
              [GamepadButton.BUMPER_RIGHT]: tabLabel,
            }
          : {}),
      }}
      style={{
        width: '100%',
        overflowY: 'hidden',
        position: 'relative',
        display: props.hidden ? 'none' : '',
      }}
    >
      <style>{`
        .reroll-panel-container > div {
          margin-bottom: 0 !important;
        }
      `}</style>
      {props.children}
    </Focusable>
  )
}

export default PanelContainer
