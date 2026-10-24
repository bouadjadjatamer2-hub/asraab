import { countText, localeTag, translate, type MessageVars } from '../shared/i18n'
import type { Locale } from '../shared/types'

/** The interface language for this process. Set once from saved settings at startup: a change
 * written by the renderer takes effect on the next launch, by design. */
let current: Locale = 'en'

export function setMainLocale(locale: Locale): void {
  current = locale
}

export function mainLocale(): Locale {
  return current
}

export function t(source: string, vars: MessageVars = {}): string {
  return translate(current, source, vars)
}

export function tn(count: number, one: string, other: string = one): string {
  return countText(current, count, one, other)
}

export function intlLocale(): string {
  return localeTag(current)
}
