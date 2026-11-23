import { useId } from 'react'
import clsx from 'clsx'

/** Arequipa skyline: El Misti, Chachani and Pichu Pichu over sillar rooftops. Purely decorative. */
export function SkylineScene({ className }: { className?: string }) {
  const sky = useId()
  const snow = useId()
  return (
    <svg viewBox="0 0 960 420" preserveAspectRatio="xMidYMax slice" className={clsx('block', className)} aria-hidden="true">
      <defs>
        <linearGradient id={sky} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e9f6df" />
          <stop offset="1" stopColor="#f6f7f2" />
        </linearGradient>
        <linearGradient id={snow} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#e6f4ea" />
        </linearGradient>
      </defs>
      <rect width="960" height="420" fill={`url(#${sky})`} />
      <circle cx="170" cy="96" r="46" fill="#d7f58b" opacity="0.7" />
      <path d="M-20 300 L130 205 L215 255 L320 180 L430 270 L430 420 L-20 420Z" fill="#cfe6d3" />
      <path d="M520 290 L690 150 L760 205 L860 120 L1000 250 L1000 420 L520 420Z" fill="#c4dfca" />
      <path d="M250 330 L470 92 L690 330Z" fill="#8cc3a1" />
      <path d="M470 92 L405 162 L432 158 L452 186 L470 160 L490 188 L510 158 L535 162Z" fill={`url(#${snow})`} />
      <path d="M200 340 Q340 270 470 300 Q600 270 760 340Z" fill="#a9d4b7" opacity="0.8" />
      <path d="M0 330 H960 V420 H0Z" fill="#dbeed9" />
      <g fill="#f3ead8">
        <rect x="40" y="318" width="64" height="62" rx="3" />
        <rect x="118" y="300" width="52" height="80" rx="3" />
        <rect x="186" y="324" width="70" height="56" rx="3" />
        <rect x="700" y="308" width="58" height="72" rx="3" />
        <rect x="772" y="322" width="74" height="58" rx="3" />
        <rect x="860" y="302" width="56" height="78" rx="3" />
      </g>
      <g fill="#e4d4b4">
        <rect x="40" y="318" width="64" height="8" />
        <rect x="118" y="300" width="52" height="8" />
        <rect x="186" y="324" width="70" height="8" />
        <rect x="700" y="308" width="58" height="8" />
        <rect x="772" y="322" width="74" height="8" />
        <rect x="860" y="302" width="56" height="8" />
      </g>
      <g fill="#a8793a" opacity="0.55">
        <rect x="56" y="338" width="14" height="22" rx="7" />
        <rect x="132" y="322" width="12" height="20" rx="6" />
        <rect x="204" y="340" width="16" height="22" rx="8" />
        <rect x="714" y="330" width="12" height="20" rx="6" />
        <rect x="790" y="340" width="14" height="20" rx="7" />
        <rect x="876" y="324" width="12" height="20" rx="6" />
      </g>
      <rect x="0" y="380" width="960" height="40" fill="#143d2b" />
    </svg>
  )
}

/** Three-step flow: request, pickup, recovered kilograms. Used in the landing page. */
export function RouteDiagram({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 480 120" className={clsx('block', className)} aria-hidden="true">
      <path d="M40 60 H440" stroke="#58b98a" strokeWidth="3" strokeDasharray="2 10" strokeLinecap="round" className="animate-dash" />
      <g>
        <circle cx="60" cy="60" r="30" fill="#dcf1e5" />
        <path d="M60 44c-6 0-10 4.5-10 9.5 0 7 8.5 14 9.2 14.6.500.4 1.1.400 1.6 0 .700-.600 9.2-7.6 9.2-14.600C70 48.5 66 44 60 44z" fill="#217a51" />
        <circle cx="60" cy="54" r="3.5" fill="#dcf1e5" />
      </g>
      <g>
        <circle cx="240" cy="60" r="30" fill="#f5efe3" />
        <rect x="222" y="52" width="26" height="16" rx="3" fill="#a8793a" />
        <path d="M248 56h8l6 6v6h-14z" fill="#d9b37a" />
        <circle cx="230" cy="70" r="4" fill="#143d2b" />
        <circle cx="255" cy="70" r="4" fill="#143d2b" />
      </g>
      <g>
        <circle cx="420" cy="60" r="30" fill="#d7f58b" />
        <path d="M406 70c0-12 7-20 22-20 0 14-9 21-22 20z" fill="#143d2b" />
        <path d="M406 70c4-6 8-10 14-13" stroke="#d7f58b" strokeWidth="2" strokeLinecap="round" fill="none" />
      </g>
    </svg>
  )
}

export function EmptyBoxIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 120" className={clsx('block', className)} aria-hidden="true">
      <ellipse cx="80" cy="104" rx="52" ry="8" fill="#dcf1e5" />
      <path d="M36 52l44-18 44 18v38l-44 18-44-18z" fill="#f5efe3" stroke="#e4d4b4" strokeWidth="2" strokeLinejoin="round" />
      <path d="M36 52l44 18 44-18M80 70v38" fill="none" stroke="#e4d4b4" strokeWidth="2" strokeLinejoin="round" />
      <path d="M96 24c10 2 16 10 14 22-10-1-16-9-14-22z" fill="#58b98a" />
      <path d="M96 24c4 6 8 12 14 22" stroke="#217a51" strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  )
}
