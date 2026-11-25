import React, { JSX, useMemo, useState } from 'react'
import { DialogButton, Focusable, NavEntryPositionPreferences } from '@decky/ui'
import Trans from '@/lib/i18n'
import { MultiResults, TypeResults, ValueTypes } from '@/classes'
import { candidateTypes, formatCount, typesToSearch } from '@/lib/candidates'
import { canKeepOnly, isUsable, ReadonlyDeep } from '@/lib/multi'
import { ActionSoundEffects, PlaySound, ValueTypeMap } from '@/lib/utils'
import { $globalState } from '@/stores/global'

// Shared look of the chips of types: a grid of three columns, one chip per type

const ALL_TYPES = [
  ValueTypes.Int8,
  ValueTypes.Int16,
  ValueTypes.Int32,
  ValueTypes.Int64,
  ValueTypes.Float32,
  ValueTypes.Float64,
]

const COLORS = {
  text: '#dfe3e8',
  faint: 'rgba(255, 255, 255, 0.35)',
  muted: '#8b929a',
  warning: '#d9a05b',
  danger: '#f27481',
  fill: 'rgba(255, 255, 255, 0.18)',
  idle: 'rgba(255, 255, 255, 0.07)',
  focusFill: 'rgba(255, 255, 255, 0.38)',
  focusRing: '#ffffff',
}

const CHIPS_PER_ROW = 3
const CHIP_GAP = 4

type ChipLook = 'on' | 'idle' | 'off'

interface ChipProps {
  label: string
  detail?: string
  detailColor?: string
  look: ChipLook
  outlined?: boolean
  disabled?: boolean
  onClick?: () => void
  // Y while the chip has the focus (and its entry in the legend)
  onOptions?: () => void
  optionsLabel?: string
}

const Chip = (props: ChipProps): JSX.Element => {
  // The gamepad focus is drawn here
  const [focused, setFocused] = useState(false)
  const style: React.CSSProperties = {
    minWidth: 0,
    // three chips per row, equal widths, even when the last row has fewer
    flex: '0 0 auto',
    width: `calc((100% - ${(CHIPS_PER_ROW - 1) * CHIP_GAP}px) / ${CHIPS_PER_ROW})`,
    height: '28px',
    padding: '0 2px',
    fontSize: '11px',
    lineHeight: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    borderRadius: '3px',
    backgroundColor: focused ? COLORS.focusFill : props.look === 'on' ? COLORS.fill : COLORS.idle,
    color: focused ? '#ffffff' : props.look === 'on' ? COLORS.text : props.look === 'idle' ? COLORS.muted : COLORS.faint,
    boxShadow: focused
      ? `inset 0 0 0 2px ${COLORS.focusRing}`
      : props.outlined
        ? `inset 0 0 0 1px ${COLORS.text}`
        : 'none',
  }
  return (
    <DialogButton
      style={style}
      onClick={props.onClick}
      onGamepadFocus={() => setFocused(true)}
      onGamepadBlur={() => setFocused(false)}
      onOKActionDescription={Trans('ACTION_SELECT', 'Select')}
      onOptionsButton={props.onOptions}
      onOptionsActionDescription={props.onOptions ? props.optionsLabel : undefined}
      disabled={props.disabled}
      focusable={!props.disabled}
    >
      <span style={{ textDecoration: props.look === 'off' ? 'line-through' : 'none' }}>{props.label}</span>
      {props.detail !== undefined && (
        <span style={{ color: props.detailColor ?? 'inherit', textDecoration: 'none' }}>{props.detail}</span>
      )}
    </DialogButton>
  )
}

// The chips are in rows of three
const Grid = (props: { children: React.ReactNode }): JSX.Element => {
  const chips = React.Children.toArray(props.children)
  const rows: React.ReactNode[][] = []
  for (let i = 0; i < chips.length; i += CHIPS_PER_ROW) {
    rows.push(chips.slice(i, i + CHIPS_PER_ROW))
  }
  return (
    <Focusable
      navEntryPreferPosition={NavEntryPositionPreferences.MAINTAIN_X}
      noFocusRing
      style={{ display: 'flex', flexDirection: 'column', gap: `${CHIP_GAP}px`, padding: '4px 0' }}
    >
      {rows.map((row, index) => (
        <Focusable
          key={index}
          flow-children="horizontal"
          navEntryPreferPosition={NavEntryPositionPreferences.MAINTAIN_X}
          noFocusRing
          style={{ display: 'flex', flexDirection: 'row', gap: `${CHIP_GAP}px` }}
        >
          {row}
        </Focusable>
      ))}
    </Focusable>
  )
}

interface TypePickerProps {
  value: string
  manualTypes: ValueTypes[]
  disabled?: boolean
}

// Before the first scan: which types will be searched for the value typed
export const TypePicker = (props: TypePickerProps): JSX.Element => {
  const candidates = useMemo(() => candidateTypes(props.value, false), [props.value])
  const searched = typesToSearch(candidates, props.manualTypes)
  const manual = props.manualTypes.length > 0

  const look = (type: ValueTypes): ChipLook => {
    if (!candidates.includes(type)) {
      return 'off'
    }
    if (manual && !props.manualTypes.includes(type)) {
      return 'idle'
    }
    return 'on'
  }

  return (
    <>
      <Grid>
        {ALL_TYPES.map(type => (
          <Chip
            key={type}
            label={ValueTypeMap.get(type) ?? ''}
            look={look(type)}
            outlined={props.manualTypes.includes(type)}
            disabled={props.disabled}
            onClick={() => $globalState.toggleManualType(type)}
          />
        ))}
      </Grid>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '11px',
          color: COLORS.muted,
          minHeight: '22px',
        }}
      >
        <span>
          {manual ? Trans('TYPE_MANUAL', 'Manual') : Trans('TYPE_AUTO', 'Auto')} · {searched.length}
        </span>
        {manual && (
          <DialogButton
            style={{ minWidth: 0, width: 'auto', height: '20px', padding: '0 8px', fontSize: '11px' }}
            disabled={props.disabled}
            focusable={!props.disabled}
            onClick={$globalState.clearManualTypes}
            onOKActionDescription={Trans('ACTION_SELECT', 'Select')}
          >
            {Trans('TYPE_AUTO', 'Auto')}
          </DialogButton>
        )}
      </div>
    </>
  )
}

const detailOf = (entry: ReadonlyDeep<TypeResults>): { text: string; color?: string } => {
  switch (entry.Status) {
    case 'ok':
      return { text: formatCount(entry.Count) }
    case 'parked':
      return { text: formatCount(entry.Count), color: COLORS.warning }
    case 'truncated':
      return { text: '!', color: COLORS.danger }
    case 'dropped':
      return { text: '–' }
    default:
      return { text: '0' }
  }
}

interface TypeTabsProps {
  multi: ReadonlyDeep<MultiResults>
  selected: ValueTypes | null
  disabled?: boolean
}

// After a scan: one chip per searched type, with what it found
export const TypeTabs = (props: TypeTabsProps): JSX.Element => {
  return (
    <Grid>
      {props.multi.Types.map(entry => {
        const usable = isUsable(entry)
        const detail = detailOf(entry)
        const keepable = canKeepOnly(props.multi, entry.Type)
        return (
          <Chip
            key={entry.Type}
            label={entry.Name}
            detail={detail.text}
            detailColor={detail.color}
            look={usable ? 'on' : 'off'}
            outlined={entry.Type === props.selected}
            disabled={props.disabled || !usable}
            onClick={() => $globalState.selectType(entry.Type)}
            onOptions={
              keepable
                ? () => {
                    PlaySound(ActionSoundEffects.ScanTypeChanged)
                    $globalState.keepOnly(entry.Type)
                  }
                : undefined
            }
            optionsLabel={Trans('ACTION_KEEP_ONLY', 'Keep only')}
          />
        )
      })}
    </Grid>
  )
}
