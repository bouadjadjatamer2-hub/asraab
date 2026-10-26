import { _electron as electron } from 'playwright'
import { mkdtemp, mkdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const work = await mkdtemp(join(tmpdir(), 'majra-theme-'))
const profile = join(work, 'profile')
await mkdir(profile, { recursive: true })
const app = await electron.launch({ args: ['.'], cwd: process.cwd(), env: { ...process.env, PLEXO_USER_DATA: profile } })
const page = await app.firstWindow()
await page.waitForTimeout(1500)
const read = () => page.evaluate(() => ({
  dark: window.matchMedia('(prefers-color-scheme: dark)').matches,
  bodyBg: getComputedStyle(document.body).backgroundColor,
  buttons: [...document.querySelectorAll('button[aria-label^="Switch"]')].map((b) => b.getAttribute('aria-label')),
  theme: window.matchMedia('(prefers-color-scheme: light)').matches
}))
const native = () => app.evaluate(({ nativeTheme }) => ({ source: nativeTheme.themeSource, dark: nativeTheme.shouldUseDarkColors }))
console.log('before', await read(), await native())
await page.getByRole('button', { name: /Switch to light theme/ }).click()
await page.waitForTimeout(700)
console.log('after light', await read(), await native())
await page.getByRole('button', { name: /Switch to dark theme/ }).click()
await page.waitForTimeout(700)
console.log('after dark', await read(), await native())
await app.evaluate(({ nativeTheme }) => { nativeTheme.themeSource = 'light' })
await page.waitForTimeout(700)
console.log('native light', await read(), await native())
await app.evaluate(({ nativeTheme }) => { nativeTheme.themeSource = 'dark' })
await page.waitForTimeout(700)
console.log('native dark', await read(), await native())
await page.screenshot({ path: join(work, 'theme.png') })
console.log('shot', join(work, 'theme.png'))
await app.close()
