import { useEffect, useRef, useState, type ElementType, type ReactNode } from 'react'
import clsx from 'clsx'

const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

/** Fades its children in the first time they scroll into view. */
export function Reveal({
  children,
  delay = 0,
  className,
  as: Tag = 'div',
}: {
  children: ReactNode
  delay?: number
  className?: string
  as?: ElementType
}) {
  const ref = useRef<HTMLElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node || typeof IntersectionObserver === 'undefined') {
      setVisible(true)
      return
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <Tag ref={ref} className={clsx('reveal', visible && 'is-visible', className)} style={{ '--reveal-delay': `${delay}ms` }}>
      {children}
    </Tag>
  )
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
