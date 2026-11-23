import clsx from 'clsx'

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={clsx('size-9 shrink-0', className)} aria-hidden="true">
      <rect width="48" height="48" rx="12" fill="#143d2b" />
      <path
        fill="#d7f58b"
        d="M24 8c-6.2 0-11.2 4.8-11.2 10.8 0 7.6 8.6 14.9 10.3 16.3.5.4 1.3.4 1.8 0 1.7-1.4 10.3-8.7 10.3-16.3C35.2 12.8 30.2 8 24 8z"
      />
      <path
        fill="#143d2b"
        d="M24 26.6c-3.6 0-6.1-2.4-6.1-5.9 0-3 2.3-5.3 6.1-6.3 3.8 1 6.1 3.3 6.1 6.3 0 3.5-2.5 5.9-6.1 5.9z"
      />
      <path fill="none" stroke="#d7f58b" strokeWidth="1.6" strokeLinecap="round" d="M24 25.5v-8" />
      <path
        fill="none"
        stroke="#58b98a"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeDasharray="0.1 5"
        d="M11 40.5h26"
      />
    </svg>
  )
}

export function Logo({ className, inverted = false }: { className?: string; inverted?: boolean }) {
  return (
    <span className={clsx('inline-flex items-center gap-2.5', className)}>
      <LogoMark />
      <span className={clsx('font-display text-xl font-bold tracking-tight', inverted ? 'text-white' : 'text-pine-900')}>
        Track<span className={inverted ? 'text-lime-300' : 'text-leaf-600'}>Trash</span>
      </span>
    </span>
  )
}
