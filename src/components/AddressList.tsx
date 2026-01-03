import { Focusable } from '@decky/ui'
import { JSX, memo, useEffect, useMemo, useRef, useState } from 'react'
import { GamepadButton } from '@decky/ui/dist/components/FooterLegend'
import Trans from '@/lib/i18n'
import SharedDpad from '@/components/SharedDpad'
import SharedButtons from '@/components/SharedButtons'
import { GamepadEventDetail } from '@decky/ui/src/components/FooterLegend'
import { RiArrowDropRightLine, RiArrowDropLeftLine } from 'react-icons/ri'
import { ActionSoundEffects, PlaySound } from '@/lib/utils'
import { Snapshot } from 'valtio'
import { NUMBER_RESULTS_PRE_PAGE } from '@/stores/global'

interface AddressListProps {
  data: Snapshot<string[][]>
  page: number
  maxPage: number
  setPage: (page:number) => boolean
  onSelectItem: (index: number) => void
  onRefresh: () => void
  previewView: string
  isFullscreen?: boolean
}

const AddressItem = memo(
  ({
    item,
    index,
    isActive,
    onFocus,
    onBlur,
    onSelect,
    previewNumValue,
    isAutoFocus,
  }: {
    item: Readonly<string[]>
    index: number
    isActive: boolean
    onFocus: () => void
    onBlur: () => void
    onSelect: () => void
    previewNumValue: number
    isAutoFocus: boolean
  }) => {
    const address = item[0]
    const value = item[1]
    const itemNumValue = Number(value)

    return (
      <Focusable
        autoFocus={isAutoFocus}
        className="address-item-wrap"
        onGamepadFocus={onFocus}
        onGamepadBlur={onBlur}
        onOKButton={onSelect}
        actionDescriptionMap={{
          [GamepadButton.DIR_UP]: Trans('ACTION_MOVE', 'Move'),
          [GamepadButton.DIR_DOWN]: Trans('ACTION_MOVE', 'Move'),
          [GamepadButton.DIR_LEFT]: Trans('ACTION_PREV_PAGE', 'Prev'),
          [GamepadButton.DIR_RIGHT]: Trans('ACTION_NEXT_PAGE', 'Next'),
          // OK = A
          [GamepadButton.OK]: Trans('ACTION_CHANGE_VALUE', 'Change'),
        }}
      >
        <div className={`address-item ${isActive ? 'active' : ''}`}>
          <div className="cursor left">
            <RiArrowDropRightLine />
          </div>
          <div className="cursor right">
            <RiArrowDropLeftLine />
          </div>
          <div className="serial">{index}</div>
          <div className="address">{address}</div>
          <div className={`value ${itemNumValue !== previewNumValue ? 'difference' : ''}`}>
            {value}
          </div>
        </div>
      </Focusable>
    )
  },
  (prev, next) => {
    return (
      prev.index === next.index &&
      prev.item[0] === next.item[0] &&
      prev.item[1] === next.item[1] &&
      prev.isActive === next.isActive &&
      prev.previewNumValue === next.previewNumValue
    )
  }
)

AddressItem.displayName = 'AddressItem'

const AddressList = (props: AddressListProps): JSX.Element => {
  const previewNumValue = Number(props.previewView)
  const [activeIndex, setActiveIndex] = useState<number>(-1)
  const [isHover, setIsHover] = useState(false)
  const { data, onRefresh } = props
  const onRefreshRef = useRef(onRefresh)
  const hasData = Boolean(data && data.length > 0)

  const Data = useMemo(() => {
    if (!data || data.length === 0) {
      return []
    }

    const currentPage = props.page || 1
    const startIndex = (currentPage - 1) * NUMBER_RESULTS_PRE_PAGE
    const endIndex = startIndex + NUMBER_RESULTS_PRE_PAGE

    return data.slice(startIndex, endIndex)
  }, [data, props.page])

  const ActiveIndex = useMemo(() => {
    if (!Data || activeIndex >= Data.length) {
      return 0
    }
    return activeIndex
  }, [Data, activeIndex])

  useEffect(() => {
    let timerId: number | undefined
    if (hasData) {
      timerId = window.setInterval(() => {
        onRefreshRef.current()
      }, 1e3)
    }
    return () => {
      if (timerId) {
        window.clearInterval(timerId)
      }
    }
  }, [hasData])

  const handleDirection = (event: CustomEvent<GamepadEventDetail>) => {
    const button = event.detail.button
    if (button === GamepadButton.DIR_LEFT) {
      if (props.setPage(props.page - 1)) {
        PlaySound(ActionSoundEffects.DigitRollerTyping)
      }
      return
    } else if (button === GamepadButton.DIR_RIGHT) {
      if (props.setPage(props.page + 1)) {
        PlaySound(ActionSoundEffects.DigitRollerTyping)
      }
      return
    }
    if (button === GamepadButton.DIR_UP) {
      if (ActiveIndex > 0) {
        PlaySound(ActionSoundEffects.DigitRollerTyping)
      }
    } else if (ActiveIndex !== Data.length - 1) {
      PlaySound(ActionSoundEffects.DigitRollerTyping)
    }
    return false
  }

  const renderGuide = () => {
    return (
      <div className="address-list-guide">
        <div className="pagination">
          <div>
            {props.page}/{props.maxPage}
          </div>
        </div>
        <div className="guide">
          {props.maxPage > 1 && (
            <SharedDpad left={true} right={true}>
              <div>{Trans('ACTION_PREV_PAGE', 'Prev')}</div>
              <div>{Trans('ACTION_NEXT_PAGE', 'Next')}</div>
            </SharedDpad>
          )}
          <SharedDpad up={true} down={true}>
            <div>{Trans('ACTION_MOVE', 'Move')}</div>
          </SharedDpad>
          <SharedButtons a={true}>
            <div>{Trans('ACTION_CHANGE_VALUE', 'Change')}</div>
          </SharedButtons>
        </div>
      </div>
    )
  }

  return (
    <Focusable
      noFocusRing
      onGamepadDirection={handleDirection}
      onGamepadFocus={() => {
        setIsHover(true)
      }}
      onGamepadBlur={() => {
        setIsHover(false)
      }}
    >
      <style>{`
        .address-list {
          padding: 0;
          display: flex;
          flex-direction: column;
          
          > .address-list-guide {
            display: none;
            gap: 10px;
            position: fixed;
            height: 26px;
            width: 292px;
            right: 0;
            bottom: 0;
            padding: 0 4px;
            background-color: #32373d;
            color: white;
            z-index: 5;
            overflow: hidden;
            > .pagination {
              flex-shrink: 0;
              display: flex;
              align-items: center;
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
            > .guide {
              flex: 1;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 16px;
            }
          }
          
          > .address-list-content {
            display: flex;
            flex-direction: column;
          
            > .address-item-wrap {
              padding: 0;
              display: flex;
              flex-direction: column;
              gap: 2px;
              scroll-margin: 0;
  
              > .address-item {
                margin: 0 -16px;
                padding: 0 16px;
                height: 18px;
                overflow: hidden;
                display: flex;
                align-items: center;
                gap: 4px;
                background-color: rgba(255, 255, 255, 0);
                position: relative;
                font-size: 12px;
                font-family: monospace;
                
                > .cursor {
                  display: flex;
                  height: 18px;
                  width: 16px;
                  font-size: 16px;
                  align-items: center;
                  justify-content: center;
                  position: absolute;
                  color: white;
                  z-index: 1;
                  transition: all .175s cubic-bezier(0.17, 0.45, 0.14, 0.83);
                  opacity: 0;
                  
                  &.left {
                    left: 0;
                    transform: translateX(-8px);
                  }
                  &.right {
                    right: 0;
                    transform: translateX(8px);
                  }
                }
             
                > .serial {
                  height: 15px;
                  width: 15px;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  font-size: 10px;
                  overflow: hidden;
                  background-color: rgba(255, 255, 255, 0.15);
                  border-radius: 2px;
                  color: #777;
                }
                > .address {
                  flex-shrink: 0;
                }
                > .value {
                  flex: 1;
                  text-align: right;
                  color: #6bcc62;
                  white-space: nowrap;
                  overflow: hidden;
                  text-overflow: ellipsis;
    
                  &.difference {
                    color: #f0ad4e;
                  }
                }
                
                &.active {
                  > .serial {
                    color: #23262e;
                    background-color: white;
                  }
                  > .address {
                    color: white;
                  }
                  > .cursor {
                    opacity: 1;
                    transform: translateX(0);
                  }
                }
              }
            }
          }
          &.focused {
            > .address-list-guide {
              display: flex;
            }
          }
        }
      `}</style>
      <div className={`address-list ${props.data.length > 0 ? 'focused' : ''}`}>
        {props.isFullscreen && renderGuide()}
        <div className="address-list-content">
          {Data.map((item, index) => {
            const absoluteIndex = index + (props.page - 1) * NUMBER_RESULTS_PRE_PAGE
            return (
              <AddressItem
                key={item[0]}
                item={item}
                index={absoluteIndex + 1}
                isActive={ActiveIndex === index}
                previewNumValue={previewNumValue}
                onFocus={() => setActiveIndex(index)}
                onBlur={() => setActiveIndex(-1)}
                onSelect={() => props.onSelectItem(absoluteIndex)}
                isAutoFocus={isHover && index === ActiveIndex}
              />
            )
          })}

          <div
            style={{
              height: '48px',
              marginBottom: '-48px',
              pointerEvents: 'none',
              flexShrink: 0,
            }}
          />
        </div>
      </div>
    </Focusable>
  )
}

export default AddressList
