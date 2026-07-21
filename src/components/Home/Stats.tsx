'use client'

import { useRef, useEffect, useState } from 'react'

// Deterministic thousands grouping (same on server and every browser),
// so SSR markup never mismatches hydration.
const formatNumber = (n: number): string =>
  n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')

/**
 * Count-up number. The real value is server-rendered so it is always correct
 * even without JS; the 0→value count-up runs only as a client enhancement
 * when the number scrolls into view.
 */
export function StatCounter({ value, suffix }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [display, setDisplay] = useState(() => formatNumber(value))

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        observer.disconnect()

        const start = performance.now()
        const duration = 2000
        const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)

        const tick = (now: number) => {
          const progress = Math.min((now - start) / duration, 1)
          setDisplay(formatNumber(Math.round(value * easeOutCubic(progress))))
          if (progress < 1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      },
      { rootMargin: '-60px' },
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
