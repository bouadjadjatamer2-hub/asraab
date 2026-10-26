// Verifies that a server which refuses a non-browser client (like AnkerGames/Cloudflare does)
// is accepted, because the download engine now identifies itself as Chrome. Dev check only.
import http from 'node:http'
import { _electron as electron } from 'playwright'

const payload = Buffer.alloc(512 * 1024, 7)
const server = http.createServer((req, res) => {
  const ua = req.headers['user-agent'] ?? ''
  const browser = /Mozilla\/5\.0/.test(ua) && /Chrome\//.test(ua)
  console.log('request', req.method, 'ua-browser:', browser, 'range:', req.headers.range ?? '-')
  if (!browser) {
    res.writeHead(403, { 'Content-Type': 'text/plain' })
    res.end('denied')
    return
  }
  const range = req.headers.range?.match(/bytes=(\d+)-(\d*)/)
  if (range) {
    const start = Number(range[1])
    const end = range[2] ? Number(range[2]) : payload.length - 1
    res.writeHead(206, {
      'Content-Type': 'application/octet-stream',
      'Content-Length': end - start + 1,
      'Content-Range': `bytes ${start}-${end}/${payload.length}`,
      'Accept-Ranges': 'bytes'
    })
    res.end(payload.subarray(start, end + 1))
    return
  }
  res.writeHead(200, {
    'Content-Type': 'application/octet-stream',
    'Content-Length': payload.length,
    'Content-Disposition': 'attachment; filename="ua-test.bin"',
    'Accept-Ranges': 'bytes'
  })
  res.end(payload)
})

await new Promise((resolve) => server.listen(8971, '127.0.0.1', resolve))

const app = await electron.launch({
  executablePath: 'C:\\Users\\Lenovo\\Downloads\\majra\\dist\\win-unpacked\\majra.exe'
})
const win = await app.firstWindow()
await win.waitForTimeout(1800)
await win
  .getByRole('button', { name: /New download/ })
  .first()
  .click()
await win.waitForTimeout(500)
await win.getByPlaceholder(/Paste a link/).fill('http://127.0.0.1:8971/ua-test.bin')
await win.waitForTimeout(3000)
await win.screenshot({ path: 'C:\\Users\\Lenovo\\Downloads\\majra\\dist\\_ui-403check.png' })
const errorVisible = await win
  .getByText(/refused the request|denied access/i)
  .isVisible()
  .catch(() => false)
const download = win.getByRole('button', { name: 'Download', exact: true })
console.log('error visible:', errorVisible, '| download enabled:', await download.isEnabled())
await app.close()
server.close()
console.log('done')
