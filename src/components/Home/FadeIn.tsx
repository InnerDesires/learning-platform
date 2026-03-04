'use client'

import { useRef, useEffect, type ReactNode, type CSSProperties } from 'react'
import { cn } from '@/utilities/ui'

type Props = {
  children: ReactNode
  className?: string
  delay?: number
  style?: CSSProperties
}

export function FadeIn({ children, className, delay = 0, style }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.classList.add('in')
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('in')
          observer.disconnect()
        }
      },
      { rootMargin: '-60px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={cn('fade-up', className)}
      style={delay ? { ...style, transitionDelay: `${delay}ms` } : style}
    >
      {children}
    </div>
  )
}
