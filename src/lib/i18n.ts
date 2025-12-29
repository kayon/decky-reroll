import zhCn from '@/i18n/zh-cn.json'
import ja from '@/i18n/ja.json'

type StringKey = keyof typeof zhCn
type LocaleData = Record<StringKey, string>

const strings: Record<string, LocaleData> = {
  'zh-cn': zhCn as LocaleData,
  ja: ja as LocaleData,
}

let __lang: string = ''
const getLanguage = () => {
  if (__lang) {
    return __lang
  }
  // or this method
  // await window.SteamClient.Settings.GetCurrentLanguage() => schinese
  __lang = window.LocalizationManager.m_rgLocalesToUse[0]
  return __lang
}

const Trans = (key: StringKey, def: string): string => {
  const lang = getLanguage()
  if (lang === 'en') {
    return def
  }
  const currentLocale = strings[lang]
  return currentLocale?.[key] ?? def
}

export default Trans
