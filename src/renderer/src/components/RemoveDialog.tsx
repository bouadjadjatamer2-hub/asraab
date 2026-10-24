import { isDone, isFailed, type DownloadItem } from '../utils/downloadActions'
import { t, tn } from '../i18n'
import { TRASH_NAME } from './downloadActionMeta'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from './ui/alert-dialog'
import { buttonVariants } from './ui/button'

/** What the dialog asks about: `remove` takes downloads off the list (their files stay), `cancel`
 * stops unfinished ones, `trash` moves their files to the Trash. */
export type RemoveMode = 'remove' | 'cancel' | 'trash'

/** The one confirmation for taking downloads away, wherever it's asked from: a download's own
 * screen, the list's toolbar and menu, and clearing the finished list. */
export function RemoveDialog({
  open,
  onOpenChange,
  mode,
  items,
  clearAll = false,
  busy = false,
  error = null,
  onConfirm
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: RemoveMode
  items: DownloadItem[]
  /** Clearing the whole finished list: no per-file choices. */
  clearAll?: boolean
  busy?: boolean
  error?: string | null
  onConfirm: () => void
}): React.JSX.Element {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <RemoveDialogBody
          mode={mode}
          items={items}
          clearAll={clearAll}
          busy={busy}
          error={error}
          onConfirm={onConfirm}
        />
      </AlertDialogContent>
    </AlertDialog>
  )
}

function RemoveDialogBody({
  mode,
  items,
  clearAll,
  busy,
  error,
  onConfirm
}: {
  mode: RemoveMode
  items: DownloadItem[]
  clearAll: boolean
  busy: boolean
  error: string | null
  onConfirm: () => void
}): React.JSX.Element {
  const count = items.length
  const one = count === 1
  const anyFailed = items.some(isFailed)
  const anyFinished = items.some(isDone)

  let title: string
  let description: string
  let confirm: string
  let dismiss = t('Cancel')
  let destructive = true
  if (mode === 'cancel') {
    title = one
      ? t('Cancel download?')
      : t('Cancel {downloads}?', {
          downloads: tn(count, '{n} download', '{n} downloads')
        })
    description = t('The part already downloaded will be deleted.')
    confirm = one ? t('Cancel download') : t('Cancel downloads')
    dismiss = t('Keep')
  } else if (mode === 'trash') {
    // Said as what it comes to: the file is deleted, into the Trash.
    title = one
      ? t('Delete file?')
      : t('Delete {files}?', { files: tn(count, '{n} file', '{n} files') })
    description = t(
      one ? 'The file will be moved to the {trash}.' : 'The files will be moved to the {trash}.',
      {
        trash: TRASH_NAME
      }
    )
    confirm = one ? t('Delete file') : t('Delete files')
  } else {
    title = clearAll
      ? t('Clear finished list?')
      : one
        ? t('Remove from list?')
        : t('Remove {downloads} from list?', {
            downloads: tn(count, '{n} download', '{n} downloads')
          })
    description = !anyFailed
      ? one && !clearAll
        ? t('The downloaded file stays on your computer.')
        : t('The downloaded files stay on your computer.')
      : anyFinished
        ? t(
            'Finished files stay on your computer. Failed downloads lose the part they already downloaded.'
          )
        : t('The part already downloaded will be deleted.')
    confirm = clearAll ? t('Clear list') : t('Remove')
    // Only the list changes, unless a failed one's partial data goes with it.
    destructive = anyFailed
  }

  return (
    <>
      <AlertDialogHeader>
        <AlertDialogTitle>{title}</AlertDialogTitle>
        <AlertDialogDescription>{description}</AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        {error && (
          <p role="alert" className="text-[13px] text-destructive">
            {error}
          </p>
        )}
        <AlertDialogCancel disabled={busy}>{dismiss}</AlertDialogCancel>
        <AlertDialogAction
          disabled={busy || count === 0}
          className={buttonVariants({
            variant: destructive ? 'destructive' : 'default',
            size: 'sm'
          })}
          onClick={(event) => {
            // Stays open until the removal is done, and open if it fails.
            event.preventDefault()
            onConfirm()
          }}
        >
          {confirm}
        </AlertDialogAction>
      </AlertDialogFooter>
    </>
  )
}
