import { useId } from 'react'

/** Majra's mark: one glossy drop, the place where every current ends up.
 * Amber is the signal colour; the pale rim and the dark turn keep it readable at 16px. */
export function LogoMark({
  className,
  gradient = false
}: {
  className?: string
  gradient?: boolean
}): React.JSX.Element {
  const id = useId().replace(/:/g, '')
  const paint = gradient ? `url(#${id})` : 'currentColor'
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" focusable="false">
      {gradient && (
        <defs>
          <linearGradient
            id={id}
            x1="7"
            y1="3"
            x2="19"
            y2="21"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor="#fff1d6" />
            <stop offset="0.34" stopColor="#f7bd7c" />
            <stop offset="0.7" stopColor="#e2933f" />
            <stop offset="1" stopColor="#b45309" />
          </linearGradient>
        </defs>
      )}
      <path
        d="M12 2.1c1.9 3.4 7.3 7.5 7.3 12.1 0 4.1-3.3 6.9-7.3 6.9s-7.3-2.8-7.3-6.9C4.7 9.6 10.1 5.5 12 2.1Z"
        fill={paint}
      />
      {gradient && (
        <>
          <path
            d="M12 3.5c-1.5 3.1-4.5 6.6-4.7 9.9 0 2.3 1.3 4.1 3.1 5"
            fill="none"
            stroke="#fff6e4"
            strokeOpacity="0.5"
            strokeWidth="0.9"
            strokeLinecap="round"
          />
          <path
            d="M18.3 14.6c-.2 3.3-2.6 5.5-5.6 6.1 3.4.2 6.1-2.4 6.1-5.8 0-.1 0-.2-.5-.3Z"
            fill="#5a2200"
            opacity="0.22"
          />
        </>
      )}
      <ellipse
        cx="9.6"
        cy="12.1"
        rx="1.15"
        ry="1.9"
        fill="#fff"
        opacity={gradient ? 0.55 : 0.3}
        transform="rotate(-18 9.6 12.1)"
      />
    </svg>
  )
}
