import type { BrowserContext, BrowserCookie } from '../../shared/types'

// Sites (and the CDNs and bot filters in front of them) refuse a client that doesn't name a
// browser: AnkerGames, for one, answers 403 to `Majra/1.0` and 200 to Chrome's own string.
// A download manager has to look like what the link was copied from.
const CHROME_VERSION = process.versions.chrome ?? '140.0.0.0'
const USER_AGENT = `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${CHROME_VERSION} Safari/537.36`

/** What an origin answered to the Referer question — see `refererFor`. */
const refererByOrigin = new Map<string, 'site' | 'none'>()
const MAX_ORIGINS = 200

/**
 * The Referer a download to `url` should carry when the browser didn't bring one.
 *
 * A browser sends a Referer only for a link it followed, so a pasted link goes out bare. Some
 * hosts (game and media sites behind hotlink protection) refuse a bare request and want their own
 * page; others (mirrors with the opposite filter, thinkbroadband) refuse any Referer at all. So
 * nothing is invented up front: when an origin answers 403 bare, `probeUrl` asks once more with the
 * site as the Referer and records here which of the two it accepts. The download's streams read the
 * same answer, so the whole transfer goes out the way that origin wants it.
 */
export function refererFor(url: URL): string | undefined {
  return refererByOrigin.get(url.origin) === 'site' ? `${url.origin}/` : undefined
}

/** Whether this origin has already answered the Referer question (see `refererFor`). */
export function refererDecided(url: URL): boolean {
  return refererByOrigin.has(url.origin)
}

/** Remembers that `url`'s origin accepted (or refused) its own page as the Referer. */
export function rememberReferer(url: URL, accepted: boolean): void {
  if (!refererByOrigin.has(url.origin) && refererByOrigin.size >= MAX_ORIGINS) {
    const oldest = refererByOrigin.keys().next()
    if (!oldest.done) refererByOrigin.delete(oldest.value)
  }
  refererByOrigin.set(url.origin, accepted ? 'site' : 'none')
}

/** Called again for every redirect, so a site's session cookie never reaches the next host (its
 * CDN), while a cookie set for a whole domain still follows a hop within it. `referer` overrides
 * the remembered answer for one request (a string sends it, `null` forces none). */
export function requestHeaders(
  url: URL,
  browser?: BrowserContext,
  referer: string | null | undefined = refererFor(url)
): Record<string, string> {
  const headers: Record<string, string> = {
    'User-Agent': browser?.userAgent ?? USER_AGENT,
    Accept: '*/*',
    'Accept-Language': 'en-US,en;q=0.9'
  }
  // A browser hand-off (the extension) carries the exact page the link was on: always better.
  const sent = browser?.referer ?? referer
  if (sent) headers['Referer'] = sent
  const cookie = browser ? cookieHeader(url, browser.cookies) : ''
  if (cookie) headers['Cookie'] = cookie
  return headers
}

/** RFC 6265 §5.4. */
function cookieHeader(url: URL, cookies: readonly BrowserCookie[]): string {
  const host = url.hostname.toLowerCase()
  const path = url.pathname || '/'
  return cookies
    .filter((cookie) => {
      const domain = cookie.domain.replace(/^\./, '').toLowerCase()
      const domainMatches = cookie.hostOnly
        ? host === domain
        : host === domain || host.endsWith(`.${domain}`)
      const pathMatches =
        path === cookie.path ||
        (path.startsWith(cookie.path) &&
          (cookie.path.endsWith('/') || path[cookie.path.length] === '/'))
      return domainMatches && pathMatches && (!cookie.secure || url.protocol === 'https:')
    })
    .sort((a, b) => b.path.length - a.path.length)
    .map((cookie) => (cookie.name ? `${cookie.name}=${cookie.value}` : cookie.value))
    .join('; ')
}

const MAX_COOKIES = 500
const MAX_TEXT = 8192
// A line break would start a header of its own, and `;` separates cookies.
// eslint-disable-next-line no-control-regex -- control characters are exactly what's refused
const UNSAFE = /[\x00-\x1f\x7f]/
// eslint-disable-next-line no-control-regex -- as above
const UNSAFE_IN_COOKIE = /[\x00-\x1f\x7f;]/

const isText = (value: unknown, unsafe = UNSAFE): value is string =>
  typeof value === 'string' && value.length <= MAX_TEXT && !unsafe.test(value)

/** It comes from outside Majra (the extension, or a manifest read back from disk), so only known
 * fields are kept. */
export function browserContextFrom(value: unknown): BrowserContext | null {
  if (typeof value !== 'object' || value === null) return null
  const { cookies, referer, userAgent, name } = value as Record<string, unknown>
  if (!Array.isArray(cookies) || cookies.length > MAX_COOKIES) return null
  if (referer !== undefined && !(isText(referer) && /^https?:\/\//i.test(referer))) return null
  if (userAgent !== undefined && !isText(userAgent)) return null
  if (name !== undefined && !(isText(name) && name.length <= 40)) return null
  const checked: BrowserCookie[] = []
  for (const cookie of cookies) {
    if (typeof cookie !== 'object' || cookie === null) return null
    const { name, value, domain, hostOnly, path, secure } = cookie as Record<string, unknown>
    if (!isText(name, UNSAFE_IN_COOKIE) || !isText(value, UNSAFE_IN_COOKIE)) return null
    if (!isText(domain) || !isText(path) || !path.startsWith('/')) return null
    if (typeof hostOnly !== 'boolean' || typeof secure !== 'boolean') return null
    checked.push({ name, value, domain, hostOnly, path, secure })
  }
  return {
    cookies: checked,
    ...(referer !== undefined && { referer }),
    ...(userAgent !== undefined && { userAgent }),
    ...(name !== undefined && { name })
  }
}
