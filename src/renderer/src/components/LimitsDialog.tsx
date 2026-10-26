import { DEFAULT_DOWNLOAD_SCHEDULE, scheduleTime, validSchedule } from '@shared/downloadSchedule'
import { ScheduleFields } from './ScheduleFields'
import { DATA_LIMIT_PERIODS, dataUsageLabel, nextDataReset } from '@shared/dataLimits'
import {
  DEFAULT_SLOW_MODE_SPEED,
  DOWNLOADS_AT_ONCE,
  type AppSettings,
  type DataLimitPeriod,
  type NetworkPreference
} from '@shared/types'
import { Minus, Plus } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { intlLocale, locale, t } from '../i18n'
import { useNetworkUsage } from '../hooks/useNetworks'
import { useNetworkVisuals } from '../hooks/useNetworkVisuals'
import { useAppStore } from '../store/useAppStore'
import { describeError, formatBytes, formatDataUsage } from '../utils/format'
import { useFormatSpeedLimit } from '../hooks/useFormatSpeed'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction
} from './ui/alert-dialog'
import { Alert, AlertDescription } from './ui/alert'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogTitle } from './ui/dialog'
import { Input } from './ui/input'
import { Switch } from './ui/switch'
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group'

/** What the dialog edits: a copy taken when it opens, written back only on Save. */
type Draft = Pick<
  ReturnType<typeof useAppStore.getState>,
  | 'speedLimit'
  | 'slowMode'
  | 'slowModeSpeed'
  | 'downloadsAtOnce'
  | 'networkPreferences'
  | 'downloadSchedule'
  | 'turbo'
  | 'autoOrganize'
  | 'scanDownloads'
  | 'clipboardWatch'
  | 'shutdownWhenDone'
  | 'startAtLogin'
  | 'runInBackground'
>

/** All downloads as a fresh install has them. */
const GENERAL_DEFAULTS = {
  downloadSchedule: undefined,
  speedLimit: undefined,
  slowMode: false,
  slowModeSpeed: DEFAULT_SLOW_MODE_SPEED,
  downloadsAtOnce: DOWNLOADS_AT_ONCE.default,
  turbo: false,
  autoOrganize: true,
  scanDownloads: false,
  clipboardWatch: false,
  shutdownWhenDone: false,
  startAtLogin: true,
  runInBackground: true
} satisfies Partial<Draft>

const MB = 1024 ** 2
const GB = 1024 ** 3

/** A speed is typed in the unit picked in the footer; anything under one is a decimal. */
const SPEED_UNITS = {
  bytes: { label: 'MB/s', bytes: MB },
  bits: { label: 'Mbps', bytes: 1000 ** 2 / 8 }
}

const sectionClass = 'flex flex-col gap-2.5 border-t-[0.5px] border-border py-3'
const headingClass = 'font-sans text-[14px] leading-none font-semibold'
const hintClass = 'text-[12.5px] leading-snug text-[var(--text-secondary)]'
const navLabelClass =
  'px-2.5 pt-3 pb-1.5 font-mono text-[10px] tracking-[0.18em] text-muted-foreground uppercase'

/** A number of `unit`s typed in, as bytes; anything that isn't a positive number is ignored. */
function NumberInput({
  bytes,
  unit,
  unitBytes,
  label,
  disabled = false,
  onChange
}: {
  bytes: number
  unit: string
  unitBytes: number
  label: string
  disabled?: boolean
  onChange: (bytes: number) => void
}): React.JSX.Element {
  // Keep the draft as typed; changing units remounts it using the same byte value. Rounded, as
  // bytes saved in one unit rarely come out whole in another (20 MB/s is 167.77216 Mbps) — but
  // under one by significant digits, not decimals: 1 KB/s is 0.000977 MB/s, and two decimals read
  // that as a 0 MB/s limit that still applies.
  const [text, setText] = useState(() => {
    const value = bytes / unitBytes
    return String(Number(value >= 1 ? value.toFixed(2) : value.toPrecision(3)))
  })
  return (
    <span className="flex items-center gap-2">
      <Input
        aria-label={label}
        inputMode="decimal"
        disabled={disabled}
        value={text}
        onChange={(event) => {
          setText(event.target.value)
          const value = Number(event.target.value)
          const converted = Math.round(value * unitBytes)
          if (Number.isSafeInteger(converted) && converted > 0) onChange(converted)
        }}
        className="w-20 text-end font-mono tabular-nums"
      />
      <span className="font-mono text-[12px] text-muted-foreground">{unit}</span>
    </span>
  )
}

function SpeedInput({
  bytes,
  label,
  disabled = false,
  onChange
}: {
  bytes: number
  label: string
  disabled?: boolean
  onChange: (bytes: number) => void
}): React.JSX.Element {
  const unit = SPEED_UNITS[useAppStore((store) => store.speedUnit)]
  return (
    <NumberInput
      key={unit.label}
      bytes={bytes}
      unit={unit.label}
      unitBytes={unit.bytes}
      label={t('{label}, in {unit}', { label, unit: unit.label })}
      disabled={disabled}
      onChange={onChange}
    />
  )
}

/** No limit, or an editable limit: a speed when no unit is given. Turning it off retains the
 * last value while open. */
function LimitChoice({
  label,
  value,
  fallback,
  unit,
  unitBytes,
  onChange,
  children
}: {
  children?: React.ReactNode
  label: string
  value: number | undefined
  fallback: number
  unit?: string
  unitBytes?: number
  onChange: (bytes: number | undefined) => void
}): React.JSX.Element {
  const name = useId()
  const [lastValue, setLastValue] = useState(value ?? fallback)
  const enabled = value !== undefined
  const changeValue = (bytes: number): void => {
    setLastValue(bytes)
    onChange(bytes)
  }
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-col gap-2">
      <label className="flex w-fit items-center gap-2.5 text-[13px]">
        <input
          type="radio"
          name={name}
          checked={!enabled}
          onChange={() => {
            if (value !== undefined) setLastValue(value)
            onChange(undefined)
          }}
          className="size-4 accent-[var(--color-accent)]"
        />
        {t('No limit')}
      </label>
      <div className="flex flex-wrap items-center gap-2.5">
        <label className="flex items-center gap-2.5 text-[13px]">
          <input
            type="radio"
            name={name}
            checked={enabled}
            onChange={() => onChange(lastValue)}
            className="size-4 accent-[var(--color-accent)]"
          />
          {t('Limit to')}
        </label>
        {unit === undefined || unitBytes === undefined ? (
          <SpeedInput
            key={enabled ? 'on' : 'off'}
            bytes={value ?? lastValue}
            label={label}
            disabled={!enabled}
            onChange={changeValue}
          />
        ) : (
          <NumberInput
            key={enabled ? 'on' : 'off'}
            bytes={value ?? lastValue}
            unit={unit}
            unitBytes={unitBytes}
            label={t('{label}, in {unit}', { label, unit })}
            disabled={!enabled}
            onChange={changeValue}
          />
        )}
        {children}
      </div>
    </div>
  )
}

function SettingRow({
  label,
  hint,
  checked,
  onChange
}: {
  label: string
  hint: string
  checked: boolean
  onChange: (on: boolean) => void
}): React.JSX.Element {
  return (
    <label className="flex items-start justify-between gap-4 py-1">
      <span className="flex flex-col gap-0.5">
        <span className="text-[13.5px] leading-snug">{label}</span>
        <span className="text-[12px] leading-snug text-muted-foreground">{hint}</span>
      </span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  )
}

function GeneralPage({
  running,
  draft,
  change
}: {
  running: number
  draft: Draft
  change: (patch: Partial<Draft>) => void
}): React.JSX.Element {
  const { speedLimit, slowMode, slowModeSpeed, downloadsAtOnce } = draft
  const [confirmReset, setConfirmReset] = useState(false)
  const atDefaults = Object.entries(GENERAL_DEFAULTS).every(
    ([key, value]) => draft[key as keyof typeof GENERAL_DEFAULTS] === value
  )

  return (
    <>
      <div className="flex flex-col gap-1 pb-3">
        <h3 className="font-sans text-[18px] leading-none font-semibold">{t('All downloads')}</h3>
        <div className="font-mono text-[12px] text-muted-foreground">
          {running === 0
            ? t('No active downloads')
            : t('{n} downloading right now', { n: running })}
        </div>
      </div>

      <section className={sectionClass}>
        <h4 className={headingClass}>{t('Total speed')}</h4>
        <p className={hintClass}>{t('Limits the combined download speed across all networks.')}</p>
        <LimitChoice
          label={t('Total speed')}
          value={speedLimit}
          fallback={20 * MB}
          onChange={(speedLimit) => change({ speedLimit })}
        />
      </section>

      <section className={sectionClass}>
        <h4 className={headingClass}>{t('Slow mode')}</h4>
        <p className={hintClass}>
          {t('Replaces the total speed limit while enabled. Useful during calls or streaming.')}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <SpeedInput
            bytes={slowModeSpeed}
            label={t('Slow mode speed')}
            onChange={(slowModeSpeed) => change({ slowModeSpeed })}
          />
          <label className="ms-auto flex items-center gap-2 text-[13px]">
            {t('Enabled')}
            <Switch checked={slowMode} onCheckedChange={(slowMode) => change({ slowMode })} />
          </label>
        </div>
      </section>

      <section className={sectionClass}>
        <h4 className={headingClass}>{t('Downloads at once')}</h4>
        <p className={hintClass}>
          {t('Other downloads wait in the queue and start automatically.')}
        </p>
        <div className="flex items-center gap-3 text-[13.5px]">
          <div className="flex items-center rounded-lg border border-input">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={t('Decrease simultaneous downloads')}
              disabled={downloadsAtOnce <= DOWNLOADS_AT_ONCE.min}
              onClick={() => change({ downloadsAtOnce: downloadsAtOnce - 1 })}
            >
              <Minus />
            </Button>
            <output
              aria-label={t('Downloads at once')}
              className="w-8 text-center font-mono tabular-nums"
            >
              {downloadsAtOnce}
            </output>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={t('Increase simultaneous downloads')}
              disabled={downloadsAtOnce >= DOWNLOADS_AT_ONCE.max}
              onClick={() => change({ downloadsAtOnce: downloadsAtOnce + 1 })}
            >
              <Plus />
            </Button>
          </div>
          {t('at the same time')}
        </div>
      </section>
      <section className={sectionClass}>
        <h4 className={headingClass}>{t('Power & automation')}</h4>
        <p className={hintClass}>
          {t(
            'Turbo trades politeness for speed: more streams from the first byte, and smaller blocks so every connection stays busy.'
          )}
        </p>
        <div className="flex flex-col gap-1">
          <SettingRow
            label={t('Turbo mode')}
            hint={t(
              '16 to 64 streams per network, 4 MB blocks. A server that refuses extra connections still works.'
            )}
            checked={draft.turbo}
            onChange={(turbo) => change({ turbo })}
          />
          <SettingRow
            label={t('Sort finished files')}
            hint={t(
              'Move each download into a Video, Audio, Programs, Documents, Archives or Images folder.'
            )}
            checked={draft.autoOrganize}
            onChange={(autoOrganize) => change({ autoOrganize })}
          />
          <SettingRow
            label={t('Scan with Windows Defender')}
            hint={t('Runs a Defender scan on each finished file and reports the result.')}
            checked={draft.scanDownloads}
            onChange={(scanDownloads) => change({ scanDownloads })}
          />
          <SettingRow
            label={t('Watch the clipboard')}
            hint={t(
              'A file link you copy opens in New download, ready to start. Nothing starts on its own.'
            )}
            checked={draft.clipboardWatch}
            onChange={(clipboardWatch) => change({ clipboardWatch })}
          />
          <SettingRow
            label={t('Shut down when finished')}
            hint={t(
              'Once the queue is empty, Windows shuts down after 60 seconds. Cancel with: shutdown /a'
            )}
            checked={draft.shutdownWhenDone}
            onChange={(shutdownWhenDone) => change({ shutdownWhenDone })}
          />
        </div>
      </section>
      <section className={sectionClass}>
        <h4 className={headingClass}>{t('Startup & background')}</h4>
        <p className={hintClass}>
          {t('Keep Majra ready for links and downloads without leaving a window open.')}
        </p>
        <div className="flex flex-col gap-1">
          <SettingRow
            label={t('Start at login')}
            hint={t(
              'Open Majra automatically when you sign in. On Windows it starts hidden in the tray and appears in Task Manager → Startup.'
            )}
            checked={draft.startAtLogin}
            onChange={(startAtLogin) => change({ startAtLogin })}
          />
          <SettingRow
            label={t('Keep running in the background')}
            hint={t(
              'Closing the window leaves downloads and the browser extension running. Use Quit in the tray menu to exit fully.'
            )}
            checked={draft.runInBackground}
            onChange={(runInBackground) => change({ runInBackground })}
          />
        </div>
      </section>
      <ScheduleFields
        schedule={draft.downloadSchedule ?? DEFAULT_DOWNLOAD_SCHEDULE}
        onChange={(downloadSchedule) => change({ downloadSchedule })}
      />
      <div className="flex flex-wrap items-center gap-2 border-t-[0.5px] border-border pt-3">
        <Button
          variant="secondary"
          size="sm"
          disabled={atDefaults}
          onClick={() => setConfirmReset(true)}
        >
          {t('Reset to defaults')}
        </Button>
      </div>
      <AlertDialog open={confirmReset} onOpenChange={setConfirmReset}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('Reset all downloads to defaults?')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                'This resets total speed, slow mode, downloads at once, the download schedule, the power options and startup behaviour. Network limits stay unchanged.'
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('Cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={() => change(GENERAL_DEFAULTS)}>
              {t('Reset to defaults')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function NetworkPage({
  id,
  name,
  used,
  onUsageReset,
  preference,
  change
}: {
  id: string
  name: string
  used: number
  onUsageReset: () => void
  preference: NetworkPreference | undefined
  change: (patch: NetworkPreference) => void
}): React.JSX.Element {
  const dataLimit = preference?.dataLimit
  const period = preference?.dataLimitPeriod ?? 'month'
  const [reset, setReset] = useState<'usage' | 'limits' | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const confirmReset = async (): Promise<void> => {
    setBusy(true)
    setError(null)
    try {
      if (reset === 'usage') {
        await window.plexo.resetNetworkUsage(id)
        onUsageReset()
      } else change({ speedLimit: undefined, dataLimit: undefined })
      setReset(null)
    } catch (cause) {
      setError(describeError(cause))
    } finally {
      setBusy(false)
    }
  }
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(timer)
  }, [])

  return (
    <>
      <div className="flex flex-col gap-1 pb-3">
        <h3 className="font-sans text-[18px] leading-none font-semibold">{name}</h3>
        <div className="font-mono text-[12px] text-muted-foreground">
          {t('{size} used by Majra {period}', {
            size: formatBytes(used),
            period: dataUsageLabel(period, locale)
          })}
        </div>
      </div>

      <section className={sectionClass}>
        <h4 className={headingClass}>{t('Speed')}</h4>
        <p className={hintClass}>{t('Limits the combined download speed on {name}.', { name })}</p>
        <LimitChoice
          label={t('{name} speed', { name })}
          value={preference?.speedLimit}
          fallback={10 * MB}
          onChange={(speedLimit) => change({ speedLimit })}
        />
      </section>

      <section className={sectionClass}>
        <h4 className={headingClass}>{t('Data limit')}</h4>
        <p className={hintClass}>
          {t('Stops downloads on {name} at the limit. Uploads and other apps don’t count.', {
            name
          })}
        </p>
        <LimitChoice
          label={t('{name} data limit', { name })}
          value={dataLimit}
          fallback={5 * GB}
          unit="GB"
          unitBytes={GB}
          onChange={(limit) => change({ dataLimit: limit })}
        >
          <span className="text-[12px] text-muted-foreground">{t('per')}</span>
          <ToggleGroup
            aria-label={t('{name} data limit period', { name })}
            value={[period]}
            disabled={dataLimit === undefined}
            onValueChange={(values) => {
              const next = values[0]
              if (next === 'day' || next === 'week' || next === 'month') {
                change({ dataLimitPeriod: next })
              }
            }}
            size="sm"
            spacing={0.5}
            className="bg-secondary p-0.5"
          >
            {DATA_LIMIT_PERIODS.map((entry) => (
              <ToggleGroupItem key={entry.value} value={entry.value}>
                {t(entry.label)}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </LimitChoice>
        {dataLimit !== undefined && (
          <>
            <UsageBar used={used} limit={dataLimit} period={period} />
            <p className="text-[11.5px] text-muted-foreground">
              {t('Resets')}{' '}
              {period === 'day'
                ? t('tomorrow at midnight')
                : t('on {date}', {
                    date: nextDataReset(period, now).toLocaleDateString(intlLocale, {
                      day: 'numeric',
                      month: 'long'
                    })
                  })}
              . {period === 'week' && `${t('Weeks start Monday.')} `}
              {t('Raise the limit or reset data usage to keep using this network sooner.')}
            </p>
          </>
        )}
      </section>
      <div className="flex flex-wrap items-center gap-2 border-t-[0.5px] border-border pt-3">
        <Button
          variant="secondary"
          size="sm"
          disabled={busy || used === 0}
          onClick={() => setReset('usage')}
        >
          {t('Reset data usage')}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={busy || (preference?.speedLimit === undefined && dataLimit === undefined)}
          onClick={() => setReset('limits')}
        >
          {t('Remove limits')}
        </Button>
      </div>
      <AlertDialog open={reset !== null} onOpenChange={(open) => !open && !busy && setReset(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {reset === 'usage'
                ? t('Reset data usage for {name}?', { name })
                : t('Remove limits for {name}?', { name })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {reset === 'usage'
                ? t(
                    'This resets {name}’s usage {period} to zero. Its configured limits and usage for other periods stay unchanged. Downloads can use this network again if its data limit was reached.',
                    { name, period: dataUsageLabel(period, locale) }
                  )
                : t(
                    'This removes {name}’s speed and data limits. Its recorded data usage stays unchanged. The total speed limit and slow mode still apply.',
                    { name }
                  )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {error && (
            <p role="alert" className="text-[13px] text-destructive">
              {error}
            </p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>{t('Cancel')}</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy}
              onClick={(event) => {
                event.preventDefault()
                void confirmReset()
              }}
            >
              {reset === 'usage' ? t('Reset data usage') : t('Remove limits')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

/** "5.00 of 5 GB this month", with a bar that turns red once the limit is reached. */
function UsageBar({
  used,
  limit,
  period = 'month'
}: {
  used: number
  limit: number
  period?: DataLimitPeriod
}): React.JSX.Element {
  const reached = used >= limit
  const color = reached ? 'var(--color-danger)' : 'var(--color-wifi)'
  return (
    <div className="flex items-center gap-3">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full"
          style={{ width: `${Math.min(100, (used / limit) * 100)}%`, background: color }}
        />
      </div>
      <div
        className={`font-mono text-[11.5px] whitespace-nowrap ${reached ? 'text-[var(--color-danger)]' : 'text-muted-foreground'}`}
      >
        {t('{used} of {limit} {period}', {
          used: formatBytes(used),
          limit: formatBytes(limit),
          period: dataUsageLabel(period, locale)
        })}
      </div>
    </div>
  )
}

/** One line under a network's name: its limits, or that it has reached one. */
function describeLimits(
  preference: NetworkPreference | undefined,
  used: number,
  formatSpeedLimit: (bytesPerSec: number) => string
): string[] {
  if (preference?.dataLimit !== undefined && used >= preference.dataLimit) {
    return [t('Data limit reached')]
  }
  // A line each, said as the networks menu says them, so the two never read differently.
  const lines = [
    preference?.speedLimit !== undefined &&
      t('Limit {value}', { value: formatSpeedLimit(preference.speedLimit) }),
    preference?.dataLimit !== undefined && formatDataUsage(used, preference.dataLimit)
  ].filter((line): line is string => typeof line === 'string')
  return lines.length > 0 ? lines : [t('No limit')]
}

/** Speed & data limits: every download's together, and each network's. Nothing changes until
 * Save; Cancel (or Escape) leaves everything as it was. Resetting data usage is the exception:
 * it's an action, not a setting, so it happens once confirmed. */
export function LimitsDialog({
  showSchedule = false,
  open,
  onOpenChange,
  page,
  onPageChange
}: {
  showSchedule?: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The network shown, by interface id; null for General. */
  page: string | null
  onPageChange: (page: string | null) => void
}): React.JSX.Element {
  const contentRef = useRef<HTMLDivElement>(null)
  return (
    <Dialog open={open} disablePointerDismissal onOpenChange={onOpenChange}>
      <DialogContent
        ref={contentRef}
        initialFocus={
          showSchedule
            ? () => {
                contentRef.current
                  ?.querySelector<HTMLElement>(`[aria-label="${t('Download schedule')}"]`)
                  ?.scrollIntoView({ block: 'start' })
                return (
                  contentRef.current?.querySelector<HTMLElement>(
                    `[aria-label="${t('Enable download schedule')}"]`
                  ) ?? false
                )
              }
            : undefined
        }
        showCloseButton={false}
        className="flex h-[min(520px,calc(100%-2rem))] max-w-[680px] flex-col gap-0 p-0 sm:max-w-[680px]"
      >
        {/* Mounted only while open, so each opening starts a fresh draft. */}
        <LimitsEditor page={page} onPageChange={onPageChange} onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}

function LimitsEditor({
  page,
  onPageChange,
  onClose
}: {
  page: string | null
  onPageChange: (page: string | null) => void
  onClose: () => void
}): React.JSX.Element {
  const formatSpeedLimit = useFormatSpeedLimit()
  const interfaces = useAppStore((store) => store.interfaces)
  const [draft, setDraft] = useState<Draft>(() => {
    const {
      speedLimit,
      slowMode,
      slowModeSpeed,
      downloadsAtOnce,
      networkPreferences,
      downloadSchedule,
      turbo,
      autoOrganize,
      scanDownloads,
      clipboardWatch,
      shutdownWhenDone,
      startAtLogin,
      runInBackground
    } = useAppStore.getState()
    return {
      speedLimit,
      slowMode,
      slowModeSpeed,
      downloadsAtOnce,
      networkPreferences,
      downloadSchedule,
      turbo,
      autoOrganize,
      scanDownloads,
      clipboardWatch,
      shutdownWhenDone,
      startAtLogin,
      runInBackground
    }
  })
  const change = (patch: Partial<Draft>): void =>
    setDraft((previous) => ({ ...previous, ...patch }))
  const changeNetwork = (id: string, patch: NetworkPreference): void =>
    setDraft((previous) => ({
      ...previous,
      networkPreferences: {
        ...previous.networkPreferences,
        [id]: { ...previous.networkPreferences[id], ...patch }
      }
    }))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const valid = draft.downloadSchedule === undefined || validSchedule(draft.downloadSchedule)
  // Save one patch so the schedule and limits take effect together. Failed saves keep the draft.
  const save = async (): Promise<void> => {
    setSaving(true)
    setError(null)
    const store = useAppStore.getState()
    const patch: AppSettings = {}
    if (draft.speedLimit !== store.speedLimit) patch.speedLimit = draft.speedLimit
    if (draft.slowMode !== store.slowMode) patch.slowMode = draft.slowMode
    if (draft.slowModeSpeed !== store.slowModeSpeed) patch.slowModeSpeed = draft.slowModeSpeed
    if (draft.downloadsAtOnce !== store.downloadsAtOnce)
      patch.downloadsAtOnce = draft.downloadsAtOnce
    if (draft.downloadSchedule !== store.downloadSchedule)
      patch.downloadSchedule = draft.downloadSchedule
    if (draft.turbo !== store.turbo) patch.turbo = draft.turbo
    if (draft.autoOrganize !== store.autoOrganize) patch.autoOrganize = draft.autoOrganize
    if (draft.scanDownloads !== store.scanDownloads) patch.scanDownloads = draft.scanDownloads
    if (draft.clipboardWatch !== store.clipboardWatch) patch.clipboardWatch = draft.clipboardWatch
    if (draft.shutdownWhenDone !== store.shutdownWhenDone)
      patch.shutdownWhenDone = draft.shutdownWhenDone
    if (draft.startAtLogin !== store.startAtLogin) patch.startAtLogin = draft.startAtLogin
    if (draft.runInBackground !== store.runInBackground)
      patch.runInBackground = draft.runInBackground
    for (const [id, preference] of Object.entries(draft.networkPreferences)) {
      if (preference !== store.networkPreferences[id]) {
        patch.networkPreferences ??= { ...store.networkPreferences }
        patch.networkPreferences[id] = preference
      }
    }
    try {
      await window.plexo.updateSettings(patch)
      useAppStore.setState(patch)
      onClose()
    } catch (cause) {
      setError(describeError(cause))
      setSaving(false)
    }
  }
  const { speedLimit, slowMode, networkPreferences: preferences } = draft
  const running = useAppStore(
    (store) =>
      Object.values(store.downloads).filter((download) => download.status === 'downloading').length
  )
  const networkVisual = useNetworkVisuals()
  const [usageRevision, setUsageRevision] = useState(0)
  const usage = useNetworkUsage(true, usageRevision)
  const shown = interfaces.find((iface) => iface.id === page)

  const navItem = (
    key: string | null,
    dot: string,
    name: string,
    detail: string[],
    warn = false
  ): React.JSX.Element => (
    <button
      key={key ?? 'general'}
      type="button"
      aria-current={page === key ? 'page' : undefined}
      onClick={() => onPageChange(key)}
      className="flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-start outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring aria-[current=page]:bg-primary/10"
    >
      <span className="mt-1.5 size-2 shrink-0 rounded-full" style={{ background: dot }} />
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="truncate text-[13.5px] font-medium">{name}</span>
        {/* A line per fact, each cut off rather than wrapped: the sidebar is narrow. */}
        {detail.map((line) => (
          <span
            key={line}
            className={`truncate font-mono text-[11px] ${warn ? 'text-[var(--color-danger)]' : 'text-muted-foreground'}`}
          >
            {line}
          </span>
        ))}
      </span>
    </button>
  )

  return (
    <>
      <div className="flex items-center border-b-[0.5px] border-border px-4 py-3">
        <DialogTitle className="text-[16px] font-semibold">{t('Settings')}</DialogTitle>
      </div>
      <div className="flex min-h-0 flex-1">
        <nav className="flex w-[190px] shrink-0 flex-col gap-0.5 overflow-y-auto border-e-[0.5px] border-border p-2">
          <div className={navLabelClass}>{t('General')}</div>
          {navItem(null, 'var(--text-secondary)', t('All downloads'), [
            slowMode
              ? t('Slow mode on')
              : speedLimit
                ? t('Limit {value}', { value: formatSpeedLimit(speedLimit) })
                : t('No limit'),
            ...(draft.downloadSchedule?.enabled
              ? [
                  `${scheduleTime(draft.downloadSchedule.startMinute)}–${scheduleTime(draft.downloadSchedule.endMinute)}`
                ]
              : [])
          ])}
          <div className={navLabelClass}>{t('Networks')}</div>
          {interfaces.map((iface) => {
            const visual = networkVisual(iface.id, iface.kind, iface.displayName)
            const detail = describeLimits(
              preferences[iface.id],
              usage[iface.id] ?? 0,
              formatSpeedLimit
            )
            return navItem(
              iface.id,
              visual.solid,
              visual.name,
              detail,
              detail[0] === t('Data limit reached')
            )
          })}
        </nav>
        <fieldset disabled={saving} className="min-h-0 min-w-0 flex-1 overflow-y-auto px-4 py-3">
          {shown ? (
            <NetworkPage
              key={shown.id}
              id={shown.id}
              name={networkVisual(shown.id, shown.kind, shown.displayName).name}
              used={usage[shown.id] ?? 0}
              onUsageReset={() => setUsageRevision((value) => value + 1)}
              preference={preferences[shown.id]}
              change={(patch) => changeNetwork(shown.id, patch)}
            />
          ) : (
            <GeneralPage running={running} draft={draft} change={change} />
          )}
        </fieldset>
      </div>
      {(!valid || error) && (
        <div className="px-4 pb-2">
          <Alert variant="destructive">
            <AlertDescription>
              {error ?? t('Check schedule times, repeat days and end date.')}
            </AlertDescription>
          </Alert>
        </div>
      )}
      <div className="flex items-center justify-end gap-2 border-t-[0.5px] border-border px-4 py-2">
        <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
          {t('Cancel')}
        </Button>
        <Button type="button" disabled={!valid || saving} onClick={() => void save()}>
          {saving ? t('Saving…') : t('Save')}
        </Button>
      </div>
    </>
  )
}
