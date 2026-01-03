import { DialogButton, Focusable, Marquee } from '@decky/ui'
import { JSX, memo, useEffect, useMemo, useState } from 'react'
import Backend from '@/lib/backend'
import Trans from '@/lib/i18n'
import showQRCodeModal from '@/lib/ShowQRCodeModal'
import { AppGame, InternalRouting } from '@/classes'
import { Process } from '@/classes'
import { RiArrowDropLeftLine, RiArrowDropRightLine } from 'react-icons/ri'
import { $globalState } from '@/stores/global'
import { Snapshot } from 'valtio'

const ProcessItem = memo(
  ({
     item,
     index,
     isActive,
     isSelected,
     onFocus,
     onBlur,
     onSelect,
     onCancel,
   }: {
    item: Process
    index: number
    isActive: boolean
    isSelected: boolean
    onFocus: () => void
    onBlur: () => void
    onSelect: () => void
    onCancel: () => void
  }) => {
    return (
      <Focusable
        key={index}
        className={`process-item ${isActive ? 'active' : ''} ${isSelected ? 'selected' : ''}`}
        onGamepadFocus={onFocus}
        onGamepadBlur={onBlur}
        onOKButton={onSelect}
        onCancelButton={onCancel}
      >
        <div className="cursor left">
          <RiArrowDropRightLine />
        </div>
        <div className="cursor right">
          <RiArrowDropLeftLine />
        </div>
        <div className="process-item-pid">{item.PID}</div>
        <div className="process-item-name"><Marquee>{item.Comm}</Marquee></div>
      </Focusable>
    )
  },
  (prev, next) => {
    return (
      prev.item.PID === next.item.PID &&
      prev.isActive === next.isActive &&
      prev.isSelected === next.isSelected
    )
  }
)

ProcessItem.displayName = 'ProcessItem'

interface GameProcessProps {
  game?: AppGame
  process?: Snapshot<Process> | null
  // 当在游戏中显示 QuickAccess 时视为全屏
  // 通过 !footerLegendVisible 判断
  isFullscreen: boolean
}

const GameProcess = (props: GameProcessProps): JSX.Element => {
  const [processes, setProcesses] = useState<Process[]>([])
  const [activeIndex, setActiveIndex] = useState<number>(-1)

  const ActiveProcess = useMemo<Process|null>(() => {
    if (activeIndex === -1) {
      return null
    }
    return processes[activeIndex] ?? null
  }, [processes, activeIndex])

  useEffect(() => {
    let isMounted = true
    const load = async () => {
      if (props.game) {
        const procs = await Backend.GetGameProcesses(props.game.appid)
        if (isMounted) {
          setProcesses(procs ?? [])
        }
      }
    }
    load()
    return () => {
      isMounted = false
    }
  }, [props.game])

  useEffect(() => {
    let timer: number | null = null
    let isMounted = true

    const checkProcess = async () => {
      const hasProcess = await $globalState.autoSelectGameProcess()
      if (!hasProcess && isMounted) {
        timer = window.setTimeout(checkProcess, 2e3)
      }
    }

    checkProcess().then()

    return () => {
      isMounted = false
      if (timer) {
        clearTimeout(timer)
      }
    }
  }, [])

  const renderProcessDetail = () => {
    const proc = ActiveProcess ?? props.process
    return (
      <div className="process-detail">
        <div className="process-detail-row">
          <label>AppID</label>
          <div>{props.game?.appid ?? '-'}</div>
        </div>
        <div className="process-detail-row">
          <label>PID</label>
          <div
            style={{
              ...(props.process?.PID === proc?.PID ? { color: '#6bcc62' } : {}),
            }}
          >
            {proc?.PID ?? '-'}
          </div>
        </div>
        <div className="process-detail-command">{proc?.Command}</div>
      </div>
    )
  }

  return (
    <div
      style={{
        height: `${(!props.isFullscreen ? 440 : 480) - 47 - 34 - 10}px`,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <style>{`
        .process-detail {
          padding-top: 4px 0;
          flex-shrink: 0;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          > .process-detail-row {
            display: flex;
            align-items: center;
            height: 24px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            font-size: 12px;
            > div {
              margin-left: auto;
              color: white;
            }
          }
          > .process-detail-command {
            display: -webkit-box;
            -webkit-box-orient: vertical;
            -webkit-line-clamp: 4;
            word-break: break-all;
            line-height: 15px;
            height: 61px;
            font-size: 12px;
            color: #b8bcbf;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            padding: 4px 0;
            overflow: hidden;
          }
        }
        .processes {
          width: 100%;
          flex: 1;
          padding: 8px 0;
          display: flex;
          flex-direction: column;
          
          > .process-item {
            display: flex;
            gap: 4px;
            font-size: 12px;
            align-items: center;
            height: 20px;
            margin: 0 -16px;
            padding: 0 16px;
            position: relative;
            
            > .cursor {
              display: flex;
              height: 20px;
              width: 16px;
              font-size: 16px;
              align-items: center;
              justify-content: center;
              position: absolute;
              color: white;
              z-index: 1;
              transition: all .175s cubic-bezier(0.17, 0.45, 0.14, 0.83);
              opacity: 0;
              color: white;
              
              &.left {
                left: 0;
                transform: translateX(-8px);
              }
              &.right {
                right: 0;
                transform: translateX(8px);
              }
            }
            
            > .process-item-pid {
              flex-shrink: 0;
            }
            > .process-item-name {
              flex: 1;
              overflow: hidden;
            }

            &.active {
              > .cursor {
                opacity: 1;
                transform: translateX(0);
              }
            }
            &.selected {
              > .process-item-pid,
              > .process-item-name {
                color: #6bcc62;
              }
            }
          }
        }
      `}</style>
      <div className="processes">
        {processes.map((proc, index) => (
          <ProcessItem
            key={proc.PID}
            item={proc}
            index={index}
            isActive={index === activeIndex}
            isSelected={proc.PID === props.process?.PID}
            onFocus={() => setActiveIndex(index)}
            onBlur={() => setActiveIndex(-1)}
            onSelect={() => $globalState.selectGameProcess(proc.PID)}
            onCancel={() => $globalState.navigation(InternalRouting.Main)}
          />
        ))}
      </div>
      {renderProcessDetail()}

      <div>
        <div
          style={{
            fontSize: '12px',
            lineHeight: '20px',
          }}
        >
          {Trans('WRONG_PROCESS', 'Wrong process?')}
        </div>
        <DialogButton
          onClick={() => showQRCodeModal('https://github.com/kayon/decky-reroll/issues')}
          onCancelButton={() => $globalState.navigation(InternalRouting.Main)}
          style={{
            paddingBlock: 0,
            height: '30px',
            fontSize: '12px',
          }}
        >
          {Trans('REPORT_ISSUE', 'Report an issue')}
        </DialogButton>
      </div>
    </div>
  )
}
export default GameProcess
