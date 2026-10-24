import {
  Copy,
  Download,
  ExternalLink,
  FolderOpen,
  ListX,
  Pause,
  Play,
  RotateCw,
  Trash2,
  Wrench,
  X,
  type LucideIcon
} from 'lucide-react'
import { t, tn } from '../i18n'
import type { ActionId, DownloadItem } from '../utils/downloadActions'

const MAC = window.plexo.platform === 'darwin'
export const TRASH_NAME = t(window.plexo.platform === 'win32' ? 'Recycle Bin' : 'Trash')
const REVEAL_LABEL = t(MAC ? 'Show in Finder' : 'Show in folder')

function downloads(count: number): string {
  return tn(count, '{n} download', '{n} downloads')
}

function files(count: number): string {
  return tn(count, '{n} file', '{n} files')
}

interface ActionMeta {
  /** For one download: menus and a download's own screen. */
  label: string
  /** For several, in a menu. */
  many?: (count: number) => string
  /** On the selection toolbar's own button, before the count. */
  toolbar?: string
  /** For one download only: its toolbar button has no count. */
  single?: boolean
  /** What its button says while it works. */
  working?: string
  /** The title of the dialog that says it didn't work. */
  failure: string
  icon: LucideIcon
  destructive?: boolean
}

export const ACTION_META: Record<ActionId, ActionMeta> = {
  pause: {
    label: t('Pause'),
    many: (n) => t('Pause {downloads}', { downloads: downloads(n) }),
    toolbar: t('Pause'),
    working: t('Pausing'),
    failure: t('Couldn’t pause'),
    icon: Pause
  },
  resume: {
    label: t('Resume'),
    many: (n) => t('Resume {downloads}', { downloads: downloads(n) }),
    toolbar: t('Resume'),
    working: t('Resuming'),
    failure: t('Couldn’t resume'),
    icon: Play
  },
  retry: {
    label: t('Retry'),
    many: (n) => t('Retry {downloads}', { downloads: downloads(n) }),
    toolbar: t('Retry'),
    working: t('Retrying'),
    failure: t('Couldn’t retry'),
    icon: RotateCw
  },
  fix: {
    label: t('Fix link'),
    toolbar: t('Fix link'),
    single: true,
    failure: t('Something went wrong'),
    icon: Wrench
  },
  again: {
    label: t('Download again'),
    toolbar: t('Download again'),
    single: true,
    failure: t('Couldn’t start again'),
    icon: Download
  },
  open: {
    label: t('Open'),
    toolbar: t('Open'),
    single: true,
    failure: t('Couldn’t open file'),
    icon: ExternalLink
  },
  reveal: {
    label: REVEAL_LABEL,
    toolbar: REVEAL_LABEL,
    single: true,
    failure: t('Couldn’t show file'),
    icon: FolderOpen
  },
  copy: {
    label: t('Copy link'),
    many: (n) => t('Copy {links}', { links: tn(n, '{n} link', '{n} links') }),
    failure: t('Couldn’t copy link'),
    icon: Copy
  },
  cancel: {
    label: t('Cancel download'),
    many: (n) => t('Cancel {downloads}', { downloads: downloads(n) }),
    toolbar: t('Cancel downloads'),
    failure: t('Something went wrong'),
    icon: X,
    destructive: true
  },
  remove: {
    label: t('Remove from list'),
    many: (n) => t('Remove {downloads} from list', { downloads: downloads(n) }),
    toolbar: t('Remove from list'),
    failure: t('Something went wrong'),
    icon: ListX
  },
  trash: {
    label: t('Move file to {trash}', { trash: TRASH_NAME }),
    many: (n) => t('Move {files} to {trash}', { files: files(n), trash: TRASH_NAME }),
    toolbar: t('Move to {trash}', { trash: TRASH_NAME }),
    failure: t('Something went wrong'),
    icon: Trash2,
    destructive: true
  }
}

/** The name in a menu: spelled out for several ("Pause 3 downloads"). */
export function menuLabel(id: ActionId, items: DownloadItem[]): string {
  const meta = ACTION_META[id]
  if (id === 'copy' && items.every((item) => item.url.startsWith('magnet:')))
    return items.length > 1
      ? t('Copy {n} magnet links', { n: items.length })
      : t('Copy magnet link')
  return items.length > 1 && meta.many ? meta.many(items.length) : meta.label
}

/** The name on a toolbar button: with the count, however many ("Pause (1)"). */
export function toolbarLabel(id: ActionId, count: number): string {
  const meta = ACTION_META[id]
  const name = meta.toolbar ?? meta.label
  return meta.single ? name : `${name} (${count})`
}
