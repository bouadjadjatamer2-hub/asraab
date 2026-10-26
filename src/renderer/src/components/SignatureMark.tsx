/** A small, purely decorative signature at the bottom-right edge of the window. It never takes
 * pointer events, never carries meaning the interface depends on, and stays out of the way of
 * the status bar's own controls. The mark is Majra's amber drop, so the detail belongs to this
 * identity rather than to any older theme. */
export function SignatureMark(): React.JSX.Element {
  return (
    <div
      data-signature
      aria-hidden
      className="pointer-events-none absolute right-2.5 bottom-[5px] flex items-center gap-1 opacity-60 select-none"
    >
      <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden>
        <defs>
          <linearGradient id="majra-signature" x1="3" y1="2" x2="13" y2="14">
            <stop stopColor="var(--color-accent)" />
            <stop offset="1" stopColor="var(--color-accent)" stopOpacity="0.55" />
          </linearGradient>
        </defs>
        <path
          d="M8 1.4c1.4 2.5 5.3 5.4 5.3 8.8 0 3-2.4 5-5.3 5s-5.3-2-5.3-5C2.7 6.8 6.6 3.9 8 1.4Z"
          fill="url(#majra-signature)"
          fillOpacity="0.22"
          stroke="url(#majra-signature)"
          strokeWidth="1.2"
        />
      </svg>
      <span className="font-sans text-[7.5px] leading-none font-semibold tracking-[0.18em] text-[var(--text-secondary)]">
        MAJRA
      </span>
    </div>
  )
}
