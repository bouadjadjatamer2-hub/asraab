import { execFile } from 'node:child_process'
import { testKnobs } from '../testKnobs'

// What kind of disk a download lands on. A rotating disk is happiest with fewer streams writing
// at once: every extra stream is another seek between distant offsets. An SSD has no such cost.
// Windows exposes the physical disk's media type; anywhere it can't be read, Auto keeps its
// ordinary count rather than guessing a slow disk.

export type DiskKind = 'hdd' | 'ssd' | 'unknown'

const cache = new Map<string, DiskKind>()

/** Runs a short PowerShell query and reads the first token of its answer. */
function query(drive: string): Promise<DiskKind> {
  const script = [
    `$p = Get-Partition -DriveLetter '${drive}' -ErrorAction Stop`,
    `$d = Get-Disk -Number $p.DiskNumber -ErrorAction Stop`,
    `$ph = Get-PhysicalDisk -DeviceNumber $d.Number -ErrorAction SilentlyContinue`,
    `if ($ph) { "$($ph.MediaType)|$($ph.BusType)" } else { "$($d.MediaType)|$($d.BusType)" }`
  ].join('; ')

  return new Promise((resolve) => {
    execFile(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-Command', script],
      { windowsHide: true, timeout: 8000 },
      (error, stdout) => {
        if (error) {
          resolve('unknown')
          return
        }
        const answer = String(stdout).trim().toLowerCase()
        if (answer.includes('hdd') || answer.includes('fixed hard disk')) resolve('hdd')
        else if (answer.includes('ssd')) resolve('ssd')
        else resolve('unknown')
      }
    )
  })
}

/** The kind of disk `path` is on, cached per drive letter. Never throws: an unreadable answer is
 * `unknown`, which leaves the stream count at its ordinary Auto value. */
export async function diskKindForPath(path: string): Promise<DiskKind> {
  const forced = testKnobs.diskKind
  if (forced) return forced
  if (process.platform !== 'win32') return 'unknown'
  const drive = /^([a-zA-Z]):/.exec(path)?.[1]?.toUpperCase()
  if (!drive) return 'unknown'
  const known = cache.get(drive)
  if (known) return known
  const kind = await query(drive)
  cache.set(drive, kind)
  return kind
}
