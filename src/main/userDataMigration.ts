import { app } from 'electron'
import { cp, mkdir, readdir, rename, rm, rmdir, stat } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { testKnobs } from './testKnobs'

/** Every profile folder this app wrote before it was called Majra, newest first. */
const LEGACY_NAMES = ['Tayyar', 'Nzoul', 'Plexo']

async function exists(path: string): Promise<boolean> {
  try {
    await stat(path)
    return true
  } catch {
    return false
  }
}

/** An empty folder is not a profile: Chromium may create one before this runs. */
async function isNonEmptyDir(path: string): Promise<boolean> {
  try {
    return (await readdir(path)).length > 0
  } catch {
    return false
  }
}

/**
 * Carries the old profile over to `%APPDATA%\Majra` once: settings, history, download
 * manifests and the updater id all live there, and a rename would otherwise look like a
 * fresh install (losing the queue and every half-finished download).
 *
 * A profile that already exists is never overwritten. The old folder is renamed when it can
 * be; if another copy is still running and holds a lock, the files are copied instead, and
 * the old folder is left where it was. A failed copy is cleaned up so the next launch retries.
 *
 * @returns the legacy folder that was migrated, for the startup log
 */
export async function migrateLegacyUserData(): Promise<string | null> {
  // Tests run against a throwaway profile: never pull the real AppData into one.
  if (testKnobs.userDataDir) return null

  const target = app.getPath('userData')
  // Never overwrite a Majra profile. An empty folder can be cleared: there is nothing to lose.
  if (await isNonEmptyDir(target)) return null
  if (await exists(target)) await rmdir(target).catch(() => {})

  const appData = dirname(target)
  for (const name of LEGACY_NAMES) {
    const source = join(appData, name)
    if (!(await exists(source))) continue

    try {
      await rename(source, target)
      return source
    } catch {
      // Held open by a still-running older build: copy what can be read and keep going.
      try {
        await mkdir(target, { recursive: true })
        await cp(source, target, { recursive: true, force: true, errorOnExist: false })
        return source
      } catch (error) {
        // Only the copy is removed; the original profile is untouched.
        await rm(target, { recursive: true, force: true }).catch(() => {})
        console.error('[majra] could not migrate the old profile', source, error)
        return null
      }
    }
  }
  return null
}
