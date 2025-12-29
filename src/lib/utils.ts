import { AppGame, RollerConfig, ValueTypes } from '@/classes'
import { SteamAppOverview } from '@decky/ui/dist/globals/steam-client/App'

export const Sounds = [
  'bumper_end.wav',
  'camera1.wav',
  'confirmation_negative.wav',
  'confirmation_positive.wav',
  'deck_ui_achievement_toast.wav',
  'deck_ui_bumper_end_02.wav',
  'deck_ui_default_activation.wav',
  'deck_ui_hide_modal.wav',
  'deck_ui_into_game_detail.wav',
  'deck_ui_launch_game.wav',
  'deck_ui_message_toast.wav',
  'deck_ui_misc_01.wav',
  'deck_ui_misc_08.wav',
  'deck_ui_misc_10.wav',
  'deck_ui_navigation.wav',
  'deck_ui_out_of_game_detail.wav',
  'deck_ui_show_modal.wav',
  'deck_ui_side_menu_fly_in.wav',
  'deck_ui_side_menu_fly_out.wav',
  'deck_ui_slider_down.wav',
  'deck_ui_slider_up.wav',
  'deck_ui_switch_toggle_off.wav',
  'deck_ui_switch_toggle_on.wav',
  'deck_ui_tab_transition_01.wav',
  'deck_ui_tile_scroll.wav',
  'deck_ui_toast.wav',
  'deck_ui_typing.wav',
  'deck_ui_volume.wav',
  'desktop_toast_default.wav',
  'desktop_toast_short.wav',
  'pop_sound.wav',
  'recording_highlight.wav',
  'recording_start.wav',
  'recording_stop.wav',
  'silence.wav',
  'steam_os_startup.wav',
  'timer_expired_alarm.wav',
] as const

export type Sound = (typeof Sounds)[number]

const audioCache: Partial<Record<Sound, HTMLAudioElement>> = {}

export const PlaySound = (sound: Sound) => {
  try {
    window.SteamUIStore.m_GamepadUIAudioStore.m_AudioPlaybackManager.PlayAudioURL(
      `https://steamloopback.host/sounds/${sound}`
    )
  } catch {
    // Fallback
    let audio = audioCache[sound]
    if (!audio) {
      audio = new Audio(`https://steamloopback.host/sounds/${sound}`)
      audioCache[sound] = audio
    }
    audio.play()
  }
}

const ROLLER_CONFIGS: Record<ValueTypes, RollerConfig> = {
  [ValueTypes.Int8]: {
    length: 3, // 0-255
    charset: '0123456789'.split(''),
    hasDecimal: false,
  },
  [ValueTypes.Int16]: {
    length: 5, // 0-65535
    charset: '0123456789'.split(''),
    hasDecimal: false,
  },
  [ValueTypes.Int32]: {
    length: 10, // 0-4294967295
    charset: '0123456789'.split(''),
    hasDecimal: false,
  },
  [ValueTypes.Int64]: {
    length: 19, // 0-1.84e19
    charset: '0123456789'.split(''),
    hasDecimal: false,
  },
  [ValueTypes.Float32]: {
    length: 12,
    charset: '0123456789.'.split(''),
    hasDecimal: true,
  },
  [ValueTypes.Float64]: {
    length: 20,
    charset: '0123456789.'.split(''),
    hasDecimal: true,
  },
}

export const DigitRollerMetadata = (type: ValueTypes, initialValue: string) => {
  const config = ROLLER_CONFIGS[type]
  const paddedValue = initialValue.padStart(config.length, '0')
  const finalString = paddedValue.slice(-config.length)
  const initialDigits = finalString.split('')
  return {
    ...config,
    initialDigits,
  }
}

export const ValueTypeOptions = Object.keys(ValueTypes)
  .filter(key => isNaN(Number(key))) // 过滤掉反向映射产生的数字 Key
  .map(key => ({
    label: key,
    value: ValueTypes[key as keyof typeof ValueTypes],
  }))

export const ValueTypeMap = new Map<number, string>(
  Object.entries(ValueTypes)
    .filter(([, value]) => typeof value === 'number')
    .map(([key, value]) => [value as number, key])
)

export const ResolveAppIconURL = (app: AppGame | SteamAppOverview | undefined): string => {
  if (!app || !app.icon_hash) {
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAIAAAD8GO2jAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAATdJREFUeNq0llkOwyAMRGnFpSr1q/e/0zTdiLHHA6RKPlACeJ43klxu90fZLgBsfA2/G3+fT9rxWk6+TgfU8oklLKDQabsDZmcOgDGAk24DcMT5t1X1joBIxxvvONzTnpXKViC87pYiLFiRCNA2GhL1PdYJqgbbKr42MCmijB0GV8FhF7VSG1FdDN0CLYLmfspAwgCvIH4Ay3deR1EpzRoVlXbCAsNJxy6K2U8Y0Azb+1YpSZFn2CJ4OX3cKklfnxz6JufTrB7VYvE3I+a78ulpRhJ8SWowz+gT4oLIixwxlCGTE14VsX/WGZn7synyjGn1LEXubHCVGXX1TbbbhZZWl206TphZzevMuyg7NZq3AFClSDCjNhUW/cyS+koEo8epCMSH6YD0cgSr0iECaY1jf4+lPAUYAEghn64Od0CoAAAAAElFTkSuQmCC'
  }
  return `/assets/${app.gameid}/${app.icon_hash}.jpg?c=${app.local_cache_version}`
}

// 3.40282346638528859811704183484516925440e+38
const MaxFloat32 = 2 ** 127 * (1 + (1 - 2 ** -23))
// 1.79769313486231570814527423731704356798070e+308
const MaxFloat64 = Number.MAX_VALUE

export const MaxUInt8 = 2n ** 8n - 1n // 255n
export const MaxUInt16 = 2n ** 16n - 1n // 65535n
export const MaxUInt32 = 2n ** 32n - 1n // 4294967295n
export const MaxUInt64 = 2n ** 64n - 1n // 18446744073709551615n

export const IsValueValid = (inputValue: string, type: ValueTypes): boolean => {
  if (type === ValueTypes.Float32 || type === ValueTypes.Float64) {
    const num = parseFloat(inputValue)
    if (isNaN(num) || !isFinite(num) || num < 0) {
      return false
    }
    if (type === ValueTypes.Float32) {
      return num <= MaxFloat32
    }
    return num <= MaxFloat64
  }
  try {
    const num = BigInt(inputValue)
    switch (type) {
      case ValueTypes.Int8:
        return num <= MaxUInt8
      case ValueTypes.Int16:
        return num <= MaxUInt16
      case ValueTypes.Int32:
        return num <= MaxUInt32
      case ValueTypes.Int64: {
        return num <= MaxUInt64
      }
    }
  } catch {
    /* empty */
  }
  return false
}

export const ActionSoundEffects = {
  ScanTypeChanged: 'deck_ui_tab_transition_01.wav',
  FirstScan: 'desktop_toast_default.wav',
  NextScan: 'desktop_toast_default.wav',
  DigitRollerTyping: 'deck_ui_typing.wav',
  DigitRollerIn: 'deck_ui_side_menu_fly_in.wav',
  DigitRollerOut: 'deck_ui_side_menu_fly_out.wav',
  DigitRollerError: 'deck_ui_default_activation.wav',
  ChangeValues: 'deck_ui_tab_transition_01.wav',
} satisfies Record<string, Sound>
