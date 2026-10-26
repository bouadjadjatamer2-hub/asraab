// Compares the app's Node HTTP client with Chromium's own network stack on a Cloudflare-guarded
// page. Dev check only.
import https from 'node:https'
import { _electron as electron } from 'playwright'

const URL_UNDER_TEST = 'https://ankergames.net/game/warhammer-40000-boltgun-2'
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36'
const headers = { 'User-Agent': UA, Accept: '*/*', Referer: 'https://ankergames.net/' }

const nodeStatus = await new Promise((resolve) => {
  const req = https.request(
    URL_UNDER_TEST,
    { headers: { ...headers, Range: 'bytes=0-1023' } },
    (res) => {
      resolve(res.statusCode)
      res.destroy()
    }
  )
  req.on('error', (error) => resolve(`err:${error.message}`))
  req.end()
})
console.log('node https status:', nodeStatus)

const app = await electron.launch({
  executablePath: 'C:\\Users\\Lenovo\\Downloads\\majra\\dist\\win-unpacked\\majra.exe',
  args: ['--user-data-dir=C:\\Users\\Lenovo\\AppData\\Local\\Temp\\majra-stack-check']
})
await app.firstWindow()
const result = await app.evaluate(
  async ({ net }, { url, headers }) => {
    return new Promise((resolve) => {
      const request = net.request({ method: 'GET', url, redirect: 'follow' })
      for (const [key, value] of Object.entries(headers)) request.setHeader(key, value)
      request.setHeader('Range', 'bytes=0-1023')
      request.on('response', (response) => {
        resolve({
          status: response.statusCode,
          type: response.headers['content-type'],
          ua: response.headers['server']
        })
        response.destroy()
      })
      request.on('error', (error) => resolve({ status: `err:${error.message}` }))
      request.end()
    })
  },
  { url: URL_UNDER_TEST, headers }
)
console.log('chromium net:', JSON.stringify(result))
await app.close()
