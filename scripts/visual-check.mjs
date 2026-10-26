/* Development visual check: launches the built app with a temporary profile, a local ranged
 * origin and three network presets, then captures light/dark/Arabic screenshots. */
/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/explicit-function-return-type */
import { createServer } from 'node:http'
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { networkInterfaces } from 'node:os'
import { _electron as electron } from 'playwright'

const root = process.cwd()
const work = await mkdtemp(join(tmpdir(), 'majra-visual-'))
const out = join(work, 'shots')
const profile = join(work, 'profile')
const dest = join(work, 'dest')
await mkdir(out, { recursive: true })
await mkdir(profile, { recursive: true })
await mkdir(dest, { recursive: true })

const TOTAL = 128 * 1024 * 1024
const chunk = Buffer.alloc(256 * 1024, 0x5a)

const server = createServer((req, res) => {
  if (req.url !== '/big.bin') {
    res.writeHead(404).end()
    return
  }
  const range = /^bytes=(\d+)-(\d*)$/.exec(req.headers.range ?? '')
  let start = 0
  let end = TOTAL - 1
  if (range) {
    start = Number(range[1])
    end = range[2] ? Math.min(Number(range[2]), TOTAL - 1) : TOTAL - 1
  }
  const headers = {
    'Content-Type': 'application/octet-stream',
    'Accept-Ranges': 'bytes',
    'Content-Length': String(end - start + 1),
    ETag: '"visual-v1"',
    'Last-Modified': new Date(0).toUTCString(),
    'Content-Disposition': 'attachment; filename="Flight Manual.pdf"'
  }
  if (range) headers['Content-Range'] = `bytes ${start}-${end}/${TOTAL}`
  res.writeHead(range ? 206 : 200, headers)
  if (req.method === 'HEAD') {
    res.end()
    return
  }
  let position = start
  let closed = false
  req.on('close', () => {
    closed = true
  })
  const pump = () => {
    if (closed) return
    if (position > end) {
      res.end()
      return
    }
    const size = Math.min(chunk.length, end - position + 1)
    position += size
    const ok = res.write(size === chunk.length ? chunk : chunk.subarray(0, size))
    setTimeout(pump, ok ? 170 : 220)
  }
  pump()
})

await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
const port = server.address().port
const url = `http://127.0.0.1:${port}/big.bin`

const addresses = Object.values(networkInterfaces())
  .flat()
  .filter((entry) => entry && entry.family === 'IPv4' && !entry.internal)
  .map((entry) => entry.address)
const lan = addresses[0] ?? '127.0.0.1'
const interfaces = `Wi-Fi=${lan},USB Tethering=127.0.0.1`

function launch(locale = 'en') {
  return electron.launch({
    args: ['.'],
    cwd: root,
    env: {
      ...process.env,
      PLEXO_USER_DATA: profile,
      PLEXO_E2E_INTERFACES: interfaces,
      PLEXO_E2E_RETRY_BASE_MS: '50',
      PLEXO_E2E_DHT: '0',
      PLEXO_SETTINGS_LOCALE: locale
    }
  })
}

async function size(app, width, height) {
  await app.evaluate(
    ({ BrowserWindow }, [w, h]) => {
      const win = BrowserWindow.getAllWindows()[0]
      win.setSize(w, h)
    },
    [width, height]
  )
}

async function shot(page, name) {
  await page.waitForTimeout(350)
  await page.screenshot({ path: join(out, name) })
  console.log('shot', name)
}

async function openApp(locale = 'en') {
  const app = await launch(locale)
  const page = await app.firstWindow()
  await page.waitForLoadState('domcontentloaded')
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(1200)
  return { app, page }
}

let { app, page } = await openApp('en')
await page.getByRole('button', { name: 'Switch to light theme' }).click()
await size(app, 760, 640)
await shot(page, 'empty-light-760.png')

await page.getByRole('button', { name: 'New download' }).first().click()
await shot(page, 'new-dialog-light-760.png')
await page.keyboard.press('Escape')

await page.getByRole('button', { name: 'Switch to dark theme' }).click()
await page.waitForTimeout(350)
await shot(page, 'empty-dark-760.png')

await page.getByRole('button', { name: 'Switch to light theme' }).click()
await page.waitForTimeout(350)
await size(app, 1200, 800)

// Start a throttled download through the same API the renderer uses.
const interfacesList = await page.evaluate(() => window.plexo.listInterfaces())
const ids = interfacesList.map((entry) => entry.id)
const probe = await page.evaluate((target) => window.plexo.probeUrl(target), url)
const id = await page.evaluate(
  ([request]) => window.plexo.startDownload(request),
  [
    {
      kind: 'http',
      url: probe.finalUrl,
      destinationDir: dest,
      suggestedFileName: probe.suggestedFileName,
      totalBytes: probe.totalBytes,
      supportsRanges: probe.supportsRanges,
      interfaceIds: ids,
      etag: probe.etag,
      lastModified: probe.lastModified,
      streamsPerNetwork: 4
    }
  ]
)
await page.waitForTimeout(3500)
await shot(page, 'list-light-1200.png')

await size(app, 760, 640)
await page.getByRole('button', { name: /Flight Manual\.pdf/ }).first().click()
await shot(page, 'detail-light-760.png')

await size(app, 720, 620)
await shot(page, 'detail-light-720.png')

await page.getByRole('button', { name: 'Switch to dark theme' }).click()
await page.waitForTimeout(350)
await size(app, 760, 640)
await shot(page, 'detail-dark-760.png')
await page.getByRole('button', { name: 'Pause' }).click()
await page.waitForTimeout(500)
await size(app, 760, 640)
await shot(page, 'paused-dark-760.png')

await page.getByRole('button', { name: 'Downloads', exact: true }).click()
await size(app, 1200, 800)
await shot(page, 'list-dark-1200.png')

await page.getByRole('button', { name: 'Switch to light theme' }).click()
await page.waitForTimeout(350)
await page.evaluate((downloadId) => window.plexo.removeDownload(downloadId), id)
await app.close()

// Arabic, right-to-left, at the minimum window.
await writeFile(
  join(profile, 'app-settings.json'),
  JSON.stringify({ locale: 'ar', autoOrganize: false })
)
;({ app, page } = await openApp('ar'))
await size(app, 760, 640)
await shot(page, 'empty-ar-760.png')
await size(app, 1200, 800)
await shot(page, 'empty-ar-1200.png')
await app.close()

server.close()
console.log('visual check complete:', out)

if (process.env.KEEP_VISUAL !== '1') {
  await rm(work, { recursive: true, force: true })
}
