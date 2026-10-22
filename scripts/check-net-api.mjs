// Inspects what Electron's net module actually exposes, so the Chromium fallback can imitate the
// Node http surface the downloader already uses. Dev check only.
import { _electron as electron } from 'playwright'

const app = await electron.launch({
  executablePath: 'C:\\Users\\Lenovo\\Downloads\\tayyar\\dist\\win-unpacked\\tayyar.exe',
  args: ['--user-data-dir=C:\\Users\\Lenovo\\AppData\\Local\\Temp\\tayyar-stack-check']
})
await app.firstWindow()
const report = await app.evaluate(async ({ net }) => {
  const probe = async (url, headers, redirect) =>
    new Promise((resolve) => {
      const out = { url }
      const request = net.request({ method: 'GET', url, redirect })
      for (const [key, value] of Object.entries(headers)) request.setHeader(key, value)
      out.reqApi = {
        abort: typeof request.abort,
        destroy: typeof request.destroy,
        on: typeof request.on,
        end: typeof request.end,
        setHeader: typeof request.setHeader
      }
      request.on('response', (response) => {
        out.status = response.statusCode
        out.location = response.headers.location
        out.resApi = {
          resume: typeof response.resume,
          pause: typeof response.pause,
          destroy: typeof response.destroy,
          pipe: typeof response.pipe,
          setTimeout: typeof response.setTimeout,
          on: typeof response.on,
          isPaused: typeof response.isPaused
        }
        let bytes = 0
        const timer = setTimeout(() => {
          response.destroy()
          resolve(out)
        }, 1500)
        response.on('data', (chunk) => {
          bytes += chunk.length
        })
        response.on('end', () => {
          clearTimeout(timer)
          out.bytes = bytes
          resolve(out)
        })
        response.on('aborted', () => {
          out.aborted = true
        })
        response.on('error', (error) => {
          out.resError = String(error)
        })
      })
      request.on('error', (error) => resolve({ ...out, reqError: String(error) }))
      request.end()
    })

  const ranged = await probe(
    'https://proof.ovh.net/files/10Mb.dat',
    { Range: 'bytes=0-999', 'User-Agent': 'Mozilla/5.0 Chrome/142.0.0.0' },
    'manual'
  )
  const redirected = await probe('http://proof.ovh.net/files/10Mb.dat', {}, 'manual')
  const followed = await probe('http://proof.ovh.net/files/10Mb.dat', { Range: 'bytes=0-99' }, 'follow')
  return { ranged, redirected, followed }
})
console.log(JSON.stringify(report, null, 2))
await app.close()
