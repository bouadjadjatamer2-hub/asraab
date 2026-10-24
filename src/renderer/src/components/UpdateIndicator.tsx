import type { UpdateState } from '@shared/types'
import { cn } from 'cn'
import { CircleAlert, CircleArrowUp, LoaderCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { t } from '../i18n'
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip'

function describe({ status, version, percent, autoUpdate }: UpdateState): string {
  switch (status) {
    case 'checking':
      return t('Checking for updates…')
    case 'available':
      return t('Tayyar {version} is available', { version })
    case 'downloading':
      return t('Downloading Tayyar {version}… {percent}%', { version, percent })
    case 'ready':
      return t('Tayyar {version} is ready — restart to update', { version })
    case 'error':
      return t('Couldn’t install Tayyar {version}', { version })
    default:
      return autoUpdate ? t('Tayyar updates automatically') : t('Automatic updates are off')
  }
}

/** Where the app's own update is, at a glance. Clicking opens the update menu (see
 * main/updater.ts) — natively, so it's the same menu as the macOS app menu's. */
export function UpdateIndicator(): React.JSX.Element {
  const [update, setUpdate] = useState<UpdateState>({ status: 'idle', autoUpdate: true })

  useEffect(() => {
    const stop = window.plexo.onUpdateState(setUpdate)
    window.plexo.updateState().then(setUpdate, () => {})
    return stop
  }, [])

  const { status, percent } = update
  const label = describe(update)
  const text =
    status === 'downloading'
      ? `${percent}%`
      : status === 'ready'
        ? t('Restart to update')
        : status === 'available'
          ? t('Update')
          : null
  const busy = status === 'checking' || status === 'downloading'
  const Icon = busy ? LoaderCircle : status === 'error' ? CircleAlert : CircleArrowUp

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            aria-label={label}
            onClick={() => void window.plexo.showUpdateMenu()}
            className={cn(
              'flex h-[26px] min-w-[26px] shrink-0 cursor-default items-center justify-center gap-1.5 rounded-[6px] border-[0.5px] border-border bg-secondary px-[5px] [-webkit-app-region:no-drag]',
              status === 'available' || status === 'ready'
                ? 'text-primary'
                : 'text-[var(--text-secondary)]'
            )}
          >
            <Icon size={15} strokeWidth={1.3} className={busy ? 'animate-spin' : undefined} />
            {text && <span className="tabular-nums">{text}</span>}
          </button>
        }
      />
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}
