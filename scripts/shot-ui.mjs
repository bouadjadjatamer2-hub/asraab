// Visual check of the redesigned shell. Development helper only.
import { _electron as electron } from 'playwright'

const app = await electron.launch({
  executablePath: 'C:\\Users\\Lenovo\\Downloads\\tayyar\\dist\\win-unpacked\\tayyar.exe'
})
const win = await app.firstWindow()
win.on('console', (message) => {
  if (message.type() === 'error') console.log('console error:', message.text())
})
await win.waitForTimeout(2500)
await win.screenshot({ path: 'C:\\Users\\Lenovo\\Downloads\\tayyar\\dist\\_ui-main.png' })

await win.getByRole('button', { name: /New download/ }).first().click()
await win.waitForTimeout(700)
await win.screenshot({ path: 'C:\\Users\\Lenovo\\Downloads\\tayyar\\dist\\_ui-new.png' })
await win.keyboard.press('Escape')
await win.waitForTimeout(400)

await win.getByRole('button', { name: /network/i }).first().click()
await win.waitForTimeout(500)
await win.getByText('Speed & data limits').click()
await win.waitForTimeout(700)
await win.getByText('Power & automation').scrollIntoViewIfNeeded()
await win.waitForTimeout(300)
await win.screenshot({ path: 'C:\\Users\\Lenovo\\Downloads\\tayyar\\dist\\_ui-settings.png' })

await app.close()
console.log('shots written')
