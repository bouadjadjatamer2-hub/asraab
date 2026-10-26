/* App capture for the README: one real throttled download over three (faked) networks, captured
 * mid-flight at a desktop window size. Dev-only.
 *
 *   node scripts/capture-app.mjs
 */
import { createServer } from 'node:http'
import { mkdtemp, mkdir, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { _electron as electron } from 'playwright'

const root = process.cwd()
const work = await mkdtemp(join(tmpdir(), 'majra-appshot-'))
const profile = join(work, 'profile')
// The folder the download saves to is printed on its page, so it has to look like a real one.
const dest = join(process.env.USERPROFILE, 'Downloads')
await mkdir(profile, { recursive: true })
const leftover = join(dest, 'project-assets.zip')
try {
  await stat(leftover)
  throw new Error(`${leftover} already exists; move it away before the shoot`)
} catch (error) {
  if (error.code !== 'ENOENT') throw error
}
// English and light before the first paint: the window follows the system locale otherwise.
await writeFile(
  join(profile, 'app-settings.json'),
  JSON.stringify({ locale: 'en', themeSource: 'light' })
)

const TOTAL = 640 * 1024 * 1024
const chunk = Buffer.alloc(256 * 1024, 0x5a)
// ~1 MB/s per stream × 12 streams: a believable 12 MB/s over three links, and still running
// (about half done) when the shutter clicks a little over half a minute in.
const DELAY_MS = 256

const server = createServer((req, res) => {
  if (req.url !== '/project-assets.zip') {
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
    'Content-Type': 'application/zip',
    'Accept-Ranges': 'bytes',
    'Content-Length': String(end - start + 1),
    ETag: '"appshot-v1"',
    'Last-Modified': new Date(0).toUTCString(),
    'Content-Disposition': 'attachment; filename="project-assets.zip"'
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
    setTimeout(pump, ok ? DELAY_MS : DELAY_MS + 4)
  }
  pump()
})

await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
const url = `http://127.0.0.1:${server.address().port}/project-assets.zip`

const app = await electron.launch({
  args: ['.'],
  cwd: root,
  env: {
    ...process.env,
    PLEXO_USER_DATA: profile,
    PLEXO_E2E_INTERFACES: 'Wi-Fi=127.0.0.1,USB Tethering=127.0.0.1,Ethernet=127.0.0.1',
    PLEXO_E2E_RETRY_BASE_MS: '50',
    PLEXO_E2E_DHT: '0'
  }
})
const page = await app.firstWindow()
await page.waitForLoadState('domcontentloaded')
await page.evaluate(() => document.fonts.ready)

await app.evaluate(
  ({ BrowserWindow }, [w, h]) => {
    const win = BrowserWindow.getAllWindows()[0]
    win.setSize(w, h)
    win.center()
  },
  [1200, 780]
)
await page.waitForTimeout(1200)

const interfaces = await page.evaluate(() => window.plexo.listInterfaces())
const ids = interfaces.map((entry) => entry.id)
const probe = await page.evaluate((target) => window.plexo.probeUrl(target), url)
await page.evaluate(
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

// Let it build a speed history, then open the download's own page while bytes are still moving.
await page.waitForTimeout(27000)
await page
  .getByRole('button', { name: /project-assets\.zip/ })
  .first()
  .click()
await page.waitForTimeout(3000)
await page.screenshot({ path: join(root, 'docs', 'screenshots', 'app-detail.png') })

const state = await page.evaluate(() => {
  const text = document.body.innerText.replace(/\n{2,}/g, '\n').trim()
  return {
    lang: document.documentElement.lang,
    dir: document.documentElement.dir,
    text: text.slice(0, 1400)
  }
})
console.log('shot app-detail.png', state.lang, state.dir)
console.log(state.text)

await app.close()
server.close()

// The shoot wrote a real (half-finished) file into Downloads; take it back out.
for (const name of ['project-assets.zip', 'project-assets.zip.plexo']) {
  await rm(join(dest, name), { force: true }).catch(() => {})
}
await rm(work, { recursive: true, force: true }).catch(() => {})
