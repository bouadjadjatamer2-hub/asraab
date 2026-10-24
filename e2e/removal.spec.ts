import { existsSync } from 'node:fs'
import { mkdir, readFile, rename, symlink, unlink, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { BLOCK, expect, test, treeSha, type PlexoApp } from './fixtures'
import { seededBytes } from './origin'
import { named, Swarm, torrentFileOnDisk } from './torrentSwarm'

/** Hold the actual history save, rather than relying on a quick click landing in its window. */
async function holdHistoryWrite(plexo: PlexoApp): Promise<void> {
  await plexo.evaluateMain(() => {
    const fs = process.getBuiltinModule('node:fs/promises')
    const { basename } = process.getBuiltinModule('node:path')
    const original = fs.rename
    const globals = globalThis as Record<string, unknown>
    let release!: () => void
    const held = new Promise<void>((resolve) => {
      release = resolve
    })
    globals.__releaseHistory = () => {
      fs.rename = original
      release()
    }
    fs.rename = async (...args: Parameters<typeof original>) => {
      if (basename(String(args[1])) === 'history.json') {
        globals.__historyHeld = true
        await held
      }
      return original(...args)
    }
  }, null)
}

async function releaseHistoryWrite(plexo: PlexoApp): Promise<void> {
  await plexo.evaluateMain(() => {
    const globals = globalThis as Record<string, unknown>
    if (typeof globals.__releaseHistory === 'function') globals.__releaseHistory()
  }, null)
}

async function waitForHistoryWrite(plexo: PlexoApp): Promise<void> {
  await expect
    .poll(() =>
      plexo.evaluateMain(() => (globalThis as Record<string, unknown>).__historyHeld, null)
    )
    .toBe(true)
}

async function stubTrash(plexo: PlexoApp, destination: string): Promise<void> {
  await mkdir(destination)
  await plexo.evaluateMain(({ shell }, dest) => {
    shell.trashItem = async (path: string): Promise<void> => {
      const { rename } = process.getBuiltinModule('node:fs/promises')
      const { basename, join } = process.getBuiltinModule('node:path')
      await rename(path, join(dest, basename(path)))
    }
  }, destination)
}

test.describe('removal during completion @smoke', () => {
  for (const action of ['remove', 'clear', 'trash'] as const) {
    test(`${action} waits for the pending history save and stays removed after restart`, async ({
      plexo,
      serve,
      dirs
    }) => {
      const trash = join(dirs.dest, 'test-trash')
      if (action === 'trash') await stubTrash(plexo, trash)
      await holdHistoryWrite(plexo)
      try {
        const origin = await serve({ size: BLOCK })
        const id = await plexo.start(origin.url(), origin.sha256)
        await waitForHistoryWrite(plexo)
        const completed = (await plexo.api.listDownloads()).find(
          (entry) => entry.state.id === id
        )!.state
        expect(completed.status).toBe('completed')

        const removing =
          action === 'clear'
            ? plexo.api.clearHistory()
            : plexo.api.removeDownload(id, { trashFile: action === 'trash' })
        // Sent after removal on the same renderer IPC connection: removal has reached main.
        await plexo.api.listDownloads()
        await releaseHistoryWrite(plexo)
        await removing

        expect((await plexo.api.listHistory()).find((entry) => entry.id === id)).toBeUndefined()
        expect(
          (await plexo.api.listDownloads()).find((entry) => entry.state.id === id)
        ).toBeUndefined()
        expect(existsSync(completed.destinationPath)).toBe(action !== 'trash')
        if (action === 'trash') expect(existsSync(join(trash, completed.fileName))).toBe(true)
        await plexo.relaunch()
        expect(await plexo.all()).toEqual([])
      } finally {
        if (plexo.alive) await releaseHistoryWrite(plexo).catch(() => {})
      }
    })
  }

  test('trashing a just-finished torrent waits for its owned-file history record', async ({
    plexo,
    dirs
  }) => {
    const swarm = await new Swarm().start()
    try {
      const files = [
        named(seededBytes(BLOCK, 121), 'a.bin'),
        named(seededBytes(BLOCK, 122), 'b.bin')
      ]
      const torrent = await swarm.seed(files, { folder: 'Finished', pieceLength: 16 * 1024 })
      const trash = join(dirs.dest, 'test-trash')
      await stubTrash(plexo, trash)
      await holdHistoryWrite(plexo)
      const id = await plexo.start(
        await torrentFileOnDisk(torrent),
        treeSha(files.map((data) => ({ path: (data as { name?: string }).name!, data })))
      )
      await waitForHistoryWrite(plexo)
      const completed = (await plexo.api.listDownloads()).find(
        (entry) => entry.state.id === id
      )!.state
      await writeFile(join(completed.destinationPath, 'personal.txt'), 'keep me')
      const removing = plexo.api.removeDownload(id, { trashFile: true })
      await plexo.api.listDownloads()
      await releaseHistoryWrite(plexo)
      await removing

      expect(await readFile(join(completed.destinationPath, 'personal.txt'), 'utf8')).toBe(
        'keep me'
      )
      for (const name of ['a.bin', 'b.bin']) {
        expect(existsSync(join(completed.destinationPath, name))).toBe(false)
        expect(existsSync(join(trash, name))).toBe(true)
      }
      expect(await plexo.all()).toEqual([])
    } finally {
      if (plexo.alive) await releaseHistoryWrite(plexo).catch(() => {})
      await swarm.stop()
    }
  })
})

test('cancelling a torrent whose folder became a link removes the row without following it @smoke', async ({
  plexo
}) => {
  const swarm = await new Swarm().start()
  try {
    const files = [
      named(seededBytes(32 * BLOCK, 111), 'a.bin'),
      named(seededBytes(32 * BLOCK, 112), 'b.bin')
    ]
    const torrent = await swarm.seed(files, {
      folder: 'Partial',
      pieceLength: 16 * 1024,
      uploadLimit: 64 * 1024
    })
    const id = await plexo.start(
      await torrentFileOnDisk(torrent),
      treeSha(files.map((data) => ({ path: (data as { name?: string }).name!, data })))
    )
    await plexo.api.pauseDownload(id)
    const paused = await plexo.waitForTorrentStatus('paused')
    await writeFile(join(paused.destinationPath, 'personal.txt'), 'keep me')
    const original = paused.destinationPath + '.original'
    await rename(paused.destinationPath, original)
    await symlink(original, paused.destinationPath, 'junction')

    // The row goes at once, like any other cancellation. The folder's owned-file check refuses to
    // follow the link, so the retries leave both the link and what it points at untouched.
    await plexo.api.removeDownload(id)
    expect((await plexo.api.listDownloads()).find((entry) => entry.state.id === id)).toBeUndefined()
    const row = plexo.page.getByRole('button', { name: `Open ${paused.fileName}`, exact: true })
    await expect(row).toHaveCount(0)
    await plexo.page.waitForTimeout(4_000)
    expect(existsSync(paused.destinationPath)).toBe(true)
    expect(await readFile(join(original, 'personal.txt'), 'utf8')).toBe('keep me')

    await plexo.relaunch()
    expect((await plexo.api.listDownloads()).find((entry) => entry.state.id === id)).toBeUndefined()
    await expect(
      plexo.page.getByRole('button', { name: `Open ${paused.fileName}`, exact: true })
    ).toHaveCount(0)
    expect(existsSync(paused.destinationPath)).toBe(true)
    expect(await readFile(join(original, 'personal.txt'), 'utf8')).toBe('keep me')

    await unlink(paused.destinationPath)
    await rename(original, paused.destinationPath)
  } finally {
    await swarm.stop()
  }
})

test('startup finishes a cancellation that a crash interrupted @smoke', async ({
  plexo,
  serve,
  dirs
}) => {
  const origin = await serve({ size: 24 * BLOCK })
  const reached = origin.hold(7 * BLOCK)
  const id = await plexo.start(origin.url(), origin.sha256)
  await reached
  await plexo.api.pauseDownload(id)
  const paused = await plexo.waitForHttpStatus('paused')
  origin.release()
  const staging = `${paused.destinationPath}.plexo`
  const manifestDir = join(dirs.userData, 'downloads', id)
  expect(existsSync(staging)).toBe(true)
  // What beginCancel writes before it stops anything. A crash after this point must not bring the
  // cancelled download back as paused on the next start.
  await writeFile(
    join(dirs.userData, 'pending-deletions.json'),
    JSON.stringify([staging, paused.destinationPath, manifestDir]),
    'utf-8'
  )
  await plexo.relaunch()
  await expect.poll(() => existsSync(staging), { timeout: 20_000 }).toBe(false)
  await expect.poll(() => existsSync(manifestDir), { timeout: 20_000 }).toBe(false)
  expect((await plexo.api.listDownloads()).find((entry) => entry.state.id === id)).toBeUndefined()
  expect(await plexo.all()).toEqual([])
})

test('cancellation removes the row immediately and deletes a locked file in the background @smoke', async ({
  plexo,
  serve,
  dirs
}) => {
  const origin = await serve({ size: 24 * BLOCK })
  const reached = origin.hold(7 * BLOCK)
  const id = await plexo.start(origin.url(), origin.sha256)
  await reached
  const state = (await plexo.currentHttp())!
  const staging = `${state.destinationPath}.plexo`
  const manifestDir = join(dirs.userData, 'downloads', id)
  await plexo.evaluateMain((_electron, path) => {
    const fs = process.getBuiltinModule('node:fs/promises')
    const original = fs.rm
    const globals = globalThis as Record<string, unknown>
    let release!: () => void
    const held = new Promise<void>((resolve) => {
      release = resolve
    })
    globals.__releaseDiscard = () => {
      fs.rm = original
      release()
    }
    fs.rm = async (...args: Parameters<typeof original>) => {
      if (args[0] === path) {
        globals.__discardHeld = true
        await held
        throw Object.assign(new Error('Permission denied removing partial data'), {
          code: 'EACCES'
        })
      }
      return original(...args)
    }
  }, staging)
  try {
    // The UI gets its answer at once: the row is gone before the locked file is deleted.
    await plexo.api.removeDownload(id)
    expect((await plexo.api.listDownloads()).find((entry) => entry.state.id === id)).toBeUndefined()
    await expect(
      plexo.page.getByRole('button', { name: `Open ${state.fileName}`, exact: true })
    ).toHaveCount(0)

    // Cleanup is trying in the background; the user was shown no error.
    await expect
      .poll(() =>
        plexo.evaluateMain(() => (globalThis as Record<string, unknown>).__discardHeld, null)
      )
      .toBe(true)
    await plexo.api.removeDownload(id)
    await plexo.api.resumeDownload(id).catch(() => {})
    expect((await plexo.api.listDownloads()).find((entry) => entry.state.id === id)).toBeUndefined()

    // Let the held delete fail; the retry queue then removes it once the lock is gone.
    await plexo.evaluateMain(() => {
      ;((globalThis as Record<string, unknown>).__releaseDiscard as () => void)()
    }, null)
    await expect.poll(() => existsSync(staging), { timeout: 15_000 }).toBe(false)
    await expect.poll(() => existsSync(manifestDir), { timeout: 15_000 }).toBe(false)
    expect((await plexo.all()).find((entry) => entry.id === id)).toBeUndefined()
  } finally {
    if (plexo.alive)
      await plexo
        .evaluateMain(() => {
          ;((globalThis as Record<string, unknown>).__releaseDiscard as () => void)()
        }, null)
        .catch(() => {})
    origin.release()
  }
})
