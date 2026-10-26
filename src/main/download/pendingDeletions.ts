import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { dirname, isAbsolute, resolve } from 'node:path'

/** Windows holds a file open for a moment after a socket or writer closes, and an antivirus scan
 * can hold it longer. A cancelled download is not an error the user should see: retry in the
 * background, longest wait last. */
const RETRY_DELAYS_MS = [0, 1_000, 2_000, 3_000, 5_000, 8_000]

function delay(ms: number): Promise<void> {
  return new Promise((resolveDelay) => setTimeout(resolveDelay, ms))
}

function keyOf(path: string): string {
  return resolve(path).toLowerCase()
}

/**
 * Paths a cancelled download left behind, written before anything is deleted. If the app closes
 * (or crashes) while Windows still has a file open, the next start finds the list and finishes
 * the job. Only explicit cancellations add paths; a completed file is never in it.
 */
export class PendingDeletions {
  private readonly paths = new Map<string, string>()
  private loaded: Promise<void> | null = null
  private writing: Promise<void> = Promise.resolve()
  private sweeping: Promise<void> | null = null
  /** A path arrived while a sweep was running: run it again before the sweep is called done. */
  private sweepAgain = false

  constructor(private readonly filePath: string) {}

  /** True when `path` is waiting to be deleted, so a stale manifest isn't restored. */
  async has(path: string): Promise<boolean> {
    await this.load()
    return this.paths.has(keyOf(path))
  }

  /** Records paths first, then deletes them. Returns once the record is durable; deletion is
   * allowed to continue in the background. */
  async add(paths: readonly string[]): Promise<void> {
    await this.load()
    for (const path of paths) {
      if (!safeToDelete(path)) continue
      this.paths.set(keyOf(path), path)
    }
    this.sweepAgain = true
    await this.flush()
  }

  /** Tries every recorded path, retrying locks without telling the user. Returns when done. */
  async sweep(): Promise<void> {
    await this.load()
    if (this.sweeping) {
      this.sweepAgain = true
      return this.sweeping
    }
    this.sweeping = (async () => {
      do {
        this.sweepAgain = false
        for (const [key, path] of [...this.paths.entries()]) {
          let removed = false
          for (const wait of RETRY_DELAYS_MS) {
            if (wait > 0) await delay(wait)
            try {
              await rm(path, { recursive: true, force: true })
              removed = true
              break
            } catch {
              // Locked, open, or still being scanned: try again.
            }
          }
          // A path that stays locked is kept for the next start, not reported as a failure.
          if (removed) this.paths.delete(key)
          await this.flush()
        }
      } while (this.sweepAgain)
    })().finally(() => {
      this.sweeping = null
      if (this.sweepAgain) void this.sweep()
    })
    return this.sweeping
  }

  private load(): Promise<void> {
    this.loaded ??= (async () => {
      try {
        const raw = JSON.parse(await readFile(this.filePath, 'utf-8')) as unknown
        if (!Array.isArray(raw)) return
        for (const item of raw) {
          if (typeof item === 'string' && safeToDelete(item)) {
            this.paths.set(keyOf(item), item)
          }
        }
      } catch {
        // No list yet, or an unreadable one: nothing to finish.
      }
    })()
    return this.loaded
  }

  private flush(): Promise<void> {
    this.writing = this.writing
      .then(async () => {
        await mkdir(dirname(this.filePath), { recursive: true })
        const temporary = `${this.filePath}.tmp`
        await writeFile(temporary, JSON.stringify([...this.paths.values()]), 'utf-8')
        await rename(temporary, this.filePath)
      })
      .catch((error) => {
        // The deletion still runs; only the after-crash record is lost.
        console.warn('[majra] could not save the pending-deletion list', error)
      })
    return this.writing
  }
}

function safeToDelete(path: string): boolean {
  if (!path || !isAbsolute(path)) return false
  const parent = dirname(path)
  // Never a drive root, a bare directory, or this file's own folder.
  return parent !== path && path.length > 3
}
