import { cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { deflateRawSync } from 'node:zlib'
import { build } from 'vite'

const root = dirname(fileURLToPath(import.meta.url))
const out = join(root, 'dist')
const scripts = join(out, 'scripts')

await rm(out, { recursive: true, force: true })

// One self-contained script each: Firefox's background script can't load modules.
for (const name of ['background', 'popup', 'options']) {
  await build({
    configFile: false,
    root,
    logLevel: 'warn',
    build: {
      outDir: scripts,
      emptyOutDir: false,
      minify: false,
      lib: {
        entry: join(root, 'src', `${name}.ts`),
        formats: ['iife'],
        name: 'plexo',
        fileName: () => `${name}.js`
      }
    }
  })
}

const base = JSON.parse(await readFile(join(root, 'manifest.json'), 'utf-8'))
// One manifest per browser: given both background keys, Chrome reports the one it doesn't use as
// an error.
const manifests = {
  chrome: {
    ...base,
    // The first Chrome where every API this calls returns a promise (contextMenus.removeAll).
    minimum_chrome_version: '123',
    background: { service_worker: 'background.js' }
  },
  firefox: {
    ...base,
    background: { scripts: ['background.js'] },
    browser_specific_settings: {
      gecko: {
        id: 'extension@majra.app',
        strict_min_version: '121.0',
        // Everything goes to the local app on 127.0.0.1; nothing leaves the device.
        data_collection_permissions: { required: ['none'] }
      }
    }
  }
}

for (const [browser, manifest] of Object.entries(manifests)) {
  const dir = join(out, browser)
  await mkdir(dir, { recursive: true })
  await cp(scripts, dir, { recursive: true })
  for (const file of ['popup.html', 'options.html', 'ui.css']) {
    await cp(join(root, 'src', file), join(dir, file))
  }
  await cp(join(root, 'icons'), join(dir, 'icons'), { recursive: true })
  await cp(join(root, '../src/renderer/src/assets/fonts'), join(dir, 'fonts'), { recursive: true })
  await writeFile(join(dir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`)
}
await rm(scripts, { recursive: true })
console.log(`Built ${Object.keys(manifests).join(' and ')} into ${out}`)

// The release ZIP is what people actually open, so its root must be a loadable Chrome extension:
// "Load unpacked" on the extracted folder then finds manifest.json at the top. Firefox keeps its
// own build in a subfolder, since its manifest differs.
const files = async (dir) => {
  const found = []
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) found.push(...(await files(path)))
    else found.push(path)
  }
  return found
}

const entries = []
const README = `Majra browser extension
======================

Chrome, Edge, Brave, Opera
  1. Extract this ZIP to a folder you will keep.
  2. Open chrome://extensions (or edge://extensions) and turn on Developer mode.
  3. Choose "Load unpacked" and select this folder (the one holding manifest.json).
  4. Start Majra; the extension talks to it on 127.0.0.1 only.

Firefox
  1. Open about:debugging#/runtime/this-firefox.
  2. Choose "Load Temporary Add-on" and pick firefox/manifest.json in this folder.
`
for (const path of await files(join(out, 'chrome'))) {
  entries.push({ name: relative(join(out, 'chrome'), path).split(sep).join('/'), path })
}
for (const path of await files(join(out, 'firefox'))) {
  entries.push({
    name: `firefox/${relative(join(out, 'firefox'), path).split(sep).join('/')}`,
    path
  })
}
entries.push({ name: 'README.txt', text: README })

const zip = await readZipEntries(entries)
const zipPath = join(root, '..', 'dist', 'Majra-Browser-Extension.zip')
await mkdir(dirname(zipPath), { recursive: true })
await writeFile(zipPath, zip)
console.log(`Wrote ${zipPath} (${entries.length} files)`)

// Minimal ZIP writer: one deflated entry per file, fixed timestamp, forward-slash names.
async function readZipEntries(list) {
  const table = crcTable()
  const local = []
  const central = []
  let offset = 0
  for (const entry of list) {
    const data =
      entry.text === undefined ? await readFile(entry.path) : Buffer.from(entry.text, 'utf8')
    const name = Buffer.from(entry.name, 'utf8')
    const compressed = deflateRawSync(data, { level: 9 })
    const crc = crc32(data, table)
    const header = Buffer.alloc(30)
    header.writeUInt32LE(0x04034b50, 0)
    header.writeUInt16LE(20, 4)
    header.writeUInt16LE(0x800, 6)
    header.writeUInt16LE(8, 8)
    header.writeUInt16LE(0, 10)
    header.writeUInt16LE(0x21, 12) // 1980-01-01, so the ZIP is reproducible
    header.writeUInt32LE(crc, 14)
    header.writeUInt32LE(compressed.length, 18)
    header.writeUInt32LE(data.length, 22)
    header.writeUInt16LE(name.length, 26)
    header.writeUInt16LE(0, 28)
    local.push(header, name, compressed)

    const entryHeader = Buffer.alloc(46)
    entryHeader.writeUInt32LE(0x02014b50, 0)
    entryHeader.writeUInt16LE(20, 4)
    entryHeader.writeUInt16LE(20, 6)
    entryHeader.writeUInt16LE(0x800, 8)
    entryHeader.writeUInt16LE(8, 10)
    entryHeader.writeUInt16LE(0, 12)
    entryHeader.writeUInt16LE(0x21, 14)
    entryHeader.writeUInt32LE(crc, 16)
    entryHeader.writeUInt32LE(compressed.length, 20)
    entryHeader.writeUInt32LE(data.length, 24)
    entryHeader.writeUInt16LE(name.length, 28)
    entryHeader.writeUInt16LE(0, 30)
    entryHeader.writeUInt16LE(0, 32)
    entryHeader.writeUInt16LE(0, 34)
    entryHeader.writeUInt16LE(0, 36)
    entryHeader.writeUInt32LE(0, 38)
    entryHeader.writeUInt32LE(offset, 42)
    central.push(entryHeader, name)
    offset += header.length + name.length + compressed.length
  }
  const directory = Buffer.concat(central)
  const end = Buffer.alloc(22)
  end.writeUInt32LE(0x06054b50, 0)
  end.writeUInt16LE(0, 4)
  end.writeUInt16LE(0, 6)
  end.writeUInt16LE(list.length, 8)
  end.writeUInt16LE(list.length, 10)
  end.writeUInt32LE(directory.length, 12)
  end.writeUInt32LE(offset, 16)
  end.writeUInt16LE(0, 20)
  return Buffer.concat([...local, directory, end])
}

function crcTable() {
  const table = new Uint32Array(256)
  for (let index = 0; index < 256; index += 1) {
    let value = index
    for (let bit = 0; bit < 8; bit += 1)
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1
    table[index] = value >>> 0
  }
  return table
}

function crc32(data, table) {
  let value = 0xffffffff
  for (const byte of data) value = table[(value ^ byte) & 0xff] ^ (value >>> 8)
  return (value ^ 0xffffffff) >>> 0
}
