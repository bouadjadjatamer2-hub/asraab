import { countText, isRtl, localeTag, translate, type MessageVars } from '@shared/i18n'
import type { Locale } from '@shared/types'

/** The language for this window's lifetime. Read from the preload's synchronous startup state,
 * so the first paint is already in the saved language and direction. Renderer helpers are also
 * imported by Node-side tests, where there is no window; those see English. */
const initialLocale = typeof window === 'undefined' ? 'en' : window.plexo.initialState.locale
export const locale: Locale = initialLocale === 'ar' ? 'ar' : 'en'

export const rtl = isRtl(locale)

export const t = (source: string, vars: MessageVars = {}): string => translate(locale, source, vars)

export const tn = (count: number, one: string, other: string = one): string =>
  countText(locale, count, one, other)

export const intlLocale = localeTag(locale)

/** Applied before React mounts, so Arabic reads right-to-left from its very first frame. */
export function installLocale(): void {
  document.documentElement.lang = locale
  document.documentElement.dir = rtl ? 'rtl' : 'ltr'
  document.documentElement.classList.toggle('locale-ar', rtl)
  document.title = 'Tayyar'
}
