import { WindowRouter } from '@decky/ui/dist/modules/Router'
import { SteamAppOverview } from '@decky/ui/dist/globals/steam-client/App'

export {}

interface SteamUIStoreExtend {
  MainRunningApp: SteamAppOverview | undefined
}

declare global {
  interface Window {
    FocusedAppWindowStore: {
      m_nFocusedWindowID: number
      m_unFocusedAppID: number
      m_unFocusedOverlayAppID: number
      m_unFocusedOverlayPID: number
    }

    SteamUIStore: SteamUIStoreExtend & {
      GetFocusedWindowInstance: () => WindowRouter
      m_GamepadUIAudioStore: {
        m_AudioPlaybackManager: {
          PlayAudioURL: (url: string) => void
        }
      }
    }
  }
}
