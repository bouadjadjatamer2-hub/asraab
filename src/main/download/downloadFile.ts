import { Writable } from 'node:stream'
import { lstat, open, rename, rm, stat } from 'node:fs/promises'
import { basename, dirname, extname, join } from 'node:path'
import { DiskWriter, diskBufferBytes } from './diskWriter'
import { markSparse } from './sparseFile'

/** A writer that hands its chunks to the download's one disk-writer thread. The stream's own
 * high-water mark is what gives the network side its backpressure: when the disk falls behind,
 * writes are not acknowledged, the writer fills, and the response is paused. */
class OffsetWriter extends Writable {
  private position: number

  constructor(
    private readonly disk: DiskWriter,
    position: number,
    highWaterMark: number
  ) {
    super({ highWaterMark })
    this.position = position
  }

  override _write(
    chunk: Buffer,
    _encoding: BufferEncoding,
    callback: (error?: Error | null) => void
  ): void {
    const at = this.position
    this.position += chunk.length
    this.disk.write(at, chunk).then(
      () => callback(),
      (error) => callback(error)
    )
  }

  override _writev(
    chunks: Array<{ chunk: Buffer; encoding: BufferEncoding }>,
    callback: (error?: Error | null) => void
  ): void {
    const at = this.position
    const length = chunks.reduce((sum, entry) => sum + entry.chunk.length, 0)
    const buffer =
      chunks.length === 1
        ? chunks[0].chunk
        : Buffer.concat(
            chunks.map((entry) => entry.chunk),
            length
          )
    this.position += length
    this.disk.write(at, buffer).then(
      () => callback(),
      (error) => callback(error)
    )
  }
}

/** The only large file owned by a download. It lives beside the final file so publishing it
 * requires no copy and never needs a second file's worth of disk space. */
export class DownloadFile {
  private disk: DiskWriter | null = null

  constructor(readonly path: string) {}

  /**
   * Gives the staging file its final size before parallel writes start. On NTFS this reserves
   * the whole range at once, so blocks landing at different offsets extend a contiguous file
   * instead of allocating a new run for every first write. That is what keeps a rotating disk
   * from seeking between growing fragments; it also makes a full disk fail at the start rather
   * than in the middle. A file system that can't reserve falls back to the old sparse file.
   */
  async reserve(expectedBytes: number): Promise<void> {
    if (!(expectedBytes > 0)) return
    const handle = await open(this.path, 'r+')
    try {
      const { size } = await handle.stat()
      if (size !== expectedBytes) await handle.truncate(expectedBytes)
    } catch (error) {
      // Sparse still avoids zero-filling gaps, just without the contiguous reservation.
      console.warn('[tayyar] could not reserve the download file, using a sparse file', error)
      await markSparse(this.path)
    } finally {
      await handle.close()
    }
  }

  /**
   * A writer at an absolute offset. The writer thread sorts queued writes by offset, so blocks
   * arriving out of order still reach a rotating disk in a near-sequential order. One writer
   * thread is shared by every stream of this download.
   */
  writer(position: number): Writable {
    return new OffsetWriter(this.diskWriter(), position, diskBufferBytes())
  }

  private diskWriter(): DiskWriter {
    this.disk ??= new DiskWriter(this.path)
    return this.disk
  }

  async read(position: number, length: number): Promise<Buffer> {
    const handle = await open(this.path, 'r')
    try {
      const buffer = Buffer.alloc(length)
      const { bytesRead } = await handle.read(buffer, 0, length, position)
      return buffer.subarray(0, bytesRead)
    } finally {
      await handle.close()
    }
  }

  /** Flushes the staging file before a recovery checkpoint or final publication. */
  async sync(): Promise<void> {
    if (this.disk) {
      await this.disk.sync()
      return
    }
    const handle = await open(this.path, 'r+')
    try {
      await handle.sync()
    } finally {
      await handle.close()
    }
  }

  async size(): Promise<number> {
    return (await stat(this.path)).size
  }

  async publish(
    destinationPath: string,
    expectedBytes: number,
    beforeAttempt: (candidate: string) => Promise<void>
  ): Promise<string> {
    if (expectedBytes > 0 && (await this.size()) !== expectedBytes) {
      throw new Error('Download file size does not match the expected size')
    }
    // Windows won't rename a file while the writer thread holds its handle.
    await this.closeWriter()
    await this.sync()
    const extension = extname(destinationPath)
    const stem = basename(destinationPath, extension)
    const directory = dirname(destinationPath)
    for (let index = 0; index < 10_000; index += 1) {
      const suffix = index === 0 ? '' : ` (${index})`
      if (Buffer.byteLength(`${suffix}${extension}`) >= 255) {
        throw new Error('The file extension is too long')
      }
      const candidateCharacters = Array.from(stem)
      while (Buffer.byteLength(`${candidateCharacters.join('')}${suffix}${extension}`) > 255) {
        candidateCharacters.pop()
      }
      const candidateStem = candidateCharacters.join('')
      const candidate = join(directory, `${candidateStem}${suffix}${extension}`)
      if (candidate !== destinationPath) {
        const partialExists = await lstat(`${candidate}.plexo`).then(
          () => true,
          (error: NodeJS.ErrnoException) => {
            if (error.code === 'ENOENT') return false
            throw error
          }
        )
        if (partialExists) continue
      }
      await beforeAttempt(candidate)
      // Check immediately before the rename, after the recovery intent is saved.
      // Node has no portable no-replace rename: another process could still
      // claim this name in the small interval between these two operations.
      const destinationExists = await lstat(candidate).then(
        () => true,
        (error: NodeJS.ErrnoException) => {
          if (error.code === 'ENOENT') return false
          throw error
        }
      )
      if (destinationExists) continue
      try {
        // The partial and final names are in one directory, so this moves the
        // completed bytes into place without copying the file.
        await rename(this.path, candidate)
        return candidate
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'EEXIST') continue
        throw error
      }
    }
    throw new Error('Could not find an unused file name for this download')
  }

  async discard(): Promise<void> {
    await this.closeWriter()
    await rm(this.path, { force: true })
  }

  /** Clears what's left once the download is published (or was found to be). A file published by
   * rename leaves nothing, bar the partial of a publish interrupted after it. */
  async discardLeftover(): Promise<void> {
    await this.discard()
  }

  private async closeWriter(): Promise<void> {
    const disk = this.disk
    this.disk = null
    if (disk) await disk.close()
  }
}
