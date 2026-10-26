/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/explicit-function-return-type */
const { app, BrowserWindow } = require('electron')
const fs = require('node:fs')
const path = require('node:path')

app.disableHardwareAcceleration()

const root = path.join(__dirname, '..')
const svg = path.join(root, 'docs', 'assets', 'img', 'asraab-mark.svg')
const outDir = path.join(root, 'docs', 'assets', 'img')

const sizes = [
  ['asraab-mark.png', 128],
  ['asraab-icon.png', 512],
  ['icon-192.png', 192],
  ['icon-512.png', 512],
  ['apple-touch-icon.png', 180]
]

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: 512,
    height: 512,
    show: false,
    frame: false,
    transparent: true,
    useContentSize: true,
    webPreferences: { offscreen: true }
  })
  await win.loadFile(svg)
  await new Promise((resolve) => setTimeout(resolve, 400))
  for (const [name, size] of sizes) {
    const image = await win.webContents.capturePage({ x: 0, y: 0, width: 512, height: 512 })
    const scaled = image.resize({ width: size, height: size, quality: 'best' })
    fs.writeFileSync(path.join(outDir, name), scaled.toPNG())
    console.log('wrote', name, scaled.getSize())
  }
  app.quit()
})

app.on('window-all-closed', () => app.quit())
