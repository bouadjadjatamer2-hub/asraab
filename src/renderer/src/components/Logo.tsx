import { useId } from 'react'

/** Tayyar's mark: two lanes (one per connection) feeding a single download arrow. */
export function LogoMark({
  className,
  gradient = false
}: {
  className?: string
  gradient?: boolean
}): React.JSX.Element {
  const id = useId().replace(/:/g, '')
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" focusable="false">
      {gradient && (
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#8b6cff" />
            <stop offset="0.55" stopColor="#6d8bff" />
            <stop offset="1" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
      )}
      <g fill={gradient ? `url(#${id})` : 'currentColor'}>
        <rect x="9.9" y="2.4" width="1.8" height="10.1" rx="0.9" />
        <rect x="12.3" y="2.4" width="1.8" height="10.1" rx="0.9" />
        <path d="M5.7 11.6h12.6L12 19.6z" />
        <rect x="7.4" y="21" width="9.2" height="1.3" rx="0.65" />
      </g>
    </svg>
  )
}
