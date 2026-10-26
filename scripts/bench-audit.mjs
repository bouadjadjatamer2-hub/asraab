/* Release audit benchmark: drives the real app through the same `window.plexo` API the window
 * uses, against either a local range server or a public URL, and records throughput, CPU, RAM
 * and (optionally) a pause/resume or streaming-extraction run.
 *
 * Dev-only. Example:
 *   node scripts/bench-audit.mjs --local 512 --label local-512
 *   node scripts/bench-audit.mjs --url https://proof.ovh.net/files/1Gb.dat --runs 3
 *   node scripts/bench-audit.mjs --local 256 --zip --label zip-stream
 *   node scripts/bench-audit.mjs --local 256 --pause --label pause
 */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { _electron as electron } from 'playwright'
import { createHash, randomFillSync } from 'node:crypto'
import { createServer } from 'node:http'
import { mkdir, mkdtemp, open, readdir, rm, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const argv = process.argv.slice(2)
const flag = (name) => argv.includes(`--${name}`)
const value = (name, fallback = null) => {
  const index = argv.indexOf(`--${name}`)
  return index >= 0 && argv[index + 1] ? argv[index + 1] : fallback
}

const MiB = 1024 * 1024
const localMiB = Number(value('local', '0'))
const runs = Number(value('runs', '1'))
const label = value('label', localMiB ? `local-${localMiB}` : 'remote')
const streams = Number(value('streams', '0'))
const throttle = Number(value('throttle', '0')) // MiB/s per connection
const outPath = value('out', null)

const work = await mkdtemp(join(tmpdir(), 'majra-bench-'))
const profile = join(work, 'profile')
await mkdir(profile, { recursive: true })

// --- content (local mode) ---------------------------------------------------------------------
function crc32(buffer) {
  let crc = 0xffffffff
  for (let i = 0; i < buffer.length; i++) {
    crc ^= buffer[i]
    for (let bit = 0; bit < 8; bit++) crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1
  }
  return (crc ^ 0xffffffff) >>> 0
}

/** A ZIP with one stored (uncompressed) entry, so extraction cost is real I/O, not inflate. */
function storedZip(name, data) {
  const nameBytes = Buffer.from(name, 'utf8')
  const crc = crc32(data)
  const local = Buffer.alloc(30)
  local.writeUInt32LE(0x04034b50, 0)
  local.writeUInt16LE(20, 4)
  local.writeUInt16LE(0, 6)
  local.writeUInt16LE(0, 8) // stored
  local.writeUInt16LE(0, 10)
  local.writeUInt16LE(0, 12)
  local.writeUInt32LE(crc, 14)
  local.writeUInt32LE(data.length, 18)
  local.writeUInt32LE(data.length, 22)
  local.writeUInt16LE(nameBytes.length, 26)
  local.writeUInt16LE(0, 28)
  const central = Buffer.alloc(46)
  central.writeUInt32LE(0x02014b50, 0)
  central.writeUInt16LE(20, 4)
  central.writeUInt16LE(20, 6)
  central.writeUInt16LE(0, 8)
  central.writeUInt16LE(0, 10)
  central.writeUInt16LE(0, 12)
  central.writeUInt16LE(0, 14)
  central.writeUInt32LE(crc, 16)
  central.writeUInt32LE(data.length, 20)
  central.writeUInt32LE(data.length, 24)
  central.writeUInt16LE(nameBytes.length, 28)
  central.writeUInt16LE(0, 30)
  central.writeUInt16LE(0, 32)
  central.writeUInt16LE(0, 34)
  central.writeUInt16LE(0, 36)
  central.writeUInt32LE(0, 38)
  central.writeUInt32LE(0, 42)
  const offset = local.length + nameBytes.length + data.length
  const end = Buffer.alloc(22)
  end.writeUInt32LE(0x06054b50, 0)
  end.writeUInt16LE(0, 4)
  end.writeUInt16LE(0, 6)
  end.writeUInt16LE(1, 8)
  end.writeUInt16LE(1, 10)
  end.writeUInt32LE(central.length + nameBytes.length, 12)
  end.writeUInt32LE(offset, 16)
  end.writeUInt16LE(0, 20)
  return Buffer.concat([local, nameBytes, data, central, nameBytes, end])
}

let content = null
let sha = null
let suffix = '.bin'
if (localMiB) {
  if (flag('zip')) {
    // Random, incompressible bytes in a stored ZIP: unpacking is pure write throughput.
    const payload = Buffer.alloc(localMiB * MiB)
    const block = randomFillSync(Buffer.alloc(4 * MiB))
    for (let offset = 0; offset < payload.length; offset += block.length) {
      block.copy(payload, offset, 0, Math.min(block.length, payload.length - offset))
    }
    content = storedZip('payload.bin', payload)
    sha = createHash('sha256').update(payload).digest('hex')
    suffix = '.zip'
  } else {
    content = Buffer.alloc(localMiB * MiB)
    const block = randomFillSync(Buffer.alloc(4 * MiB))
    for (let offset = 0; offset < content.length; offset += block.length) {
      block.copy(content, offset, 0, Math.min(block.length, content.length - offset))
    }
    sha = createHash('sha256').update(content).digest('hex')
  }
}

// --- origin -----------------------------------------------------------------------------------
const origin = content
  ? createServer(async (req, res) => {
      if (req.method === 'HEAD') {
        res.writeHead(200, {
          'Content-Length': String(content.length),
          'Accept-Ranges': 'bytes',
          'Content-Type': 'application/octet-stream',
          ETag: '"bench-v1"',
          'Last-Modified': new Date(0).toUTCString()
        })
        res.end()
        return
      }
      const range = /^bytes=(\d+)-(\d*)$/.exec(req.headers.range ?? '')
      const start = range ? Number(range[1]) : 0
      const end = range
        ? range[2]
          ? Math.min(Number(range[2]), content.length - 1)
          : content.length - 1
        : content.length - 1
      const headers = {
        'Content-Type': 'application/octet-stream',
        'Accept-Ranges': 'bytes',
        'Content-Length': String(end - start + 1),
        ETag: '"bench-v1"',
        'Last-Modified': new Date(0).toUTCString()
      }
      if (range) headers['Content-Range'] = `bytes ${start}-${end}/${content.length}`
      res.writeHead(range ? 206 : 200, headers)
      let position = start
      const chunk = 256 * 1024
      const pace = throttle ? (chunk / (throttle * MiB)) * 1000 : 0 // ms per chunk
      while (position <= end) {
        // Closing the tab or the download destroys the response; stop pumping rather than keep
        // pushing bytes into a dead socket.
        if (res.destroyed) return
        const size = Math.min(chunk, end - position + 1)
        const piece = content.subarray(position, position + size)
        position += size
        if (!res.write(piece)) {
          await new Promise((resolve) => {
            const done = () => {
              res.off('drain', done)
              res.off('close', done)
              resolve()
            }
            res.on('drain', done)
            res.on('close', done)
          })
        } else {
          // Yield after every accepted chunk so eight connections interleave in the event loop.
          await new Promise((resolve) => setImmediate(resolve))
        }
        if (pace) await new Promise((resolve) => setTimeout(resolve, pace))
      }
      res.end()
    })
  : null

let originUrl = null
if (origin) {
  await new Promise((resolve) => origin.listen(0, '127.0.0.1', resolve))
  const port = origin.address().port
  originUrl = `http://127.0.0.1:${port}/payload${suffix}`
}

const url = value('url', originUrl)
if (!url) throw new Error('pass --url, or --local <MiB> for the built-in server')

// --- app --------------------------------------------------------------------------------------
const app = await electron.launch({
  args: ['.'],
  cwd: process.cwd(),
  env: {
    ...process.env,
    PLEXO_USER_DATA: profile,
    // The built-in origin answers on loopback; binding a real adapter's address to it would
    // leave every stream retrying, so the local mode pretends one loopback network.
    ...(origin ? { PLEXO_E2E_INTERFACES: 'Wi-Fi=127.0.0.1' } : {}),
    ...(flag('hdd') ? { PLEXO_E2E_DISK: 'hdd' } : {})
  }
})
const page = await app.firstWindow()
await page.waitForLoadState('domcontentloaded')
await page.waitForTimeout(1200)

const api = (method, ...args) =>
  page.evaluate(([name, params]) => window.plexo[name](...params), [method, args])

const interfaces = await api('listInterfaces')
const interfaceIds = interfaces.map((entry) => entry.id)
console.log(
  `origin ${url}\ninterfaces ${JSON.stringify(interfaces.map((i) => `${i.id}:${i.kind}`))}`
)

const probe = await api('probeUrl', url)
console.log(
  `probe kind=${probe.kind} size=${probe.totalBytes} ranges=${probe.supportsRanges} name=${probe.suggestedFileName}`
)

async function metrics() {
  const rows = await app.evaluate(({ app }) => app.getAppMetrics())
  let cpu = 0
  let memory = 0
  for (const row of rows) {
    cpu += row.cpu?.percentCPUUsage ?? 0
    memory += row.memory?.workingSetSize ?? 0
  }
  return { cpu, memoryMB: memory / 1024 }
}

async function waitFor(id, timeoutMs = 30 * 60_000) {
  const deadline = Date.now() + timeoutMs
  const samples = []
  let state = null
  let lastLog = 0
  while (Date.now() < deadline) {
    const list = await api('listDownloads')
    const live = list.find((entry) => entry.state.id === id)?.state
    if (live) state = live
    // A finished download leaves the live list for the history list; read that before giving up.
    if (!live) {
      const history = await api('listHistory')
      const done = history.find((entry) => entry.id === id)
      if (done) {
        state = { ...done, kind: done.kind ?? 'http', streams: [], networks: done.networks ?? [] }
        samples.push({ at: Date.now(), bytes: done.bytesDownloaded, ...(await metrics()) })
        return { state, samples }
      }
    }
    if (!state) throw new Error('the download disappeared from the list')
    if (Date.now() - lastLog > 4000) {
      lastLog = Date.now()
      const streams =
        state.kind === 'http'
          ? state.streams.map((s) => `${s.status}@${s.bytesDownloaded}`).join(' ')
          : '-'
      console.log(
        `poll ${state.status} ${state.bytesDownloaded}/${state.totalBytes} speed=${state.speedBytesPerSec} disk=${state.diskLimited ?? false} err=${state.error ?? '-'} streams=${streams}`
      )
    }
    samples.push({ at: Date.now(), bytes: state.bytesDownloaded, ...(await metrics()) })
    if (state.status === 'completed' || state.status === 'error' || state.status === 'cancelled') {
      return { state, samples }
    }
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  throw new Error(
    `timed out; last status ${state?.status} ${state?.bytesDownloaded}/${state?.totalBytes}`
  )
}

function summarise(samples) {
  const cpu = samples.map((s) => s.cpu)
  const mem = samples.map((s) => s.memoryMB)
  const avg = (list) => list.reduce((sum, n) => sum + n, 0) / Math.max(1, list.length)
  return {
    cpuAvg: Number(avg(cpu).toFixed(1)),
    cpuPeak: Number(Math.max(...cpu).toFixed(1)),
    ramAvgMB: Number(avg(mem).toFixed(0)),
    ramPeakMB: Number(Math.max(...mem).toFixed(0))
  }
}

const report = []
for (let run = 1; run <= runs; run++) {
  const dest = join(work, `dest-${run}-${label}`)
  await mkdir(dest, { recursive: true })
  const request = {
    kind: 'http',
    url: probe.finalUrl,
    destinationDir: dest,
    suggestedFileName: probe.suggestedFileName,
    totalBytes: probe.totalBytes ?? 0,
    supportsRanges: probe.supportsRanges,
    interfaceIds: probe.supportsRanges ? interfaceIds : interfaceIds.slice(0, 1),
    etag: probe.etag,
    lastModified: probe.lastModified,
    ...(streams ? { streamsPerNetwork: streams } : {}),
    ...(flag('zip') ? { streamExtract: { format: 'zip' } } : {})
  }

  const started = Date.now()
  const id = await api('startDownload', request)

  let pausedAt = null
  let pausedBytes = null
  let pauseWaitSeconds = 0
  if (flag('pause')) {
    while (Date.now() - started < 15 * 60_000) {
      const list = await api('listDownloads')
      const state = list.find((entry) => entry.state.id === id)?.state
      if (!state) throw new Error('the download disappeared before it could be paused')
      if (state.status === 'completed') break
      // Pause once a third of the bytes are in, then give it two seconds to settle.
      if (state.totalBytes > 0 && state.bytesDownloaded >= state.totalBytes * 0.3) {
        await api('pauseDownload', id)
        await new Promise((resolve) => setTimeout(resolve, 500))
        const pausedState = (await api('listDownloads')).find(
          (entry) => entry.state.id === id
        )?.state
        pausedAt = Date.now()
        pausedBytes = pausedState?.bytesDownloaded ?? state.bytesDownloaded
        await new Promise((resolve) => setTimeout(resolve, 2000))
        pauseWaitSeconds = 2
        await api('resumeDownload', id)
        break
      }
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
  }

  const { state, samples } = await waitFor(id)
  const elapsed = (Date.now() - started) / 1000
  const completed = state.status === 'completed'
  const bytes = state.bytesDownloaded
  // The app stamps its own start and finish; that is the transfer time the user experienced,
  // without the benchmark's polling jitter.
  const appSeconds =
    completed && state.completedAt && state.startedAt
      ? (state.completedAt - state.startedAt) / 1000
      : null
  const activeSeconds = pausedAt
    ? (appSeconds ?? elapsed) - pauseWaitSeconds
    : (appSeconds ?? elapsed)
  const row = {
    label,
    run,
    ok: completed,
    status: state.status,
    error: state.error,
    bytes,
    totalBytes: state.totalBytes,
    seconds: Number(elapsed.toFixed(2)),
    activeSeconds: Number(activeSeconds.toFixed(2)),
    averageMBps: Number((bytes / MiB / (appSeconds ?? elapsed)).toFixed(2)),
    activeMBps: Number((bytes / MiB / activeSeconds).toFixed(2)),
    peakMBps: state.peakSpeedBytesPerSec
      ? Number((state.peakSpeedBytesPerSec / MiB).toFixed(2))
      : null,
    peakStreams: state.peakStreams,
    streams: state.kind === 'http' ? state.streams.length : null,
    ...summarise(samples),
    ...(flag('pause')
      ? { pausedAtSeconds: pausedAt ? (pausedAt - started) / 1000 : null, pausedBytes }
      : {})
  }

  // Verify the bytes on disk: size always, hash for local content.
  try {
    if (flag('zip')) {
      const entries = await readdir(state.destinationPath)
      const file = join(state.destinationPath, 'payload.bin')
      const info = await stat(file)
      row.extracted = { entries, bytes: info.size }
      if (sha && localMiB) {
        const handle = await open(file, 'r')
        const hash = createHash('sha256')
        for await (const chunk of handle.createReadStream()) hash.update(chunk)
        await handle.close()
        row.extracted.shaMatches = hash.digest('hex') === sha
      }
    } else {
      const info = await stat(state.destinationPath)
      row.fileBytes = info.size
      if ((sha && localMiB) || flag('keep')) {
        const handle = await open(state.destinationPath, 'r')
        const hash = createHash('sha256')
        for await (const chunk of handle.createReadStream()) hash.update(chunk)
        await handle.close()
        const digest = hash.digest('hex')
        // A remote run has no known hash; keep the digest so it can be compared with another
        // client's copy of the same URL (docs/verify step, or the IDM comparison).
        if (sha && localMiB) row.shaMatches = digest === sha
        if (flag('keep')) row.sha256 = digest
      }
    }
  } catch (error) {
    row.verifyError = String(error)
  }

  console.log(JSON.stringify(row))
  report.push(row)
  if (!flag('keep')) {
    await api('removeDownload', id, { trashFile: true }).catch(() => {})
    await rm(dest, { recursive: true, force: true }).catch(() => {})
  }
}

await app.close()
if (origin) await new Promise((resolve) => origin.close(resolve))

if (outPath) {
  const { writeFile } = await import('node:fs/promises')
  await writeFile(outPath, JSON.stringify(report, null, 2))
  console.log(`report ${outPath}`)
}

if (!flag('keep')) await rm(work, { recursive: true, force: true }).catch(() => {})
