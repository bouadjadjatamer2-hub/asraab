// Dark-theme visual check of the redesigned shell. Development helper only.
import { _electron as electron } from 'playwright'

const app = await electron.launch({
  executablePath: 'C:\\Users\\Lenovo\\Downloads\\tayyar\\dist\\win-unpacked\\tayyar.exe'
})
const win = await app.firstWindow()
win.on('console', (message) => {
  if (message.type() === 'error') console.log('console error:', message.text())
})
await app.evaluate(({ nativeTheme }) => {
  nativeTheme.themeSource = 'dark'
})
await win.waitForTimeout(2000)
await win.screenshot({ path: 'C:\\Users\\Lenovo\\Downloads\\tayyar\\dist\\_ui-dark.png' })

await win.getByRole('button', { name: /New download/ }).first().click()
await win.waitForTimeout(700)
await win.screenshot({ path: 'C:\\Users\\Lenovo\\Downloads\\tayyar\\dist\\_ui-new-dark.png' })

await app.close()
console.log('dark shots written')
