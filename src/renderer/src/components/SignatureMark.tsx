/** A small, purely decorative signature at the bottom-right edge of the window. It never takes
 * pointer events, never carries meaning the interface depends on, and stays out of the way of
 * the status bar's own controls. */
export function SignatureMark(): React.JSX.Element {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute right-2.5 bottom-[5px] flex items-center gap-1 opacity-60 select-none"
    >
      <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden>
        <defs>
          <linearGradient id="tamer-signature" x1="2" y1="2" x2="14" y2="14">
            <stop stopColor="#8b6cff" />
            <stop offset="1" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
        <circle cx="8" cy="8" r="6.7" stroke="url(#tamer-signature)" strokeOpacity="0.5" />
        <path
          d="M4.4 5.1h7.2M8 5.1v6"
          stroke="url(#tamer-signature)"
          strokeWidth="1.35"
          strokeLinecap="round"
        />
      </svg>
      <span className="font-sans text-[7.5px] leading-none font-semibold tracking-[0.18em] text-[var(--text-secondary)]">
        TAMER
      </span>
    </div>
  )
}
