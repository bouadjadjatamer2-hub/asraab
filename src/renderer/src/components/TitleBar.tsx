import { TITLE_BAR_HEIGHT } from '../theme'
import { useAppStore } from '../store/useAppStore'
import { LogoMark } from './Logo'

const isMac = window.plexo.platform === 'darwin'

/** The window's title bar: the mark, the name, and a quiet version stamp, on a strip the window
 * is dragged by. The OS's controls sit at the right (macOS: traffic lights at the left). */
export function TitleBar(): React.JSX.Element {
  const turbo = useAppStore((store) => store.turbo)
  return (
    <div
      style={{ height: TITLE_BAR_HEIGHT }}
      className={`flex shrink-0 items-center gap-2.5 border-b-[0.5px] border-border bg-card ${
        isMac ? 'pl-[94px] pr-4' : 'pl-4 pr-[140px]'
      } [-webkit-app-region:drag]`}
    >
      <LogoMark className="size-[17px]" gradient />
      <div className="text-[11px] leading-none font-semibold tracking-[0.3em] text-[var(--text-secondary)]">
        TAYYAR
      </div>
      {turbo && (
        <span
          className="rounded-full border border-[#8b6cff]/35 bg-[linear-gradient(90deg,rgba(139,108,255,0.16),rgba(34,211,238,0.14))] px-1.5 py-[2px] font-mono text-[8.5px] leading-none font-semibold tracking-[0.16em] text-[#8b6cff]"
          title="Turbo mode: more streams per network"
        >
          TURBO
        </span>
      )}
      <div className="flex-1" />
      <span className="font-mono text-[9.5px] leading-none tracking-[0.08em] text-muted-foreground/70">
        v1.0
      </span>
    </div>
  )
}
