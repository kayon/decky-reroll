import React, { JSX } from 'react'

const baseCross =
  'M10.6667 1C10.6667 0.447715 11.1144 0 11.6667 0H20.3333C20.8856 0 21.3333 0.447715 21.3333 1V10.6667H31C31.5523 10.6667 32 11.1144 32 11.6667V20.3333C32 20.8856 31.5523 21.3333 31 21.3333H21.3333V31C21.3333 31.5523 20.8856 32 20.3333 32H11.6667C11.1144 32 10.6667 31.5523 10.6667 31V21.3333H1C0.447715 21.3333 0 20.8856 0 20.3333V11.6667C0 11.1144 0.447715 10.6667 1 10.6667H10.6667V1Z'

const arrows = {
  up: 'M12.4444 5.33333L16 1.77778L19.5556 5.33333H12.4444Z',
  down: 'M19.5556 26.6667L16 30.2222L12.4444 26.6667H19.5556Z',
  left: 'M5.33333 19.5556L1.77778 16L5.33333 12.4444V19.5556Z',
  right: 'M26.6667 12.4444L30.2222 16L26.6667 19.5556V12.4444Z',
}

interface SharedDpadProps {
  left?: boolean
  right?: boolean
  up?: boolean
  down?: boolean
  size?: number
  children?: React.ReactNode
}

const SharedDpad = (props: SharedDpadProps): JSX.Element => {
  const size = props.size ?? 18
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        fontSize: 10,
      }}
    >
      <div
        style={{
          width: size,
          height: size,
        }}
      >
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path fillRule="evenodd" clipRule="evenodd" d={baseCross} fill="white" />
          {props.up && <path d={arrows.up} fill="black" />}
          {props.down && <path d={arrows.down} fill="black" />}
          {props.left && <path d={arrows.left} fill="black" />}
          {props.right && <path d={arrows.right} fill="black" />}
        </svg>
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          lineHeight: '12px',
        }}
      >
        {props.children}
      </div>
    </div>
  )
}

export default SharedDpad
