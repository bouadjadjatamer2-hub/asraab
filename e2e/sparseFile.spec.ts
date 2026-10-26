import { execFileSync } from 'node:child_process'
import { mkdtemp, open, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from '@playwright/test'
import { DownloadFile } from '../src/main/download/downloadFile'
import { markSparse } from '../src/main/download/sparseFile'

test('a staging file on NTFS is sparse, so a write far into it zeroes nothing first', async () => {
  test.skip(process.platform !== 'win32', 'NTFS only')
  const dir = await mkdtemp(join(tmpdir(), 'plexo-sparse-'))
  try {
    const sparse = join(dir, 'sparse.plexo')
    await (await open(sparse, 'wx+')).close()

    expect(await markSparse(sparse)).toBe(true)
    expect(execFileSync('fsutil', ['sparse', 'queryflag', sparse], { encoding: 'utf8' })).toMatch(
      /is set as sparse/i
    )
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('reserves the whole staging file without losing a resumed prefix', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'majra-reserve-'))
  try {
    for (const size of [1024, 8 * 1024 * 1024]) {
      const path = join(dir, `${size}.plexo`)
      const prefix = Buffer.from('already downloaded')
      await writeFile(path, prefix)
      const file = new DownloadFile(path)

      await file.reserve(size)
      await file.reserve(size) // a pause/resume asks again; it must be a no-op

      expect((await stat(path)).size).toBe(size)
      expect(await file.read(0, prefix.length)).toEqual(prefix)
      expect(await file.read(size - 4, 4)).toEqual(Buffer.alloc(4))
    }
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})
