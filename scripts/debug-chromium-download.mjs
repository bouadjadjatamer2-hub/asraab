// Debug run: starts a forced-Chromium download and watches what the manager reports. Dev only.
import { mkdirSync, rmSync } from 'node:fs'
import http from 'node:http'
import { _electron as electron } from 'playwright'

const SIZE = 2 * 1024 * 1024
const payload = Buffer.alloc(SIZE, 9)
const server = http.createServer((req, res) => {
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
await new Promise((resolve) => server.listen(8973, '127.0.0.1', resolve))

const dest = 'C:\\Users\\Lenovo\\AppData\\Local\\Temp\\majra-chromium-test2'
rmSync(dest, { recursive: true, force: true })
mkdirSync(dest, { recursive: true })

const app = await electron.launch({
  executablePath: 'C:\\Users\\Lenovo\\Downloads\\majra\\dist\\win-unpacked\\majra.exe',
  args: ['--user-data-dir=C:\\Users\\Lenovo\\AppData\\Local\\Temp\\majra-dl-check2']
})
app.process().stderr?.on('data', (chunk) => console.log('main stderr:', String(chunk).trim()))
app.process().stdout?.on('data', (chunk) => console.log('main stdout:', String(chunk).trim()))
const win = await app.firstWindow()
win.on('console', (message) =>
  console.log('renderer:', message.type(), message.text().slice(0, 300))
)
await win.waitForTimeout(2200)

const started = await win.evaluate(
  async ({ dest }) => {
    const interfaces = await window.plexo.listInterfaces()
    const id = await window.plexo.startDownload({
      kind: 'http',
      url: 'http://127.0.0.1:8973/file.bin',
      destinationDir: dest,
      suggestedFileName: 'chromium-test.bin',
      totalBytes: 2 * 1024 * 1024,
      supportsRanges: true,
      interfaceIds: [interfaces[0].id],
      etag: null,
      lastModified: null,
      transport: 'chromium'
    })
    return { id, interfaces }
  },
  { dest }
)
console.log('started:', JSON.stringify(started).slice(0, 400))

for (const wait of [500, 1000, 2000, 4000]) {
  await win.waitForTimeout(wait)
  const snapshot = await win.evaluate(async () => {
    const downloadList = await window.plexo.listDownloads()
    const history = await window.plexo.listHistory()
    return {
      downloads: downloadList.map((entry) => {
        const state = entry.state ?? entry
        return {
          id: state.id,
          status: state.status,
          bytes: state.bytesDownloaded,
          error: state.error
        }
      }),
      history: history
        .slice(0, 3)
        .map((entry) => ({ id: entry.id, status: entry.status, name: entry.fileName }))
    }
  })
  console.log(`after ${wait}ms:`, JSON.stringify(snapshot).slice(0, 700))
}

await app.close()
server.close()
