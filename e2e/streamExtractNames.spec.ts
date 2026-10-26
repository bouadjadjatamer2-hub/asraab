import { randomBytes } from 'node:crypto'
import { join } from 'node:path'
import { deflateRawSync } from 'node:zlib'
import { expect, shaOfPath, test, treeSha } from './fixtures'

interface ZipEntry {
  name: string
  data: Buffer
  /** Stored instead of deflated. */
  stored?: boolean
  /** A streaming entry: its sizes follow the data in a descriptor, not in the local header. */
  descriptor?: boolean
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let i = 0; i < 256; i += 1) {
    let value = i
    for (let bit = 0; bit < 8; bit += 1) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1
    }
    table[i] = value >>> 0
  }
  return table
})()

function crc32(data: Buffer): number {
  let crc = 0xffffffff
  for (const byte of data) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

/** A small ZIP writer, so a test can name entries exactly as an archive from another system
 * would: characters Windows forbids, Unicode names, data descriptors. */
function makeZip(entries: ZipEntry[], comment = ''): Buffer {
  const parts: Buffer[] = []
  const central: Buffer[] = []
  let offset = 0
  for (const entry of entries) {
    const name = Buffer.from(entry.name, 'utf8')
    const method = entry.stored ? 0 : 8
    const body = entry.stored ? entry.data : deflateRawSync(entry.data)
    const crc = crc32(entry.data)
    const flags = 0x0800 | (entry.descriptor ? 0x0008 : 0)

    const local = Buffer.alloc(30)
    local.writeUInt32LE(0x04034b50, 0)
    local.writeUInt16LE(20, 4)
    local.writeUInt16LE(flags, 6)
    local.writeUInt16LE(method, 8)
    local.writeUInt16LE(0, 10)
    local.writeUInt16LE(0, 12)
    local.writeUInt32LE(entry.descriptor ? 0 : crc, 14)
    local.writeUInt32LE(entry.descriptor ? 0 : body.length, 18)
    local.writeUInt32LE(entry.descriptor ? 0 : entry.data.length, 22)
    local.writeUInt16LE(name.length, 26)
    local.writeUInt16LE(0, 28)
    parts.push(local, name, body)
    let localLength = local.length + name.length + body.length
    if (entry.descriptor) {
      const descriptor = Buffer.alloc(16)
      descriptor.writeUInt32LE(0x08074b50, 0)
      descriptor.writeUInt32LE(crc, 4)
      descriptor.writeUInt32LE(body.length, 8)
      descriptor.writeUInt32LE(entry.data.length, 12)
      parts.push(descriptor)
      localLength += descriptor.length
    }

    const header = Buffer.alloc(46)
    header.writeUInt32LE(0x02014b50, 0)
    header.writeUInt16LE(20, 4)
    header.writeUInt16LE(20, 6)
    header.writeUInt16LE(flags, 8)
    header.writeUInt16LE(method, 10)
    header.writeUInt16LE(0, 12)
    header.writeUInt16LE(0, 14)
    header.writeUInt32LE(crc, 16)
    header.writeUInt32LE(body.length, 20)
    header.writeUInt32LE(entry.data.length, 24)
    header.writeUInt16LE(name.length, 28)
    header.writeUInt16LE(0, 30)
    header.writeUInt16LE(0, 32)
    header.writeUInt16LE(0, 34)
    header.writeUInt16LE(0, 36)
    header.writeUInt32LE(0, 38)
    header.writeUInt32LE(offset, 42)
    central.push(header, name)
    offset += localLength
  }

  const directory = Buffer.concat(central)
  const endComment = Buffer.from(comment, 'utf8')
  const end = Buffer.alloc(22)
  end.writeUInt32LE(0x06054b50, 0)
  end.writeUInt16LE(entries.length, 8)
  end.writeUInt16LE(entries.length, 10)
  end.writeUInt32LE(directory.length, 12)
  end.writeUInt32LE(offset, 16)
  end.writeUInt16LE(endComment.length, 20)
  return Buffer.concat([...parts, directory, end, endComment])
}

test('unpacks archive names Windows cannot create, without losing files', async ({
  plexo,
  dirs,
  serve
}) => {
  const b = randomBytes(300_000)
  const arabic = '\u0645\u0631\u062d\u0628\u0627'
  const chinese = '\u4f60\u597d'
  const archive = makeZip(
    [
      { name: 'a.txt', data: Buffer.from('plain\n'), stored: true },
      { name: 'nested/b.bin', data: b },
      { name: 'bad/question?.txt', data: Buffer.from('question\n') },
      { name: 'bad/question*.txt', data: Buffer.from('star\n') },
      { name: 'bad/colon:name.txt', data: Buffer.from('colon\n') },
      { name: 'bad/aux.txt', data: Buffer.from('aux\n') },
      { name: 'bad/trailing. ', data: Buffer.from('trailing\n') },
      { name: 'bad/less<greater>.txt', data: Buffer.from('angle\n') },
      { name: 'bad/CON/inner.txt', data: Buffer.from('reserved folder\n') },
      { name: `unicode/${arabic}.txt`, data: Buffer.from('arabic\n') },
      { name: `unicode/${chinese}.txt`, data: Buffer.from('cjk\n'), descriptor: true }
    ],
    'made by the streaming extraction test'
  )
  const origin = await serve({ size: 1 })
  origin.setContent(archive, '"names-v1"')
  await plexo.api.listInterfaces()
  const id = await plexo.api.startDownload({
    kind: 'http',
    url: origin.url('/Names.zip'),
    destinationDir: dirs.dest,
    suggestedFileName: 'Names.zip',
    totalBytes: archive.length,
    supportsRanges: true,
    interfaceIds: ['a'],
    etag: '"names-v1"',
    lastModified: null,
    streamExtract: { format: 'zip' }
  })
  const expected = [
    { path: 'a.txt', data: Buffer.from('plain\n') },
    { path: 'nested/b.bin', data: b },
    { path: 'bad/question_.txt', data: Buffer.from('question\n') },
    { path: 'bad/question_ (1).txt', data: Buffer.from('star\n') },
    { path: 'bad/colon_name.txt', data: Buffer.from('colon\n') },
    { path: 'bad/_aux.txt', data: Buffer.from('aux\n') },
    { path: 'bad/trailing', data: Buffer.from('trailing\n') },
    { path: 'bad/less_greater_.txt', data: Buffer.from('angle\n') },
    { path: 'bad/_CON/inner.txt', data: Buffer.from('reserved folder\n') },
    { path: `unicode/${arabic}.txt`, data: Buffer.from('arabic\n') },
    { path: `unicode/${chinese}.txt`, data: Buffer.from('cjk\n') }
  ]
  plexo.tracked.set(id, {
    expectedSha: treeSha(expected),
    destBefore: [],
    destinationDir: dirs.dest
  })

  const state = await plexo.waitForHttpStatus(['completed', 'error'], 60_000)
  expect(state.status, state.error).toBe('completed')
  expect(state.destinationPath).toBe(join(dirs.dest, 'Names'))
  expect(await shaOfPath(state.destinationPath)).toBe(treeSha(expected))
})

test('reports why unpacking stopped, not just that it stopped', async ({ plexo, dirs, serve }) => {
  const archive = makeZip([
    { name: '../escape.txt', data: Buffer.from('must not land outside\n') },
    { name: 'ok.txt', data: Buffer.from('never reached\n') }
  ])
  const origin = await serve({ size: 1 })
  origin.setContent(archive, '"unsafe-v1"')
  await plexo.api.listInterfaces()
  await plexo.api.startDownload({
    kind: 'http',
    url: origin.url('/Unsafe.zip'),
    destinationDir: dirs.dest,
    suggestedFileName: 'Unsafe.zip',
    totalBytes: archive.length,
    supportsRanges: true,
    interfaceIds: ['a'],
    etag: '"unsafe-v1"',
    lastModified: null,
    streamExtract: { format: 'zip' }
  })

  const state = await plexo.waitForHttpStatus(['completed', 'error'], 60_000)
  expect(state.status, state.error).toBe('error')
  expect(state.error).toContain('unsafe path')
  expect(state.error).toContain('../escape.txt')
  expect(state.error).not.toContain('stopped before the download finished')
})
