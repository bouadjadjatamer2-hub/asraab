// Checks what pasting an AnkerGames page shows: the site's page URL (HTML, not a file) and an
// old/incorrect slug. Dev check only.
import { _electron as electron } from 'playwright'

const app = await electron.launch({
  executablePath: 'C:\\Users\\Lenovo\\Downloads\\tayyar\\dist\\win-unpacked\\tayyar.exe',
  args: ['--user-data-dir=C:\\Users\\Lenovo\\AppData\\Local\\Temp\\tayyar-probe-check']
})
const win = await app.firstWindow()
await win.waitForTimeout(2000)
await win.getByRole('button', { name: /New download/ }).first().click()
await win.waitForTimeout(600)

const input = win.getByPlaceholder(/Paste a link/)
const readError = async () => {
  const body = await win.locator('[role="dialog"]').innerText()
  return body.split('\n').filter((line) => /page|refused|status|download/i.test(line)).join(' | ')
}

await input.fill('https://ankergames.net/game/warhammer-40000-boltgun-2')
await win.waitForTimeout(6000)
console.log('real page:', await readError())
await win.screenshot({ path: 'C:\\Users\\Lenovo\\Downloads\\tayyar\\dist\\_check-page.png' })

await input.fill('https://ankergames.net/game/warhammer-4000')
await win.waitForTimeout(6000)
console.log('wrong slug:', await readError())

await app.close()
