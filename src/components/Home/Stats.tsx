'use client'

import { useRef, useEffect, useState } from 'react'

/** Count-up number that animates when scrolled into view. */
export function StatCounter({ value, suffix }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [display, setDisplay] = useState('0')

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return

        const start = performance.now()
        const duration = 2000
        const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)

        const tick = (now: number) => {
          const elapsed = now - start
          const progress = Math.min(elapsed / duration, 1)
          const eased = easeOutCubic(progress)
          const current = Math.round(value * eased)
          setDisplay(current.toLocaleString('uk-UA'))
          if (progress < 1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
        observer.disconnect()
      },
      { rootMargin: '-100px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [value])

  return (
    <span ref={ref}>
      {display}
      {suffix || ''}
    </span>
  )
}
