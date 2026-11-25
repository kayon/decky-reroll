import { JSX } from 'react'
import { useSnapshot } from 'valtio'
import { globalState } from '@/stores/global'
import { NUM_SLOTS, SLOT_LINE_OPACITY, slotLineState } from '@/lib/slots'

// One color per slot, so that the slot can be recognised without any text
const SLOT_COLORS = ['#e8854f', '#4fa8e8', '#b97be8']

// The strip of tabs under the title
const SlotTabs = (): JSX.Element => {
  const globalStateSnap = useSnapshot(globalState)

  return (
    <div style={{ display: 'flex', gap: '6px', padding: '2px 0 6px' }}>
      {Array.from({ length: NUM_SLOTS }, (_, i) => {
        const active = i === globalStateSnap.activeSlot
        // the copy of the slot that is shown is stale: its own fields are the live ones
        const hasSearch = active ? !!globalStateSnap.multiResults : !!globalStateSnap.slots[i].multiResults
        const state = slotLineState(i, globalStateSnap.activeSlot, hasSearch)
        return (
          <div
            key={i}
            style={{
              flex: 1,
              height: active ? '5px' : '3px',
              marginTop: active ? 0 : '1px',
              borderRadius: '3px',
              backgroundColor: SLOT_COLORS[i],
              opacity: SLOT_LINE_OPACITY[state],
            }}
          />
        )
      })}
    </div>
  )
}

export default SlotTabs
