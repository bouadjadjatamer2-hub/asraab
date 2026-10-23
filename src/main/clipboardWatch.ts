import { clipboard } from 'electron'

/** Copying a download link should be enough, as it is in IDM. Only links that name a file are
 * offered: a copied article URL is not a download. */
const POLL_MS = 900
const MAX_TEXT = 16 * 1024

const FILE_LINK =
  /^https?:\/\/[^\s]+\.(?:exe|msi|msix|zip|rar|7z|tar|gz|bz2|xz|iso|pdf|epub|mobi|docx?|xlsx?|pptx?|mp4|mkv|avi|mov|wmv|flv|webm|mp3|wav|flac|aac|ogg|m4a|apk|dmg|pkg|deb|rpm|jar|bin|img)(?:[?#][^\s]*)?$/i

let enabled = false
let timer: NodeJS.Timeout | null = null
let offerLink: ((url: string) => void) | null = null
/** The clipboard as it was when monitoring was switched on: not a link the user copied for this. */
let lastSeen = ''
let reading = false
const offered = new Set<string>()

/** Electron 44 answers the clipboard asynchronously; awaiting also covers older signatures. */
async function readClipboard(): Promise<string> {
  return String(await clipboard.readText())
    .slice(0, MAX_TEXT)
    .trim()
}

async function check(): Promise<void> {
  if (!enabled || reading) return
  reading = true
  try {
    const text = await readClipboard()
    if (!text || text === lastSeen) return
    lastSeen = text
    if (!FILE_LINK.test(text) || offered.has(text)) return
    offered.add(text)
    if (offered.size > 100) offered.delete(offered.values().next().value as string)
    offerLink?.(text)
  } finally {
    reading = false
  }
}

/** On: watch the clipboard and hand every new file link to `offer`. Off: stop, and forget what
 * was copied before the switch so turning it on doesn't immediately offer an old link. */
export async function setClipboardWatch(on: boolean, offer: (url: string) => void): Promise<void> {
  offerLink = offer
  enabled = on
  if (!on) {
    if (timer) clearInterval(timer)
    timer = null
    return
  }
  lastSeen = await readClipboard()
  if (timer) return
  timer = setInterval(() => void check(), POLL_MS)
  // A background app shouldn't be the reason the process stays alive.
  timer.unref?.()
}
