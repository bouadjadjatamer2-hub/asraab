// End-to-end check of the Chromium-carried download path: a real chunked download over
// ChromiumConnection, forced through the same IPC the UI uses. Dev check only.
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs'
import http from 'node:http'
import { _electron as electron } from 'playwright'

const SIZE = 2 * 1024 * 1024
const payload = Buffer.alloc(SIZE)
for (let i = 0; i < SIZE; i += 1) payload[i] = i % 251
const digest = createHash('sha256').update(payload).digest('hex')

const server = http.createServer((req, res) => {
  const ua = req.headers['user-agent'] ?? ''
  if (!/Mozilla\/5\.0/.test(ua)) {
    res.writeHead(403)
    res.end('denied')
    return
  }
  const match = req.headers.range?.match(/bytes=(\d+)-(\d*)/)
  if (match) {
    const start = Number(match[1])
    const end = match[2] ? Number(match[2]) : SIZE - 1
    res.writeHead(206, {
      'Content-Type': 'application/octet-stream',
      'Content-Length': end - start + 1,
      'Content-Range': `bytes ${start}-${end}/${SIZE}`,
      'Accept-Ranges': 'bytes'
    })
    res.end(payload.subarray(start, end + 1))
    return
  }
  res.writeHead(200, {
    'Content-Type': 'application/octet-stream',
    'Content-Length': SIZE,
    'Accept-Ranges': 'bytes'
  })
  res.end(payload)
})
await new Promise((resolve) => server.listen(8972, '127.0.0.1', resolve))

const dest = 'C:\\Users\\Lenovo\\AppData\\Local\\Temp\\majra-chromium-test'
rmSync(dest, { recursive: true, force: true })
mkdirSync(dest, { recursive: true })

const app = await electron.launch({
  executablePath: 'C:\\Users\\Lenovo\\Downloads\\majra\\dist\\win-unpacked\\majra.exe',
  args: ['--user-data-dir=C:\\Users\\Lenovo\\AppData\\Local\\Temp\\majra-dl-check']
})
const win = await app.firstWindow()
await win.waitForTimeout(2200)

const started = await win.evaluate(
  async ({ dest }) => {
    const interfaces = await window.plexo.listInterfaces()
    const id = await window.plexo.startDownload({
      kind: 'http',
      url: 'http://127.0.0.1:8972/file.bin',
      destinationDir: dest,
      suggestedFileName: 'chromium-test.bin',
      totalBytes: 2 * 1024 * 1024,
      supportsRanges: true,
      interfaceIds: [interfaces.find((entry) => entry.kind === 'wifi')?.id ?? interfaces[0].id],
      etag: null,
      lastModified: null,
      transport: 'chromium'
    })
    return { id, interfaceIds: interfaces.map((entry) => entry.id) }
  },
  { dest }
)
console.log('started:', JSON.stringify(started))

let state = null
for (let i = 0; i < 40; i += 1) {
  await win.waitForTimeout(500)
  state = await win.evaluate(async (id) => {
    const list = await window.plexo.listDownloads()
    const found = list.find((entry) => (entry.state?.id ?? entry.id) === id)
    if (!found) return null
    const state = found.state ?? found
    return { status: state.status, bytes: state.bytesDownloaded, error: state.error }
  }, started.id)
  if (state && (state.status === 'completed' || state.status === 'error')) break
}
console.log(
  'status:',
  state?.status,
  '| bytes:',
  state?.bytesDownloaded,
  '| error:',
  state?.error ?? '-'
)

const file = `${dest}\\chromium-test.bin`
await win.waitForTimeout(800)
await app.close()
server.close()

if (existsSync(file)) {
  const actual = createHash('sha256').update(readFileSync(file)).digest('hex')
  console.log('file exists | size:', readFileSync(file).length, '| sha matches:', actual === digest)
} else {
  console.log('file missing')
}
