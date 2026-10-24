import { Worker } from 'node:worker_threads'
import { totalmem } from 'node:os'

// One writer thread per destination file. The network side can hand over megabytes at a time;
// the worker keeps them in a queue, sorts them by file offset (so a rotating disk seeks in one
// direction instead of jumping between eight blocks), writes them in large batches, and reports
// each one only after the disk has accepted it. The main process never waits on a write itself,
// so a slow disk pushes back through the stream's high-water mark instead of stalling the app.

const MIB = 1024 * 1024
const RAM = totalmem()

/** Bytes one connection may gather before it has to wait for the disk. A weak machine with 4 GB
 * gets 1 MiB; a 32 GB machine gets 8 MiB. */
export function diskBufferBytes(): number {
  if (RAM < 6 * 1024 ** 3) return 1 * MIB
  if (RAM < 12 * 1024 ** 3) return 2 * MIB
  if (RAM < 24 * 1024 ** 3) return 4 * MIB
  return 8 * MIB
}

/** How much one write call may gather before it is handed over. A large device can use a larger
 * batch; a small one keeps the same 512 KiB that already worked there. */
export function diskCoalesceBytes(): number {
  return RAM < 6 * 1024 ** 3 ? 512 * 1024 : Math.min(2 * MIB, diskBufferBytes() / 2)
}

/** The most bytes all connections of one download may have queued for the disk. Kept to a small
 * slice of RAM: past it, writers return false and the network reads pause. */
export function diskQueueBytes(): number {
  return Math.min(192 * MIB, Math.max(32 * MIB, RAM * 0.02))
}

const WORKER_SOURCE = String.raw`
const { parentPort, workerData } = require('node:worker_threads')
const fs = require('node:fs/promises')
const path = workerData.path
let handle = null
let opening = null
let running = false
const queue = []

async function file() {
  if (handle) return handle
  if (!opening) {
    opening = fs.open(path, 'r+').then((h) => {
      handle = h
      return h
    })
  }
  return opening
}

async function writeOne(job) {
  const h = await file()
  const buffer = Buffer.from(job.buffer.buffer, job.buffer.byteOffset, job.buffer.byteLength)
  let at = 0
  while (at < buffer.length) {
    const { bytesWritten } = await h.write(buffer, at, buffer.length - at, job.position + at)
    if (!bytesWritten) throw new Error('The disk accepted no bytes')
    at += bytesWritten
  }
}

function answer(id, error) {
  if (error) parentPort.postMessage({ type: 'error', id, message: String(error && error.message || error) })
  else parentPort.postMessage({ type: 'done', id })
}

async function processQueue() {
  if (running) return
  running = true
  try {
    while (queue.length > 0) {
      // A batch of up to 64 writes is sorted by offset. A sync or close is processed only after
      // every write that arrived before it, so publishing never renames a file with writes left.
      const batch = []
      while (queue.length > 0 && batch.length < 64) {
        const job = queue[0]
        if (job.type !== 'write') break
        queue.shift()
        batch.push(job)
      }
      if (batch.length > 0) {
        batch.sort((a, b) => a.position - b.position)
        for (const job of batch) {
          try {
            await writeOne(job)
            answer(job.id)
          } catch (error) {
            answer(job.id, error)
          }
        }
        continue
      }
      const job = queue.shift()
      if (job.type === 'sync') {
        try {
          const h = await file()
          await h.sync()
          answer(job.id)
        } catch (error) {
          answer(job.id, error)
        }
      } else if (job.type === 'close') {
        try {
          if (handle) await handle.close()
          answer(job.id)
        } catch (error) {
          answer(job.id, error)
        }
        return
      } else {
        answer(job.id, new Error('Unknown writer command'))
      }
    }
  } finally {
    running = false
    if (queue.length > 0) processQueue()
  }
}

parentPort.on('message', (job) => {
  queue.push(job)
  processQueue()
})
`

interface Pending {
  resolve: () => void
  reject: (error: Error) => void
  bytes: number
}

/** The main-process handle on one writer thread. */
export class DiskWriter {
  private readonly worker: Worker
  private nextId = 1
  private readonly pending = new Map<number, Pending>()
  private queuedBytes = 0
  private readonly limitBytes = diskQueueBytes()
  private readonly waiting: Array<{
    bytes: number
    resolve: () => void
    reject: (error: Error) => void
  }> = []
  private closed = false

  constructor(path: string) {
    this.worker = new Worker(WORKER_SOURCE, {
      eval: true,
      workerData: { path }
    })
    this.worker.on('message', (message: { type: string; id: number; message?: string }) => {
      const pending = this.pending.get(message.id)
      if (!pending) return
      this.pending.delete(message.id)
      this.release(pending.bytes)
      if (message.type === 'error')
        pending.reject(new Error(message.message ?? 'Disk write failed'))
      else pending.resolve()
    })
    this.worker.on('error', (error) => this.failAll(error))
    this.worker.on('exit', (code) => {
      if (!this.closed && code !== 0) this.failAll(new Error(`The disk writer stopped (${code})`))
    })
  }

  /** Writes `buffer` at `position`. Resolves when the disk has accepted it. */
  write(position: number, buffer: Buffer): Promise<void> {
    if (this.closed) return Promise.reject(new Error('The disk writer is closed'))
    return new Promise((resolve, reject) => {
      void this.reserve(buffer.length).then(() => {
        if (this.closed) {
          this.release(buffer.length)
          reject(new Error('The disk writer is closed'))
          return
        }
        const id = this.nextId++
        this.pending.set(id, { resolve, reject, bytes: buffer.length })
        // A full, unpooled buffer can be transferred instead of copied. Pooled slices are
        // copied: transferring their whole pool would detach unrelated buffers.
        const full = buffer.byteOffset === 0 && buffer.byteLength === buffer.buffer.byteLength
        const data = full ? buffer : Buffer.from(buffer)
        try {
          this.worker.postMessage(
            { type: 'write', id, position, buffer: data },
            full ? [data.buffer as ArrayBuffer] : []
          )
        } catch (error) {
          this.pending.delete(id)
          this.release(buffer.length)
          reject(error instanceof Error ? error : new Error(String(error)))
        }
      }, reject)
    })
  }

  /** Flushes everything written before this call. */
  sync(): Promise<void> {
    return this.command('sync')
  }

  /** Writes what is queued, closes the file and stops the thread. */
  async close(): Promise<void> {
    if (this.closed) return
    try {
      await this.command('close')
    } finally {
      this.closed = true
      this.failAll(new Error('The disk writer is closed'))
      this.worker.removeAllListeners()
      await this.worker.terminate().catch(() => {})
    }
  }

  private command(type: 'sync' | 'close'): Promise<void> {
    if (this.closed) return Promise.reject(new Error('The disk writer is closed'))
    return new Promise((resolve, reject) => {
      const id = this.nextId++
      this.pending.set(id, { resolve, reject, bytes: 0 })
      try {
        this.worker.postMessage({ type, id })
      } catch (error) {
        this.pending.delete(id)
        reject(error instanceof Error ? error : new Error(String(error)))
      }
    })
  }

  private reserve(bytes: number): Promise<void> {
    if (this.closed) return Promise.reject(new Error('The disk writer is closed'))
    if (this.queuedBytes + bytes <= this.limitBytes) {
      this.queuedBytes += bytes
      return Promise.resolve()
    }
    return new Promise((resolve, reject) => {
      this.waiting.push({ bytes, resolve, reject })
    })
  }

  private release(bytes: number): void {
    this.queuedBytes = Math.max(0, this.queuedBytes - bytes)
    // Give the waiters that now fit their turn, oldest first. One that still doesn't fit stays in
    // line; it must not be retried in a loop with no space freed.
    for (let index = 0; index < this.waiting.length;) {
      const waiter = this.waiting[index]
      if (this.queuedBytes + waiter.bytes > this.limitBytes) {
        index++
        continue
      }
      this.waiting.splice(index, 1)
      this.queuedBytes += waiter.bytes
      waiter.resolve()
    }
  }

  private failAll(error: Error): void {
    this.closed = true
    for (const pending of this.pending.values()) pending.reject(error)
    this.pending.clear()
    this.queuedBytes = 0
    for (const waiter of this.waiting.splice(0)) waiter.reject(error)
  }
}
