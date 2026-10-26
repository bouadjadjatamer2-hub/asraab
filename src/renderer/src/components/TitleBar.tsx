import { Globe2, RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { LOCALE_NAME } from '@shared/i18n'
import { t } from '../i18n'
import { useAppStore } from '../store/useAppStore'
import { TITLE_BAR_HEIGHT } from '../theme'
import { LogoMark } from './Logo'
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

const isMac = window.plexo.platform === 'darwin'
const VERSION = 'v1.2.2'

/** The window's title bar: the drop mark, the wordmark, and a quiet version stamp, on a strip
 * the window is dragged by. The OS's controls sit at the right (macOS: traffic lights at the
 * left). */
export function TitleBar(): React.JSX.Element {
  const turbo = useAppStore((store) => store.turbo)
  const locale = useAppStore((store) => store.locale)
  const pendingLocale = useAppStore((store) => store.pendingLocale)
  const setLocale = useAppStore((store) => store.setLocale)
  const cancelPendingLocale = useAppStore((store) => store.cancelPendingLocale)
  const [open, setOpen] = useState(false)
  const [restarting, setRestarting] = useState(false)

  // The button names the language it would switch to, in that language, so someone who reads
  // only Arabic can find it without reading the rest of the interface.
  const target = locale === 'en' ? 'ar' : 'en'
  const currentName = t(locale === 'ar' ? 'Arabic' : 'English')
  const pendingName = pendingLocale ? t(pendingLocale === 'ar' ? 'Arabic' : 'English') : null

  const choose = (): void => {
    if (pendingLocale === null) setLocale(target)
    setOpen(true)
  }

  const restart = async (): Promise<void> => {
    setRestarting(true)
    try {
      await window.plexo.relaunchApp()
    } catch {
      setRestarting(false)
    }
  }

  return (
    <div
      style={{ height: TITLE_BAR_HEIGHT }}
      className={`flex shrink-0 items-center gap-2.5 border-b-[0.5px] border-border bg-card ${
        isMac ? 'pl-[94px] pr-4' : 'pl-4 pr-[140px]'
      } [-webkit-app-region:drag]`}
    >
      <div aria-hidden className="h-[18px] w-[3px] rounded-full bg-accent" />
      <LogoMark className="size-[18px]" gradient />
      <div className="flex flex-col gap-[3px]">
        <div className="text-[11px] leading-none font-extrabold tracking-[0.24em] text-foreground">
          MAJRA
        </div>
        <div className="font-mono text-[7px] leading-none tracking-[0.18em] text-muted-foreground/80">
          MULTI-LINK TRANSFER
        </div>
      </div>
      {turbo && (
        <span
          className="ms-1 rounded-[4px] border border-accent/40 bg-accent/10 px-1.5 py-[2px] font-mono text-[8.5px] leading-none font-semibold tracking-[0.14em] text-[var(--color-usb-text)]"
          title={t('Turbo mode: more streams per network')}
        >
          {t('TURBO')}
        </span>
      )}
      <div className="flex-1" />

      {pendingLocale && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          title={t('Restart to apply {language}', { language: pendingName ?? '' })}
          className="flex h-6 items-center gap-1.5 rounded-[5px] border border-[#d8a44c]/45 bg-[#d8a44c]/12 px-2 font-sans text-[10px] font-semibold whitespace-nowrap text-[#a66f12] transition-colors hover:bg-[#d8a44c]/20 dark:text-[#e8bb6d] [-webkit-app-region:no-drag]"
        >
          <RotateCcw className="size-3" aria-hidden />
          {t('Restart to apply {language}', { language: pendingName ?? '' })}
        </button>
      )}

      <button
        type="button"
        onClick={choose}
        title={t(target === 'ar' ? 'Switch to Arabic' : 'Switch to English')}
        aria-label={t(target === 'ar' ? 'Switch to Arabic' : 'Switch to English')}
        className={`flex h-6 items-center gap-1.5 rounded-[5px] border bg-transparent px-2 font-sans text-[10.5px] leading-none font-semibold text-[var(--text-secondary)] transition-colors hover:border-accent/50 hover:bg-accent/5 hover:text-foreground [-webkit-app-region:no-drag] ${
          pendingLocale ? 'border-[#d8a44c]/50' : 'border-border'
        }`}
      >
        <Globe2 className="size-3.5 text-accent" aria-hidden />
        {LOCALE_NAME[target]}
        <span className="sr-only">{t('Language')}</span>
      </button>

      <span className="font-mono text-[9.5px] leading-none tracking-[0.08em] text-muted-foreground/70">
        {VERSION}
      </span>

      <AlertDialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next)
          if (!next) setRestarting(false)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingLocale
                ? t('Restart Majra to switch to {language}?', { language: pendingName ?? '' })
                : t('Language saved')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                'The app will restart to apply the new language. Your downloads will keep their progress.'
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-wrap">
            <AlertDialogCancel
              onClick={() => {
                cancelPendingLocale()
                setOpen(false)
              }}
            >
              {t('Keep {language}', { language: currentName })}
            </AlertDialogCancel>
            <AlertDialogCancel onClick={() => setOpen(false)}>{t('Later')}</AlertDialogCancel>
            <AlertDialogAction
              disabled={restarting}
              onClick={(event) => {
                event.preventDefault()
                void restart()
              }}
            >
              {restarting ? t('Restarting…') : t('Restart now')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
