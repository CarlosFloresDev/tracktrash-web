import { useEffect, useState, type ElementType, type ReactNode } from 'react'

const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

/** Groups landing content. Content is always visible: nothing waits for scroll to appear. */
export function Reveal({
  children,
  className,
  as: Tag = 'div',
}: {
  children: ReactNode
  delay?: number
  className?: string
  as?: ElementType
}) {
  return <Tag className={className}>{children}</Tag>
}

/** Counts from zero up to `value` with an ease-out curve. */
export function CountUp({ value, format = (n) => Math.round(n).toString(), duration = 1200 }: { value: number; format?: (n: number) => string; duration?: number }) {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    if (reducedMotion()) return
    let frame = 0
    const start = performance.now()
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration)
      setCurrent(value * (1 - Math.pow(1 - progress, 3)))
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [value, duration])

  return <>{format(reducedMotion() ? value : current)}</>
}
