import type { ArchiveFormat } from './types'

/** What a file name says about the archive it holds. */
export interface ArchiveInfo {
  /** The format its bytes can be unpacked from, streaming as they arrive. Null when it's an
   * archive we know, but one that cannot be unpacked this way. */
  format: ArchiveFormat | null
  /** The folder it would be unpacked into: the file name without its archive extension. */
  base: string
  /** Why it can't be unpacked while downloading, when `format` is null. */
  reason?: string
}

const MULTIPART_RAR = /\.part\d+\.rar$/i
const SPLIT_ZIP = /\.zip\.\d{3}$/i
const SEVEN_ZIP = /\.7z(?:\.\d{3})?$/i

/** Drops `suffix` (a string or a pattern) from the end of `name`, keeping the rest as it was. */
function without(name: string, suffix: string | RegExp): string {
  if (typeof suffix === 'string') {
    return name.slice(0, name.length - suffix.length)
  }
  return name.replace(suffix, '')
}

/**
 * Recognises a single-file archive that can be unpacked as it downloads. RAR puts each file's
 * header before its data, ZIP has a local header per file that a streaming reader can follow, and
 * TAR is a plain sequence, so a sequential stream is enough for all three. 7z keeps its index at
 * the end and a multipart archive needs every part at once, so neither can.
 *
 * Null means "not an archive we offer to unpack": a plain file, a compressed single file (.gz),
 * a disc image, or a later part of a split archive.
 */
export function archiveInfo(fileName: string): ArchiveInfo | null {
  const name = fileName.trim()
  if (!name) return null

  if (MULTIPART_RAR.test(name)) {
    return {
      format: null,
      base: without(name, MULTIPART_RAR),
      reason:
        'This is one part of a multipart archive. It can’t be unpacked while downloading; save every part, then unpack them together.'
    }
  }
  if (SPLIT_ZIP.test(name)) {
    return {
      format: null,
      base: without(name, SPLIT_ZIP),
      reason:
        'This is one part of a split ZIP. It can’t be unpacked while downloading; save every part, then unpack them together.'
    }
  }
  if (SEVEN_ZIP.test(name)) {
    return {
      format: null,
      base: without(name, SEVEN_ZIP),
      reason:
        'A .7z archive keeps its index at the end, so it can’t be unpacked until it has fully downloaded. Save it and unpack it when it’s done.'
    }
  }

  if (/\.tar\.gz$/i.test(name)) return { format: 'tar', base: without(name, '.tar.gz') }
  if (/\.tar\.bz2$/i.test(name)) return { format: 'tar', base: without(name, '.tar.bz2') }
  if (/\.tar\.xz$/i.test(name)) return { format: 'tar', base: without(name, '.tar.xz') }
  if (/\.tgz$/i.test(name)) return { format: 'tar', base: without(name, '.tgz') }
  if (/\.tbz2$/i.test(name)) return { format: 'tar', base: without(name, '.tbz2') }
  if (/\.txz$/i.test(name)) return { format: 'tar', base: without(name, '.txz') }
  if (/\.tar$/i.test(name)) return { format: 'tar', base: without(name, '.tar') }
  if (/\.rar$/i.test(name)) return { format: 'rar', base: without(name, '.rar') }
  if (/\.zip$/i.test(name)) return { format: 'zip', base: without(name, '.zip') }

  return null
}

/** The folder an archive unpacks into, with what Windows won't take out of a folder name. */
export function extractFolderName(fileName: string): string {
  const info = archiveInfo(fileName)
  const base = (info?.base ?? fileName).trim()
  const cleaned = base
    .replace(/[<>:"/\\|?*\p{Cc}]/gu, '')
    .replace(/[. ]+$/g, '')
    .trim()
  return cleaned || 'Extracted'
}
