/* Docs capture: renders the local marketing site in Chromium and writes the screenshots README
 * and the app page use, plus the Open Graph card. Dev-only.
 *
 *   node scripts/capture-docs.mjs
 *
 * Chromium's own screenshot path is used instead of BrowserWindow.capturePage: an offscreen
 * Electron window can fail with UnknownVizError on this machine, and the site is plain HTML.
 */
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join } from 'node:path'
import { chromium } from 'playwright'

const root = process.cwd()
const docs = join(root, 'docs')
const shots = join(docs, 'screenshots')

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'text/xml; charset=utf-8'
}

const ogHtml = `<!doctype html><html lang="en"><head><meta charset="utf-8" />
<style>
  @font-face{font-family:'Manrope';src:url('/assets/fonts/Manrope-Variable.woff2') format('woff2');font-weight:200 800}
  @font-face{font-family:'PlexAr';src:url('/assets/fonts/IBMPlexSansArabic-700.woff2') format('woff2');font-weight:700}
  *{margin:0;box-sizing:border-box}
  body{width:1200px;height:630px;overflow:hidden;background:#0b0f0c;color:#f4efe6;font-family:Manrope,sans-serif}
  .card{position:relative;width:100%;height:100%;padding:64px 68px;display:flex;gap:48px;align-items:center;
    background:
      radial-gradient(720px 420px at 88% 12%, rgba(214,132,42,.22), transparent 70%),
      radial-gradient(640px 500px at 6% 96%, rgba(20,120,110,.18), transparent 72%),
      linear-gradient(150deg,#111611 0%,#0b0f0c 60%,#0a0d0b 100%)}
  .grid{position:absolute;inset:0;opacity:.24;background-image:linear-gradient(rgba(255,255,255,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.05) 1px,transparent 1px);background-size:56px 56px;mask-image:radial-gradient(80% 70% at 50% 40%,#000 30%,transparent 100%)}
  .left{position:relative;flex:1.15;min-width:0}
  .brand{display:flex;align-items:center;gap:14px;margin-bottom:38px}
  .brand img{width:52px;height:52px;border-radius:13px;box-shadow:0 16px 34px -20px rgba(224,148,52,.9)}
  .brand b{font-size:26px;letter-spacing:.28em;font-weight:800}
  h1{font-size:74px;line-height:.98;letter-spacing:-.035em;font-weight:800}
  h1 span{display:block;color:#e3a45c}
  .ar{font-family:'PlexAr',sans-serif;font-size:34px;margin-top:26px;color:#cfc6b6;direction:rtl}
  .sub{margin-top:18px;font-size:19px;color:#9fae9f;letter-spacing:.01em}
  .right{position:relative;width:392px;flex:none}
  .win{border-radius:18px;border:1px solid rgba(255,255,255,.1);background:linear-gradient(160deg,#171d18,#0e1310);box-shadow:0 40px 80px -40px #000;overflow:hidden}
  .bar{display:flex;align-items:center;gap:9px;padding:14px 16px;border-bottom:1px solid rgba(255,255,255,.07);font-size:11px;letter-spacing:.16em;color:#cfc6b6}
  .bar i{width:11px;height:11px;border-radius:3px;background:linear-gradient(150deg,#f0b16a,#b66416)}
  .body{padding:20px 18px 22px}
  .file{display:flex;align-items:center;gap:12px}
  .file .zip{width:40px;height:40px;border-radius:9px;border:1px solid rgba(255,255,255,.12);display:grid;place-items:center;font-size:10px;letter-spacing:.08em;color:#cfc6b6;background:#151b16}
  .name{font-size:15px;font-weight:700}
  .meta{font-size:11.5px;color:#9fae9f;margin-top:3px}
  .speed{display:flex;align-items:baseline;gap:8px;margin-top:22px}
  .speed b{font-size:40px;letter-spacing:-.03em;color:#e3a45c;font-weight:800}
  .speed span{font-size:12px;color:#9fae9f}
  .track{height:8px;border-radius:999px;background:#222a22;margin-top:16px;overflow:hidden}
  .track i{display:block;height:100%;width:72%;border-radius:999px;background:linear-gradient(90deg,#c9791f,#f0b16a)}
  .net{display:flex;align-items:center;justify-content:space-between;margin-top:14px;font-size:11.5px;color:#9fae9f}
  .dots{display:flex;gap:7px}
  .dots i{width:9px;height:9px;border-radius:999px;display:block}
  .foot{display:flex;align-items:center;justify-content:space-between;margin-top:18px;font-size:11px;letter-spacing:.12em;color:#8d9a8d}
</style></head><body>
<div class="card">
  <div class="grid"></div>
  <div class="left">
    <div class="brand"><img src="/assets/img/majra-icon.png" alt="" /><b>MAJRA</b></div>
    <h1>Every link<span>lands here.</span></h1>
    <div class="ar">كل رابط يهبط هنا.</div>
    <div class="sub">One download, every network at once. Free and open source for Windows.</div>
  </div>
  <div class="right">
    <div class="win">
      <div class="bar"><i></i> MAJRA · TRANSFERRING</div>
      <div class="body">
        <div class="file"><div class="zip">ZIP</div><div><div class="name">project-assets.zip</div><div class="meta">178.7 MB of 640.0 MB · 28% · 18s left</div></div></div>
        <div class="speed"><b>27.1</b><span>MB/s combined</span></div>
        <div class="track"><i></i></div>
        <div class="net"><span>Wi-Fi · USB tethering · Ethernet</span><span class="dots"><i style="background:#2ea67a"></i><i style="background:#d99a3a"></i><i style="background:#4b8fd2"></i></span></div>
      </div>
    </div>
    <div class="foot"><span>WINDOWS 10 / 11 · 64-BIT</span><span>FREE · OPEN SOURCE</span></div>
  </div>
</div></body></html>`

const server = createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://x').pathname)
    if (pathname === '/__og') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
      res.end(ogHtml)
      return
    }
    let file = join(docs, pathname)
    if (pathname.endsWith('/')) file = join(file, 'index.html')
    const body = await readFile(file)
    res.writeHead(200, { 'Content-Type': MIME[extname(file)] ?? 'application/octet-stream' })
    res.end(body)
  } catch {
    res.writeHead(404).end()
  }
})

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function settle(page) {
  await page.evaluate(() => document.fonts.ready)
  await page.addStyleTag({
    content:
      '*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}html{scroll-behavior:auto!important}'
  })
  await wait(450)
}

await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
const origin = `http://127.0.0.1:${server.address().port}`

const browser = await chromium.launch({ headless: true })
const consoleErrors = []

async function shotOf({ path: target, width, height, theme, lang, scrollTo, offset = 0, name }) {
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 })
  await context.addInitScript(
    ([chosenTheme, chosenLang]) => {
      localStorage.setItem('asraab-theme', chosenTheme)
      localStorage.setItem('asraab-lang', chosenLang)
      localStorage.setItem('majra-theme', chosenTheme)
      localStorage.setItem('majra-lang', chosenLang)
    },
    [theme, lang]
  )
  const page = await context.newPage()
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(`${name}: ${message.text()}`)
  })
  await page.goto(origin + target, { waitUntil: 'load' })
  await settle(page)
  if (scrollTo) {
    await page.evaluate(
      ([selector, gap]) => {
        const el = document.querySelector(selector)
        if (el) window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - gap)
      },
      [scrollTo, offset]
    )
    await wait(400)
  }
  await page.screenshot({ path: join(shots, name) })
  console.log('shot', name, width, height)
  await context.close()
}

const siteShots = [
  {
    name: 'website-desktop.png',
    path: '/index.html',
    width: 1600,
    height: 1000,
    theme: 'dark',
    lang: 'en'
  },
  {
    name: 'website-arabic.png',
    path: '/apps/majra/index.html',
    width: 1600,
    height: 1000,
    theme: 'light',
    lang: 'ar'
  },
  {
    name: 'website-download.png',
    path: '/apps/majra/index.html',
    width: 1600,
    height: 1000,
    theme: 'dark',
    lang: 'en',
    scrollTo: '#download',
    offset: 92
  },
  {
    name: 'website-mobile.png',
    path: '/index.html',
    width: 390,
    height: 844,
    theme: 'dark',
    lang: 'en'
  }
]

for (const shot of siteShots) await shotOf(shot)

const og = await browser.newContext({ viewport: { width: 1200, height: 630 } })
const ogPage = await og.newPage()
await ogPage.goto(`${origin}/__og`, { waitUntil: 'load' })
await settle(ogPage)
await ogPage.screenshot({ path: join(docs, 'og.png') })
console.log('shot og.png 1200 630')
await og.close()

await browser.close()
server.close()
for (const error of consoleErrors) console.log('console error:', error)
