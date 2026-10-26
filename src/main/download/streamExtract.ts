import { spawn, type ChildProcess } from 'node:child_process'
import { existsSync, mkdirSync } from 'node:fs'
import { rm } from 'node:fs/promises'
import { join } from 'node:path'
import { Writable } from 'node:stream'
import { Worker } from 'node:worker_threads'
import { app } from 'electron'
import type { ArchiveFormat } from '../../shared/types'

/** How much of the tool's error output is kept to explain a failed extraction. */
const STDERR_TAIL = 4096

/** What the transfer writes an archive into, and how it is brought to a clean end. */
export interface StreamUnpacker {
  readonly dir: string
  /** Every byte of the archive, in order. Stays open across network retries. */
  readonly destination: Writable
  /** True once it can't take more bytes (it failed or was stopped). */
  readonly hasExited: boolean
  /** Why it stopped, when it stopped on an error. Lets the download report the real cause
   * instead of a generic "the tool stopped" message. */
  readonly failure: Error | null
  /** Closes the input and waits for the last files to land. Throws if unpacking failed. */
  finish(): Promise<void>
  /** Stops now. Partial files stay until `remove`. */
  abort(): void
  /** Deletes the folder, partial extraction included. */
  remove(): Promise<void>
}

/** The unpacker for a format: ZIP in a worker thread, UnRAR/TAR as a child process (Windows' tar
 * can't stream a ZIP reliably: a short read loses the entry it was in). */
export function createUnpacker(format: ArchiveFormat, dir: string): StreamUnpacker {
  return format === 'zip' ? new ZipExtractor(dir) : new ArchiveExtractor(format, dir)
}

/** Windows' own tar (libarchive) reads TAR from a pipe. RAR needs the bundled UnRAR: Windows'
 * tar can't read RAR, and UnRAR's `-si` reads the archive from standard input. */
export function archiveToolPath(format: ArchiveFormat): string {
  if (format === 'rar') {
    const bundled = app.isPackaged
      ? join(process.resourcesPath, 'app.asar.unpacked', 'resources', 'bin', 'unrar.exe')
      : join(app.getAppPath(), 'resources', 'bin', 'unrar.exe')
    if (!existsSync(bundled)) {
      throw new Error('The RAR unpacking tool is missing. Reinstall Majra and try again.')
    }
    return bundled
  }
  const systemRoot = process.env.SystemRoot ?? 'C:\\Windows'
  const tar = join(systemRoot, 'System32', 'tar.exe')
  if (!existsSync(tar)) {
    throw new Error('Windows’ tar tool is missing, so TAR archives can’t be unpacked.')
  }
  return tar
}

/**
 * Unpacks a RAR or TAR archive from a stream. Bytes are written to `stdin` in order; the tool
 * reads them as they arrive, so the archive never exists on disk: disk use is the unpacked files
 * alone.
 *
 * The tool is started once per download. A network retry keeps feeding the same process: its
 * standard input stays open between attempts (see chunkDownloader's persistentDestination), and
 * UnRAR/tar simply wait for the next bytes.
 */
export class ArchiveExtractor implements StreamUnpacker {
  readonly dir: string
  private readonly child: ChildProcess
  private readonly stdin: Writable
  private readonly exited: Promise<number>
  private stderr = ''
  private exitCode: number | null = null
  private aborted = false

  constructor(
    readonly format: 'rar' | 'tar',
    dir: string,
    tool = archiveToolPath(format)
  ) {
    this.dir = dir
    mkdirSync(dir, { recursive: true })
    const args =
      format === 'rar'
        ? // With -si the archive comes from stdin. It still wants a name argument (this version
          // rejects the command without one); the file is never opened. cwd is where files go.
          // -y overwrites, and -ierr puts every message on stderr, where a failure can be read.
          ['x', '-si', '-y', '-ierr', 'archive.rar']
        : // `-C` is tar's destination; `-` is standard input.
          ['-xf', '-', '-C', dir]
    this.child = spawn(tool, args, {
      cwd: format === 'rar' ? dir : undefined,
      windowsHide: true,
      stdio: ['pipe', 'ignore', 'pipe']
    })
    const stdin = this.child.stdin
    const stderr = this.child.stderr
    if (!stdin || !stderr) {
      throw new Error('The unpacking tool could not be started.')
    }
    this.stdin = stdin
    stderr.setEncoding('utf8')
    stderr.on('data', (text: string) => {
      this.stderr = (this.stderr + text).slice(-STDERR_TAIL)
    })
    this.exited = new Promise((resolve) => {
      this.child.once('error', (error) => {
        this.stderr = `${this.stderr}\n${error.message}`.slice(-STDERR_TAIL)
        this.exitCode = 1
        resolve(1)
      })
      this.child.once('close', (code) => {
        this.exitCode = code ?? 1
        resolve(this.exitCode)
      })
    })
  }

  /** The stream every byte of the archive goes into. It stays open across network retries. */
  get destination(): Writable {
    return this.stdin
  }

  /** True once the tool has stopped: no more bytes can go in. */
  get hasExited(): boolean {
    return this.exitCode !== null
  }

  /** The tool's own explanation, when it stopped on an error. A clean exit has none. */
  get failure(): Error | null {
    if (this.exitCode === null || this.exitCode === 0) return null
    return new Error(this.explain(this.exitCode))
  }

  /** Closes the archive stream and waits for the tool to write everything out. Throws with
   * the tool's own message if it stopped on an error. */
  async finish(): Promise<void> {
    if (this.aborted) throw new Error('Unpacking was stopped.')
    this.stdin.end()
    const code = await this.exited
    if (code !== 0) throw new Error(this.explain(code))
  }

  /** Stops the tool now. Used on pause, cancel and failure; partial files stay until `remove`. */
  abort(): void {
    this.aborted = true
    this.stdin.destroy()
    if (this.exitCode === null) this.child.kill()
  }

  /** Deletes the folder, partial extraction included. */
  async remove(): Promise<void> {
    await rm(this.dir, { recursive: true, force: true }).catch(() => {})
  }

  private explain(code: number): string {
    const detail = this.stderr
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !/^UNRAR|^Copyright|^$/i.test(line))
      .slice(-3)
      .join(' ')
    if (this.format === 'rar' && code === 3) {
      return 'The archive is password-protected or damaged. Save it and unpack it with your archive tool.'
    }
    const action = this.format === 'rar' ? 'UnRAR' : 'Windows tar'
    return detail
      ? `${action} couldn’t unpack the archive: ${detail.slice(0, 400)}`
      : `${action} couldn’t unpack the archive (it stopped with code ${code}).`
  }
}

/**
 * Unpacks a ZIP in a worker thread. Windows' tar can stream a TAR from a pipe but not a ZIP: a
 * read that comes back short loses the entry it was in, which a network pause is enough to cause.
 * `unzipper` follows the local headers instead, so a retry simply carries on. The parser and every
 * file write live in the worker, so a large archive can't block the window, the download's
 * progress, or the main process.
 */
export class ZipExtractor implements StreamUnpacker {
  readonly dir: string
  private readonly worker: Worker
  private readonly sink: Writable
  private nextId = 1
  private readonly pending = new Map<
    number,
    { resolve: () => void; reject: (error: Error) => void }
  >()
  private error: Error | null = null
  private aborted = false

  constructor(dir: string) {
    this.dir = dir
    mkdirSync(dir, { recursive: true })
    this.worker = new Worker(ZIP_WORKER_SOURCE, {
      eval: true,
      workerData: { dir, unzipper: require.resolve('unzipper') }
    })
    this.worker.on('message', (message: { type: string; id: number; error?: string }) => {
      const pending = this.pending.get(message.id)
      if (!pending) return
      this.pending.delete(message.id)
      if (message.error) {
        const error = new Error(message.error)
        this.error ??= error
        pending.reject(error)
      } else {
        pending.resolve()
      }
    })
    this.worker.on('error', (error) => this.failAll(error))
    this.worker.on('exit', (code) => {
      if (!this.aborted && code !== 0) {
        this.failAll(new Error(`The ZIP unpacker stopped (${code})`))
      }
    })
    // A large high-water mark lets a fast connection hand over a whole batch while the worker
    // inflates and writes the previous one; backpressure comes back through this stream.
    this.sink = new Writable({
      highWaterMark: 4 * 1024 * 1024,
      write: (chunk: Buffer, _encoding, callback) => {
        this.send({ type: 'chunk', buffer: chunk }).then(
          () => callback(),
          (error) => callback(error)
        )
      }
    })
  }

  get destination(): Writable {
    return this.sink
  }

  get hasExited(): boolean {
    return this.aborted || this.error !== null
  }

  get failure(): Error | null {
    return this.error
  }

  async finish(): Promise<void> {
    if (this.aborted) throw new Error('Unpacking was stopped.')
    await this.send({ type: 'end' })
    if (this.error) throw this.error
    await this.close()
  }

  abort(): void {
    if (this.aborted) return
    this.aborted = true
    try {
      this.worker.postMessage({ type: 'abort', id: 0 })
    } catch {
      // Already gone.
    }
    this.failAll(new Error('Unpacking was stopped.'))
    this.worker.removeAllListeners()
    void this.worker.terminate().catch(() => {})
  }

  async remove(): Promise<void> {
    this.abort()
    await rm(this.dir, { recursive: true, force: true }).catch(() => {})
  }

  private send(message: { type: 'chunk'; buffer: Buffer } | { type: 'end' }): Promise<void> {
    if (this.aborted) return Promise.reject(new Error('Unpacking was stopped.'))
    if (this.error) return Promise.reject(this.error)
    const id = this.nextId++
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject })
      try {
        if (message.type === 'chunk') {
          const full =
            message.buffer.byteOffset === 0 &&
            message.buffer.byteLength === message.buffer.buffer.byteLength
          const data = full ? message.buffer : Buffer.from(message.buffer)
          this.worker.postMessage(
            { type: 'chunk', id, buffer: data },
            full ? [data.buffer as ArrayBuffer] : []
          )
        } else {
          this.worker.postMessage({ type: 'end', id })
        }
      } catch (error) {
        this.pending.delete(id)
        reject(error instanceof Error ? error : new Error(String(error)))
      }
    })
  }

  private async close(): Promise<void> {
    this.worker.removeAllListeners()
    await this.worker.terminate().catch(() => {})
  }

  private failAll(error: Error): void {
    this.error ??= error
    for (const pending of this.pending.values()) pending.reject(error)
    this.pending.clear()
  }
}

/** The worker's whole program. It keeps `unzipper` and all file writes off the main process. */
const ZIP_WORKER_SOURCE = String.raw`
const { parentPort, workerData } = require('node:worker_threads')
const { mkdirSync, createWriteStream } = require('node:fs')
const { mkdir } = require('node:fs/promises')
const { dirname, join } = require('node:path')
const { pipeline } = require('node:stream/promises')
const unzipper = require(workerData.unzipper)
const dir = workerData.dir
mkdirSync(dir, { recursive: true })
const parser = unzipper.Parse({ forceStream: true })
let failure = null
let stopped = false

// Windows can't create a name with any of these, or one that ends in a dot or a space. Archive
// tools on other systems can, so a name is made safe instead of failing the whole extraction.
const INVALID_NAME = /[<>:"|?*\u0000-\u001f]/g
const RESERVED_NAME = /^(con|prn|aux|nul|com[1-9]|lpt[1-9]|conin\$|conout\$)(\..*)?$/i

function capName(name) {
  if (name.length <= 200) return name
  const dot = name.lastIndexOf('.')
  const extension = dot > 0 && name.length - dot <= 16 ? name.slice(dot) : ''
  let cut = name.slice(0, 200 - extension.length)
  const last = cut.charCodeAt(cut.length - 1)
  if (last >= 0xd800 && last <= 0xdbff) cut = cut.slice(0, -1)
  return cut.replace(/[. ]+$/g, '') + extension
}

function cleanComponent(part) {
  let name = part.replace(INVALID_NAME, '_').replace(/[. ]+$/g, '')
  name = capName(name).replace(/[. ]+$/g, '')
  if (name === '' || /^\.+$/.test(name)) name = '_'
  if (RESERVED_NAME.test(name)) name = '_' + name
  return name
}

// Returns the archive path with every component made valid on Windows, or null for a path that
// must not be written at all (absolute, or climbing out with ..).
function safePath(name) {
  const slashed = String(name).replace(/\\/g, '/')
  if (slashed.startsWith('/') || /^[a-zA-Z]:/.test(slashed)) return null
  const parts = slashed.split('/').filter((part) => part !== '' && part !== '.')
  if (parts.length === 0 || parts.some((part) => part === '..')) return null
  return parts.map(cleanComponent).join('/')
}

// Two archive names can become the same Windows name once cleaned. Keep them apart with a suffix,
// but let an entry that appears twice under the same name overwrite itself, as archive tools do.
const assigned = new Map()
const used = new Map()

function addSuffix(relative, n) {
  const slash = relative.lastIndexOf('/')
  const parent = slash >= 0 ? relative.slice(0, slash + 1) : ''
  const base = slash >= 0 ? relative.slice(slash + 1) : relative
  const dot = base.lastIndexOf('.')
  const extension = dot > 0 ? base.slice(dot) : ''
  const stem = dot > 0 ? base.slice(0, dot) : base
  return parent + stem + ' (' + n + ')' + extension
}

function targetPath(name) {
  const original = String(name).replace(/\\/g, '/')
  const relative = safePath(original)
  if (relative === null) return null
  const key = original.toLowerCase()
  const known = assigned.get(key)
  if (known) return known
  let unique = relative
  let n = 1
  while (used.has(unique.toLowerCase())) unique = addSuffix(relative, n++)
  assigned.set(key, unique)
  used.set(unique.toLowerCase(), key)
  return unique
}

const consumed = (async () => {
  for await (const entry of parser) {
    if (stopped) {
      entry.autodrain()
      continue
    }
    const relative = targetPath(entry.path)
    if (relative === null) {
      entry.autodrain()
      throw new Error('The archive contains an unsafe path: ' + entry.path)
    }
    if (entry.type === 'Directory') {
      await mkdir(join(dir, relative), { recursive: true })
      entry.autodrain()
      continue
    }
    if (entry.vars && entry.vars.encrypted) {
      entry.autodrain()
      throw new Error('The archive is password-protected. Save it and unpack it with your archive tool.')
    }
    const target = join(dir, relative)
    await mkdir(dirname(target), { recursive: true })
    await pipeline(entry, createWriteStream(target))
  }
})().catch((error) => {
  failure = error instanceof Error ? error : new Error(String(error))
  if (!parser.destroyed) parser.destroy()
})

parser.on('error', (error) => {
  failure ??= error
})

function waitForDrain() {
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      parser.off('drain', onDrain)
      parser.off('error', onError)
      parser.off('close', onClose)
    }
    const onDrain = () => {
      cleanup()
      resolve()
    }
    const onError = (error) => {
      cleanup()
      reject(error)
    }
    const onClose = () => {
      cleanup()
      reject(failure ?? new Error('The archive stream closed'))
    }
    parser.once('drain', onDrain)
    parser.once('error', onError)
    parser.once('close', onClose)
  })
}

// Messages are handled one at a time: a chunk is acknowledged only after the parser has room for
// it, so the transfer's stream gets real backpressure rather than an unbounded worker queue.
let chain = Promise.resolve()
parentPort.on('message', (message) => {
  chain = chain.then(async () => {
    try {
      if (message.type === 'chunk') {
        if (failure) {
          parentPort.postMessage({ type: 'ack', id: message.id, error: failure.message })
          return
        }
        let accepted = true
        try {
          accepted = parser.write(message.buffer)
        } catch (error) {
          failure = error instanceof Error ? error : new Error(String(error))
        }
        if (!accepted && !failure) {
          try {
            await waitForDrain()
          } catch (error) {
            failure ??= error
          }
        }
        parentPort.postMessage({
          type: 'ack',
          id: message.id,
          error: failure ? failure.message : undefined
        })
      } else if (message.type === 'end') {
        if (!parser.destroyed) parser.end()
        await consumed
        parentPort.postMessage({
          type: 'done',
          id: message.id,
          error: failure ? failure.message : undefined
        })
      } else if (message.type === 'abort') {
        stopped = true
        if (!parser.destroyed) parser.destroy()
        parentPort.postMessage({ type: 'done', id: message.id })
      }
    } catch (error) {
      failure ??= error instanceof Error ? error : new Error(String(error))
      parentPort.postMessage({
        type: 'ack',
        id: message.id,
        error: failure.message
      })
    }
  })
})
`
