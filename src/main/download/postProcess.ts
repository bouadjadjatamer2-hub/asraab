import { spawn } from 'node:child_process'
import { existsSync, readdirSync } from 'node:fs'
import { lstat, mkdir, rename } from 'node:fs/promises'
import { basename, dirname, extname, join } from 'node:path'

/** Folders a finished file is sorted into, the way IDM's categories work: by what the file is,
 * not by where it came from. */
export const CATEGORIES = {
  Video: 'mp4 mkv avi mov wmv flv webm m4v mpg mpeg ts m2ts',
  Audio: 'mp3 wav flac aac ogg m4a opus wma aiff',
  Programs: 'exe msi msix appx bat cmd ps1 jar apk dmg pkg deb rpm',
  Documents: 'pdf doc docx xls xlsx ppt pptx txt rtf odt ods epub mobi csv',
  Archives: 'zip rar 7z tar gz bz2 xz iso cab',
  Images: 'jpg jpeg png gif bmp webp svg tif tiff heic ico'
} as const

const BY_EXTENSION = new Map<string, string>(
  Object.entries(CATEGORIES).flatMap(([category, extensions]) =>
    extensions.split(' ').map((extension) => [`.${extension}`, category] as const)
  )
)

export function categoryOf(path: string): string {
  return BY_EXTENSION.get(extname(path).toLowerCase()) ?? 'Other'
}

async function freeName(directory: string, fileName: string): Promise<string> {
  const extension = extname(fileName)
  const stem = fileName.slice(0, fileName.length - extension.length)
  for (let index = 0; index < 10_000; index += 1) {
    const candidate = join(directory, index === 0 ? fileName : `${stem} (${index})${extension}`)
    try {
      await lstat(candidate)
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return candidate
      throw error
    }
  }
  throw new Error(`No free name for ${fileName}`)
}

/** Moves a finished download into `<its folder>/<Category>/`. Never throws its way out of a
 * completed download: a file left where it is beats one reported failed after it arrived. */
export async function organizeFile(path: string): Promise<string> {
  try {
    const directory = join(dirname(path), categoryOf(path))
    await mkdir(directory, { recursive: true })
    const target = await freeName(directory, basename(path))
    await rename(path, target)
    return target
  } catch {
    return path
  }
}

function defenderPath(): string | null {
  const direct = 'C:\\Program Files\\Windows Defender\\MpCmdRun.exe'
  if (existsSync(direct)) return direct
  const platform = 'C:\\ProgramData\\Microsoft\\Windows Defender\\Platform'
  try {
    const versions = readdirSync(platform)
      .filter((entry) => /^\d+\.\d+/.test(entry))
      .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))
    for (const version of versions) {
      const candidate = join(platform, version, 'MpCmdRun.exe')
      if (existsSync(candidate)) return candidate
    }
  } catch {
    // No platform folder: Defender isn't installed or isn't readable.
  }
  return null
}

export interface ScanResult {
  status: 'clean' | 'threat' | 'unavailable' | 'error'
  detail?: string
}

/** Scans one file with Windows Defender. Reports, never blocks the download list: the file is
 * already complete and the user can open it whatever the scan says. */
export function scanFile(path: string): Promise<ScanResult> {
  const defender = defenderPath()
  if (!defender) {
    return Promise.resolve({ status: 'unavailable', detail: 'Windows Defender not found' })
  }

  return new Promise((resolve) => {
    const child = spawn(
      defender,
      ['-Scan', '-ScanType', '3', '-File', path, '-DisableRemediation'],
      { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] }
    )
    let output = ''
    const gather = (chunk: Buffer): void => {
      if (output.length < 4000) output += chunk.toString()
    }
    child.stdout?.on('data', gather)
    child.stderr?.on('data', gather)
    const timer = setTimeout(() => child.kill(), 5 * 60_000)
    child.on('error', (error) => {
      clearTimeout(timer)
      resolve({ status: 'error', detail: error.message })
    })
    child.on('close', (code) => {
      clearTimeout(timer)
      // 0: no threats. 2: threats found (and not remediated).
      if (code === 0) resolve({ status: 'clean' })
      else if (code === 2) resolve({ status: 'threat', detail: 'Windows Defender found a threat.' })
      else resolve({ status: 'error', detail: `Defender exited with code ${code}` })
    })
  })
}
