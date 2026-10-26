import { execFileSync } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { deflateRawSync, zstdCompressSync } from 'node:zlib'
import { isProbe } from './origin'
import { expect, expectHttp, makeDirs, PlexoApp, shaOfPath, test, treeSha } from './fixtures'

/** A ZIP holding a text file and a 300 KB binary one, the binary spanning reads. */
async function makeZip(root: string): Promise<{ archive: Buffer; a: Buffer; b: Buffer }> {
  const source = join(root, 'source')
  await mkdir(join(source, 'nested'), { recursive: true })
  const a = Buffer.from('hello from Majra\n')
  const b = randomBytes(300_000)
  await writeFile(join(source, 'a.txt'), a)
  await writeFile(join(source, 'nested', 'b.bin'), b)
  const archivePath = join(root, 'Archive.zip')
  execFileSync(
    'powershell.exe',
    [
      '-NoProfile',
      '-NonInteractive',
      '-Command',
      `Compress-Archive -LiteralPath '${source}\\a.txt','${source}\\nested' -DestinationPath '${archivePath}' -Force`
    ],
    { windowsHide: true }
  )
  return { archive: await readFile(archivePath), a, b }
}

/**
 * Unpacking while downloading: the archive never touches the destination, and a dropped
 * connection is resumed into the same unpacker rather than starting it over.
 */
test('unpacks a ZIP while downloading, across a dropped connection', async ({
  plexo,
  dirs,
  serve
}) => {
  const root = await mkdtemp(join(tmpdir(), 'majra-stream-'))
  try {
    const { archive, a, b } = await makeZip(root)
    const origin = await serve({ size: 1 })
    origin.setContent(archive, '"stream-v1"')
    await plexo.api.listInterfaces()
    // The first real transfer is cut after 64 KiB; the retry has to carry on where it stopped.
    let transfers = 0
    origin.setRule((request) => {
      if (isProbe(request.range)) return 'ok'
      transfers += 1
      return transfers === 1 ? { cutAfter: 64 * 1024 } : 'ok'
    })

    const id = await plexo.api.startDownload({
      kind: 'http',
      url: origin.url('/Archive.zip'),
      destinationDir: dirs.dest,
      suggestedFileName: 'Archive.zip',
      totalBytes: archive.length,
      supportsRanges: true,
      interfaceIds: ['a'],
      etag: '"stream-v1"',
      lastModified: null,
      streamExtract: { format: 'zip' }
    })
    plexo.tracked.set(id, {
      expectedSha: treeSha([
        { path: 'a.txt', data: a },
        { path: 'nested/b.bin', data: b }
      ]),
      destBefore: [],
      destinationDir: dirs.dest
    })

    const state = expectHttp(await plexo.waitForStatus('completed', 30_000))
    expect(state.fileName).toBe('Archive')
    expect(state.destinationPath).toBe(join(dirs.dest, 'Archive'))
    expect(state.bytesDownloaded).toBe(archive.length)
    expect(transfers).toBeGreaterThan(1)
    expect(await shaOfPath(state.destinationPath)).toBe(
      treeSha([
        { path: 'a.txt', data: a },
        { path: 'nested/b.bin', data: b }
      ])
    )
    expect(await readFile(join(state.destinationPath, 'nested', 'b.bin'))).toEqual(b)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

/** A ZIP smaller than one download block, holding one 1 KiB file: the same path a large archive
 * takes, with no size threshold anywhere in it. */
async function makeTinyZip(root: string): Promise<{ archive: Buffer; file: Buffer }> {
  const source = join(root, 'tiny-source')
  await mkdir(source, { recursive: true })
  const file = randomBytes(1024)
  await writeFile(join(source, 'tiny.bin'), file)
  const archivePath = join(root, 'Tiny.zip')
  execFileSync(
    'powershell.exe',
    [
      '-NoProfile',
      '-NonInteractive',
      '-Command',
      `Compress-Archive -LiteralPath '${join(source, 'tiny.bin')}' -DestinationPath '${archivePath}' -Force`
    ],
    { stdio: 'ignore' }
  )
  return { archive: await readFile(archivePath), file }
}

test('a tiny ZIP downloads and unpacks while downloading', async ({ plexo, dirs, serve }) => {
  const root = await mkdtemp(join(tmpdir(), 'majra-tiny-zip-'))
  try {
    const { archive, file } = await makeTinyZip(root)
    // Small enough that the plan would use one block even at the minimum block size.
    expect(archive.length).toBeLessThan(1024 * 1024)
    const origin = await serve({ size: 1 })
    origin.setContent(archive, '"tiny-zip-v1"')
    await plexo.api.listInterfaces()

    const id = await plexo.api.startDownload({
      kind: 'http',
      url: origin.url('/Tiny.zip'),
      destinationDir: dirs.dest,
      suggestedFileName: 'Tiny.zip',
      totalBytes: archive.length,
      supportsRanges: true,
      interfaceIds: ['a'],
      etag: '"tiny-zip-v1"',
      lastModified: null,
      streamExtract: { format: 'zip' }
    })
    plexo.tracked.set(id, {
      expectedSha: treeSha([{ path: 'tiny.bin', data: file }]),
      destBefore: [],
      destinationDir: dirs.dest
    })

    const state = expectHttp(await plexo.waitForStatus('completed', 30_000))
    expect(state.bytesDownloaded).toBe(archive.length)
    expect(state.destinationPath).toBe(join(dirs.dest, 'Tiny'))
    expect(await readFile(join(state.destinationPath, 'tiny.bin'))).toEqual(file)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

/** The dialog has to send the choice through, not only draw it. */
test('starts an unpacking download from the New download dialog', async ({ serve }) => {
  const root = await mkdtemp(join(tmpdir(), 'majra-dialog-'))
  const { dirs, dispose } = await makeDirs()
  let app: PlexoApp | null = null
  try {
    const { archive, a, b } = await makeZip(root)
    // The dialog's folder starts from the saved setting; nothing in the test should touch the
    // real Downloads folder.
    await writeFile(
      join(dirs.userData, 'app-settings.json'),
      JSON.stringify({ destinationDir: dirs.dest })
    )
    app = new PlexoApp(dirs, {})
    await app.launch()
    const origin = await serve({ size: 1 })
    origin.setContent(archive, '"dialog-v1"')
    // Opening the dialog fills the link from the clipboard when it can.
    await app.electronApp.evaluate(({ clipboard }) => clipboard.clear())

    const link = await app.newDownload()
    await link.fill(origin.url('/Archive.zip'))
    const unpack = app.page.getByRole('button', {
      name: 'Unpack while downloading',
      exact: true
    })
    await expect(unpack).toBeVisible({ timeout: 15_000 })
    await unpack.click()
    const start = app.page.getByRole('button', { name: 'Download', exact: true })
    await expect(start).toBeEnabled({ timeout: 15_000 })
    await start.click()

    const state = expectHttp(await app.waitForStatus('completed', 30_000))
    expect(state.fileName).toBe('Archive')
    expect(state.destinationPath).toBe(join(dirs.dest, 'Archive'))
    expect(await shaOfPath(state.destinationPath)).toBe(
      treeSha([
        { path: 'a.txt', data: a },
        { path: 'nested/b.bin', data: b }
      ])
    )
  } finally {
    if (app?.alive) await app.quit()
    await dispose()
    await rm(root, { recursive: true, force: true })
  }
})

/** A signed CDN link can hold its first body byte for longer than the mid-stream stall budget.
 * The download must wait that out rather than abort and start the archive over. */
test.describe('slow first byte', () => {
  // The ordinary stall budget (1.5 s in e2e) is shorter than the delay below; the first-byte
  // budget is what has to cover it.
  test.use({ appEnv: { PLEXO_E2E_FIRST_BYTE_MS: '6000' } })

  test('waits out a slow server before the archive starts', async ({ plexo, dirs, serve }) => {
    const root = await mkdtemp(join(tmpdir(), 'majra-slow-stream-'))
    try {
      const { archive, a, b } = await makeZip(root)
      const origin = await serve({ size: 1 })
      origin.setContent(archive, '"stream-slow-v1"')
      await plexo.api.listInterfaces()
      let transfers = 0
      origin.setRule((request) => {
        if (isProbe(request.range)) return 'ok'
        transfers += 1
        return transfers === 1 ? { delayBody: 3000 } : 'ok'
      })

      const id = await plexo.api.startDownload({
        kind: 'http',
        url: origin.url('/Archive.zip'),
        destinationDir: dirs.dest,
        suggestedFileName: 'Archive.zip',
        totalBytes: archive.length,
        supportsRanges: true,
        interfaceIds: ['a'],
        etag: '"stream-slow-v1"',
        lastModified: null,
        streamExtract: { format: 'zip' }
      })
      const expectedSha = treeSha([
        { path: 'a.txt', data: a },
        { path: 'nested/b.bin', data: b }
      ])
      plexo.tracked.set(id, {
        expectedSha,
        destBefore: [],
        destinationDir: dirs.dest
      })

      const state = expectHttp(await plexo.waitForStatus('completed', 30_000))
      expect(state.bytesDownloaded).toBe(archive.length)
      // One request for the one archive block: the delayed first attempt must survive, not be
      // thrown away and retried.
      expect(transfers).toBe(1)
      expect(state.networks.every((network) => network.retries === 0)).toBe(true)
      expect(await shaOfPath(state.destinationPath)).toBe(expectedSha)
    } finally {
      await rm(root, { recursive: true, force: true })
    }
  })
})

/** CRC-32 as ZIP stores it (unzipper doesn't check it, but an archive should be a real one). */
function crc32(data: Buffer): number {
  let crc = 0xffffffff
  for (const byte of data) {
    crc ^= byte
    for (let bit = 0; bit < 8; bit += 1) crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1
  }
  return (crc ^ 0xffffffff) >>> 0
}

/** A ZIP written by hand, so an entry can carry any compression method: Zstandard (93), which
 * 7-Zip writes by default and repack sites ship, or one that has no streaming reader (LZMA). */
function makeArchive(
  entries: readonly { name: string; data: Buffer; method: number }[]
): Buffer {
  const parts: Buffer[] = []
  const directory: Buffer[] = []
  let offset = 0
  for (const { name, data, method } of entries) {
    const path = Buffer.from(name, 'utf8')
    const payload =
      method === 93 ? zstdCompressSync(data) : method === 8 ? deflateRawSync(data) : data
    const crc = crc32(data)
    const local = Buffer.alloc(30)
    local.writeUInt32LE(0x04034b50, 0)
    local.writeUInt16LE(20, 4)
    local.writeUInt16LE(method, 8)
    local.writeUInt16LE(0x21, 12)
    local.writeUInt32LE(crc, 14)
    local.writeUInt32LE(payload.length, 18)
    local.writeUInt32LE(data.length, 22)
    local.writeUInt16LE(path.length, 26)
    parts.push(local, path, payload)

    const header = Buffer.alloc(46)
    header.writeUInt32LE(0x02014b50, 0)
    header.writeUInt16LE(20, 4)
    header.writeUInt16LE(20, 6)
    header.writeUInt16LE(method, 10)
    header.writeUInt16LE(0x21, 14)
    header.writeUInt32LE(crc, 16)
    header.writeUInt32LE(payload.length, 20)
    header.writeUInt32LE(data.length, 24)
    header.writeUInt16LE(path.length, 28)
    header.writeUInt32LE(offset, 42)
    directory.push(header, path)
    offset += local.length + path.length + payload.length
  }
  const central = Buffer.concat(directory)
  const end = Buffer.alloc(22)
  end.writeUInt32LE(0x06054b50, 0)
  end.writeUInt16LE(entries.length, 8)
  end.writeUInt16LE(entries.length, 10)
  end.writeUInt32LE(central.length, 12)
  end.writeUInt32LE(offset, 16)
  return Buffer.concat([...parts, central, end])
}

test('a ZIP compressed with Zstandard unpacks while downloading', async ({ plexo, dirs, serve }) => {
  const text = Buffer.from('hello from Majra\n')
  const binary = randomBytes(300_000)
  const archive = makeArchive([
    { name: 'a.txt', data: text, method: 93 },
    { name: 'nested/b.bin', data: binary, method: 93 }
  ])
  const origin = await serve({ size: 1 })
  origin.setContent(archive, '"zstd-v1"')
  await plexo.api.listInterfaces()

  const id = await plexo.api.startDownload({
    kind: 'http',
    url: origin.url('/Game.zip'),
    destinationDir: dirs.dest,
    suggestedFileName: 'Game.zip',
    totalBytes: archive.length,
    supportsRanges: true,
    interfaceIds: ['a'],
    etag: '"zstd-v1"',
    lastModified: null,
    streamExtract: { format: 'zip' }
  })
  const expected = [
    { path: 'a.txt', data: text },
    { path: 'nested/b.bin', data: binary }
  ]
  plexo.tracked.set(id, {
    expectedSha: treeSha(expected),
    destBefore: [],
    destinationDir: dirs.dest
  })

  const state = expectHttp(await plexo.waitForStatus('completed', 30_000))
  expect(state.bytesDownloaded).toBe(archive.length)
  expect(state.destinationPath).toBe(join(dirs.dest, 'Game'))
  expect(await shaOfPath(state.destinationPath)).toBe(treeSha(expected))
  expect(await readFile(join(state.destinationPath, 'nested', 'b.bin'))).toEqual(binary)
})

test('a cut connection resumes a Zstandard archive instead of unpacking it twice', async ({
  plexo,
  dirs,
  serve
}) => {
  const text = Buffer.from('hello from Majra\n')
  const binary = randomBytes(300_000)
  const archive = makeArchive([
    { name: 'a.txt', data: text, method: 93 },
    { name: 'nested/b.bin', data: binary, method: 93 }
  ])
  const origin = await serve({ size: 1 })
  origin.setContent(archive, '"zstd-cut-v1"')
  await plexo.api.listInterfaces()
  let transfers = 0
  origin.setRule((request) => {
    if (isProbe(request.range)) return 'ok'
    transfers += 1
    return transfers === 1 ? { cutAfter: 64 * 1024 } : 'ok'
  })

  const id = await plexo.api.startDownload({
    kind: 'http',
    url: origin.url('/Game.zip'),
    destinationDir: dirs.dest,
    suggestedFileName: 'Game.zip',
    totalBytes: archive.length,
    supportsRanges: true,
    interfaceIds: ['a'],
    etag: '"zstd-cut-v1"',
    lastModified: null,
    streamExtract: { format: 'zip' }
  })
  const expected = [
    { path: 'a.txt', data: text },
    { path: 'nested/b.bin', data: binary }
  ]
  plexo.tracked.set(id, {
    expectedSha: treeSha(expected),
    destBefore: [],
    destinationDir: dirs.dest
  })

  const state = expectHttp(await plexo.waitForStatus('completed', 30_000))
  expect(transfers).toBeGreaterThan(1)
  expect(state.bytesDownloaded).toBe(archive.length)
  expect(await shaOfPath(state.destinationPath)).toBe(treeSha(expected))
})

test('a compression it cannot stream is named, not reported as a broken stream', async ({
  plexo,
  dirs,
  serve
}) => {
  const archive = makeArchive([{ name: 'game.bin', data: randomBytes(4096), method: 14 }])
  const origin = await serve({ size: 1 })
  origin.setContent(archive, '"lzma-v1"')
  await plexo.api.listInterfaces()

  await plexo.api.startDownload({
    kind: 'http',
    url: origin.url('/Game.zip'),
    destinationDir: dirs.dest,
    suggestedFileName: 'Game.zip',
    totalBytes: archive.length,
    supportsRanges: true,
    interfaceIds: ['a'],
    etag: '"lzma-v1"',
    lastModified: null,
    streamExtract: { format: 'zip' }
  })

  const state = await plexo.waitForStatus('error')
  expect(state.error).toContain('LZMA')
  expect(state.error).toContain('unpacked while downloading')
  expect(state.error).not.toContain('stored block')
})

