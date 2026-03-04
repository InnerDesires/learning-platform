'use client'

import { useRef, useEffect, useState } from 'react'
import { FadeIn } from './FadeIn'

type StatItem = {
  value: number
  label: string
  suffix?: string
}

function Counter({ value, suffix }: { value: number; suffix?: string }) {
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
          setDisplay(current.toLocaleString())
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

type Props = {
  items: StatItem[]
}

export function StatsSection({ items }: Props) {
  return (
    <section className="relative py-24 bg-background">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-4">
          {items.map((item, i) => (
            <FadeIn key={i} delay={i * 150} className="text-center group">
              <div className="relative inline-block">
                <span className="block text-6xl md:text-7xl lg:text-8xl font-black tracking-tight text-foreground">
                  <Counter value={item.value} suffix={item.suffix} />
                </span>
                <div className="h-1.5 bg-gradient-to-r from-[#F99E2D] to-[#f7b84d] rounded-full mt-3 origin-left" />
              </div>
              <p className="mt-4 text-lg md:text-xl text-muted-foreground font-medium uppercase tracking-widest">
                {item.label}
              </p>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}
