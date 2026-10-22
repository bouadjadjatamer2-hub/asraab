import { spawn, type ChildProcess } from 'node:child_process'
import { createWriteStream, existsSync, mkdirSync } from 'node:fs'
import { mkdir, rm } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { pipeline } from 'node:stream/promises'
import type { Writable } from 'node:stream'
import * as unzipper from 'unzipper'
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
  /** Closes the input and waits for the last files to land. Throws if unpacking failed. */
  finish(): Promise<void>
  /** Stops now. Partial files stay until `remove`. */
  abort(): void
  /** Deletes the folder, partial extraction included. */
  remove(): Promise<void>
}

/** The unpacker for a format: UnRAR/TAR as a child process, ZIP in-process (Windows' tar can't
 * stream a ZIP reliably: a short read loses the entry it was in). */
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
      throw new Error('The RAR unpacking tool is missing. Reinstall Tayyar and try again.')
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

/** A path inside the archive, or null if it would land outside the destination. */
function safeArchivePath(name: string): string | null {
  const slashed = name.replace(/\\/g, '/')
  if (slashed.startsWith('/') || /^[a-zA-Z]:/.test(slashed)) return null
  const parts = slashed.split('/').filter((part) => part !== '' && part !== '.')
  if (parts.length === 0 || parts.some((part) => part === '..')) return null
  return parts.join('/')
}

/**
 * Unpacks a ZIP in-process. Windows' tar can stream a TAR from a pipe but not a ZIP: a read
 * that comes back short loses the entry it was in, which a network pause is enough to cause.
 * `unzipper` follows the local headers instead, so a retry simply carries on.
 */
export class ZipExtractor implements StreamUnpacker {
  readonly dir: string
  private readonly parser: ReturnType<typeof unzipper.Parse>
  private readonly consumed: Promise<void>
  private failure: Error | null = null
  private aborted = false

  constructor(dir: string) {
    this.dir = dir
    mkdirSync(dir, { recursive: true })
    this.parser = unzipper.Parse({ forceStream: true })
    // A parser error must not become an uncaught 'error' event; the download watches the
    // destination too, and finish() reports the real reason.
    this.parser.on('error', (error: Error) => {
      this.failure ??= error
    })
    this.consumed = this.consume().catch((error) => {
      this.failure ??= error instanceof Error ? error : new Error(String(error))
    })
  }

  get destination(): Writable {
    return this.parser
  }

  get hasExited(): boolean {
    return this.aborted || this.failure !== null
  }

  async finish(): Promise<void> {
    if (this.aborted) throw new Error('Unpacking was stopped.')
    // If it already failed, it was destroyed, and end() would only throw over that.
    if (!this.parser.destroyed) this.parser.end()
    await this.consumed
    if (this.failure) throw this.failure
  }

  abort(): void {
    this.aborted = true
    this.parser.destroy()
  }

  async remove(): Promise<void> {
    await rm(this.dir, { recursive: true, force: true }).catch(() => {})
  }

  private async consume(): Promise<void> {
    try {
      for await (const entry of this.parser) {
        if (this.aborted) {
          entry.autodrain()
          continue
        }
        const relative = safeArchivePath(entry.path)
        if (relative === null) {
          entry.autodrain()
          throw new Error(`The archive contains an unsafe path: ${entry.path}`)
        }
        if (entry.type === 'Directory') {
          await mkdir(join(this.dir, relative), { recursive: true })
          entry.autodrain()
          continue
        }
        if ((entry.vars as { encrypted?: boolean } | undefined)?.encrypted) {
          entry.autodrain()
          throw new Error(
            'The archive is password-protected. Save it and unpack it with your archive tool.'
          )
        }
        const target = join(this.dir, relative)
        await mkdir(dirname(target), { recursive: true })
        await pipeline(entry, createWriteStream(target))
      }
    } catch (error) {
      this.failure ??= error instanceof Error ? error : new Error(String(error))
      // Stop the input: nothing more should be accepted into a folder that won't be complete.
      if (!this.parser.destroyed) this.parser.destroy()
      throw this.failure
    }
  }
}
