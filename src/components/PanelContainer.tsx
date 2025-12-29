import React, { JSX, useEffect, useRef } from 'react'
import { $store } from '@/store'

interface PanelContainerProps {
  children: React.ReactNode
  hidden?: boolean
}

const PanelContainer = (props: PanelContainerProps): JSX.Element => {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) {
      return
    }
    const root = containerRef.current.closest('[id^="quickaccess_content"]') as HTMLDivElement
    if (!root) {
      return
    }
    const wrap = root.querySelector(':scope > .Panel > div:last-child') as HTMLDivElement
    if (wrap) {
      // 不改变root的 scroll-padding, 而是在这里抵消
      wrap.style.marginBottom = '-48px'
    }

    const resizeObserver = new ResizeObserver(entries => {
      if (entries.length > 0) {
        const { height } = entries[0].contentRect
        if (height > 0) {
          $store.updateRootContainerHeight(height)
        }
      }
    })
    resizeObserver.observe(root)
    return () => {
      resizeObserver.disconnect()
    }
  }, [containerRef])

  return (
    <div
      ref={containerRef}
      className="reroll-panel-container"
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
    </div>
  )
}

export default PanelContainer

