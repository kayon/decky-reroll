import { JSX, useState } from 'react'
import { Focusable, libraryAssetImageClasses, mainMenuAppRunningClasses, Marquee } from '@decky/ui'
import { ResolveAppIconURL } from '@/lib/utils'
import Trans from '@/lib/i18n'
import { RiAlertFill } from 'react-icons/ri'
import { AppGame, InternalRouting } from '@/classes'
import { $globalState, globalState } from '@/stores/global'

interface GameSessionProps {
  game?: AppGame
  disabled?: boolean
}

const GameSession = (props: GameSessionProps): JSX.Element => {
  const [isHover, setIsHover] = useState(false)

  const renderIcon = () => {
    if (!props.game) {
      return (
        <RiAlertFill
          style={{
            color: '#f27481',
            fontSize: 24,
          }}
        />
      )
    }

    return (
      <img
        className={`${libraryAssetImageClasses.Image} ${libraryAssetImageClasses.Visibility} ${mainMenuAppRunningClasses.Visible}`}
        style={{
          width: '24px',
          height: '24px',
        }}
        src={ResolveAppIconURL(props.game)}
      />
    )
  }

  const renderTitle = () => {
    return (
      <Marquee
        style={{
          ...(props.game ? (isHover ? { color: 'white' } : {}) : { color: '#f27481' }),
        }}
      >
        {props.game ? props.game.display_name : Trans('GAME_INACTIVE', 'GAME INACTIVE')}
      </Marquee>
    )
  }

  const handleOkButton = () => {
    if (props.disabled) {
      return
    }
    $globalState.navigation(
      globalState.route === InternalRouting.Main
        ? InternalRouting.ProcessDetails
        : InternalRouting.Main
    )
  }

  // @ts-expect-error: supports returning false for bubbling despite void type definition
  const handleCancelButton = () => {
    if (globalState.route === InternalRouting.Main) {
      return false
    }
    $globalState.navigation(InternalRouting.Main)
  }

  const renderContent = () => {
    return (
      <div
        id="GameSession"
        style={{
          height: '34px',
          width: '100%',
          overflow: 'hidden',
          paddingInline: 0,
          paddingTop: 0,
        }}
      >
        {/* Item */}
        <div
          style={{
            display: 'flex',
            width: '100%',
            height: '32px',
            overflow: 'hidden',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          {/* ItemIcon */}
          <div
            style={{
              width: '24px',
              height: '24px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: '#0e141b',
              flexShrink: 0,
            }}
          >
            {/* Container GreyBackground RunningAppIcon */}
            {renderIcon()}
          </div>

          {renderTitle()}
        </div>

        <div
          style={{
            height: '2px',
            transition: 'all .175s cubic-bezier(0.17, 0.45, 0.14, 0.83)',
            background: isHover
              ? 'linear-gradient(90deg, transparent 2%, #FFFFFF 50%, transparent 98%)'
              : 'linear-gradient(90deg, transparent 2%, #3D4450 50%, transparent 98%)',
            width: '90%',
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
        ></div>
      </div>
    )
  }

  return (
    <Focusable
      onGamepadFocus={() => {
        setIsHover(true)
      }}
      onGamepadBlur={() => {
        setIsHover(false)
      }}
      onOKButton={handleOkButton}
      onClick={handleOkButton}
      onCancelButton={handleCancelButton}
      style={{
        padding: 0,
        height: '34px',
      }}
      noFocusRing
    >
      {renderContent()}
    </Focusable>
  )
}

export default GameSession
