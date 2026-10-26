import { expect, test } from '@playwright/test'
import {
  browserContextFrom,
  refererDecided,
  rememberReferer,
  requestHeaders
} from '../src/main/download/browserContext'
import type { BrowserCookie } from '../src/shared/types'

// Pure, so checked without the app.

const cookie = (fields: Partial<BrowserCookie>): BrowserCookie => ({
  name: 'session',
  value: 'secret',
  domain: 'example.com',
  hostOnly: false,
  path: '/',
  secure: true,
  ...fields
})

const sentTo = (url: string, cookies: BrowserCookie[]): string | undefined =>
  requestHeaders(new URL(url), { cookies })['Cookie']

test('a domain cookie follows a hop within its domain', () => {
  // drive.google.com redirects to drive.usercontent.google.com, which needs the .google.com sign-in.
  const google = cookie({ name: 'SID', domain: '.google.com' })
  expect(sentTo('https://drive.usercontent.google.com/download?id=1', [google])).toBe('SID=secret')
})

test("a site's cookies never reach another site", () => {
  const github = cookie({ name: 'user_session', domain: 'github.com', hostOnly: true })
  const githubDomain = cookie({ name: 'logged_in', domain: '.github.com' })
  expect(sentTo('https://objects.githubusercontent.com/x', [github, githubDomain])).toBeUndefined()
  expect(sentTo('https://notgithub.com/x', [github, githubDomain])).toBeUndefined()
  // A host-only cookie stays off subdomains too.
  expect(sentTo('https://api.github.com/x', [github])).toBeUndefined()
})

test('path and secure decide as a browser does, longest path first', () => {
  const root = cookie({ name: 'a', path: '/' })
  const docs = cookie({ name: 'b', path: '/docs' })
  expect(sentTo('https://example.com/docs/file.zip', [root, docs])).toBe('b=secret; a=secret')
  expect(sentTo('https://example.com/docsx/file.zip', [root, docs])).toBe('a=secret')
  expect(sentTo('http://example.com/docs/file.zip', [root, docs])).toBeUndefined()
})

test('a bare link goes out without an invented Referer', () => {
  // A pasted link was never on a page, so a browser would send no Referer. Mirrors such as
  // download.thinkbroadband.com answer 403 to any Referer, so inventing one breaks the download.
  const url = new URL('https://mirror.invalid.example/files/50MB.zip')
  expect(requestHeaders(url)['Referer']).toBeUndefined()
  // A browser hand-off carries the page the link was on, and that one is always sent.
  expect(
    requestHeaders(url, { cookies: [], referer: 'https://forum.invalid.example/t/1' })['Referer']
  ).toBe('https://forum.invalid.example/t/1')
})

test('an origin that refuses bare requests gets its own page as the Referer', () => {
  const site = new URL('https://hotlink.invalid.example/dl/file.zip')
  expect(refererDecided(site)).toBe(false)
  expect(requestHeaders(site)['Referer']).toBeUndefined()
  rememberReferer(site, true)
  expect(refererDecided(site)).toBe(true)
  expect(requestHeaders(new URL('https://hotlink.invalid.example/other'))['Referer']).toBe(
    'https://hotlink.invalid.example/'
  )
  // The answer is per origin: another host is still asked bare.
  expect(requestHeaders(new URL('https://elsewhere.invalid.example/f'))['Referer']).toBeUndefined()
  // Refused: stays bare, so a mirror that blocks Referers is never retried with one.
  const mirror = new URL('https://mirror.invalid.example/f')
  rememberReferer(mirror, false)
  expect(requestHeaders(mirror)['Referer']).toBeUndefined()
  // A request may override the remembered answer either way.
  expect(requestHeaders(site, undefined, null)['Referer']).toBeUndefined()
  expect(requestHeaders(mirror, undefined, 'https://mirror.invalid.example/')['Referer']).toBe(
    'https://mirror.invalid.example/'
  )
})

test('browser context from outside is checked, and a header break is refused', () => {
  const valid = { cookies: [cookie({})], referer: 'https://example.com/page', extra: 'dropped' }
  expect(browserContextFrom(valid)).toEqual({
    cookies: [cookie({})],
    referer: 'https://example.com/page'
  })
  expect(browserContextFrom({ cookies: [cookie({ value: 'a\r\nX-Evil: 1' })] })).toBeNull()
  expect(browserContextFrom({ cookies: [], userAgent: 'UA\nHost: evil' })).toBeNull()
  expect(browserContextFrom({ cookies: [], referer: 'javascript:alert(1)' })).toBeNull()
  expect(browserContextFrom('cookies')).toBeNull()
})
