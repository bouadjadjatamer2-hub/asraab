/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/explicit-function-return-type */
const { app, BrowserWindow } = require('electron')
const fs = require('node:fs')
const path = require('node:path')

const root = path.join(__dirname, '..')

function ico(images) {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(images.length, 4)
  const entries = []
  let offset = 6 + images.length * 16
  for (const { size, data } of images) {
    const entry = Buffer.alloc(16)
    entry.writeUInt8(size >= 256 ? 0 : size, 0)
    entry.writeUInt8(size >= 256 ? 0 : size, 1)
    entry.writeUInt8(0, 2)
    entry.writeUInt8(0, 3)
    entry.writeUInt16LE(1, 4)
    entry.writeUInt16LE(32, 6)
    entry.writeUInt32LE(data.length, 8)
    entry.writeUInt32LE(offset, 12)
    entries.push(entry)
    offset += data.length
  }
  return Buffer.concat([header, ...entries, ...images.map((image) => image.data)])
}

function icns(images) {
  const typeFor = new Map([
    [16, 'icp4'],
    [32, 'icp5'],
    [64, 'icp6'],
    [128, 'ic07'],
    [256, 'ic08'],
    [512, 'ic09'],
    [1024, 'ic10']
  ])
  const entries = images.map(({ size, data }) => {
    const header = Buffer.alloc(8)
    header.write(typeFor.get(size), 0, 4, 'ascii')
    header.writeUInt32BE(data.length + 8, 4)
    return Buffer.concat([header, data])
  })
  const body = Buffer.concat(entries)
  const header = Buffer.alloc(8)
  header.write('icns', 0, 4, 'ascii')
  header.writeUInt32BE(body.length + 8, 4)
  return Buffer.concat([header, body])
}

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: 1024,
    height: 1024,
    show: false,
    frame: false,
    transparent: true,
    useContentSize: true,
    enableLargerThanScreen: true,
    webPreferences: { offscreen: true }
  })
  win.setContentSize(1024, 1024)
  await win.loadFile(path.join(root, 'build', 'icon-source.html'))
  // The icon page renders a WebGL scene; wait for its second frame instead of guessing at a delay.
  await win.webContents
    .executeJavaScript(
      `new Promise((resolve) => {
         const started = Date.now()
         const tick = () => {
           if (window.__iconReady) return resolve(true)
           if (Date.now() - started > 15000) return resolve(false)
           setTimeout(tick, 60)
         }
         tick()
       })`
    )
    .then((ready) => {
      if (!ready) throw new Error('the icon scene never signalled ready')
    })
  await new Promise((resolve) => setTimeout(resolve, 350))
  const full = await win.webContents.capturePage({ x: 0, y: 0, width: 1024, height: 1024 })

  const png = (size) =>
    (size === 1024 ? full : full.resize({ width: size, height: size, quality: 'best' })).toPNG()

  fs.writeFileSync(path.join(root, 'build', 'icon.png'), png(1024))
  fs.writeFileSync(path.join(root, 'build', 'icon.ico'), ico([16, 24, 32, 48, 64, 128, 256, 512, 1024].map((size) => ({ size, data: png(size) }))))
  fs.writeFileSync(path.join(root, 'build', 'icon.icns'), icns([16, 32, 64, 128, 256, 512, 1024].map((size) => ({ size, data: png(size) }))))

  const copies = [
    ['resources/icon-dark.png', 512],
    ['docs/assets/img/majra-icon.png', 512]
  ]
  for (const [relative, size] of copies) {
    fs.writeFileSync(path.join(root, ...relative.split('/')), png(size))
  }

  for (const size of [16, 32, 48, 128]) {
    fs.writeFileSync(path.join(root, 'extension', 'icons', `icon-${size}.png`), png(size))
  }

  // The "paused" extension state: the same mark, drained of its colour.
  await win.webContents.insertCSS('html { filter: grayscale(1) brightness(0.72); }')
  await new Promise((resolve) => setTimeout(resolve, 300))
  const off = await win.webContents.capturePage({ x: 0, y: 0, width: 1024, height: 1024 })
  for (const size of [16, 32, 48, 128]) {
    fs.writeFileSync(
      path.join(root, 'extension', 'icons', `icon-off-${size}.png`),
      (size === 1024 ? off : off.resize({ width: size, height: size, quality: 'best' })).toPNG()
    )
  }

  console.log('wrote icon.png/.ico/.icns, resources/icon-dark.png, docs and extension icons', full.getSize())
  app.quit()
})

app.on('window-all-closed', () => app.quit())
