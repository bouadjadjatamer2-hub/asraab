// Screenshots of the installed comparison build, for design review only.
import { _electron as electron } from 'playwright'

const app = await electron.launch({
  executablePath: 'C:\\Users\\Lenovo\\AppData\\Local\\Programs\\majra\\majra.exe',
  env: {
    ...process.env,
    PLEXO_USER_DATA: 'C:\\Users\\Lenovo\\AppData\\Local\\Temp\\majra-shot-profile'
  }
})
const win = await app.firstWindow()
await win.waitForTimeout(2500)
await win.screenshot({ path: 'C:\\Users\\Lenovo\\Downloads\\Majra-fix\\_ui-installed-main.png' })

await win.getByRole('button', { name: /New download/ }).first().click()
await win.waitForTimeout(900)
await win.screenshot({ path: 'C:\\Users\\Lenovo\\Downloads\\Majra-fix\\_ui-installed-new.png' })
await win.keyboard.press('Escape')
await win.waitForTimeout(400)

await win.getByRole('button', { name: /network/i }).first().click()
await win.waitForTimeout(700)
await win.screenshot({ path: 'C:\\Users\\Lenovo\\Downloads\\Majra-fix\\_ui-installed-networks.png' })

await app.close()
console.log('shots written')
