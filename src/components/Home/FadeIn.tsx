'use client'

import { useRef, useEffect, type ReactNode, type CSSProperties } from 'react'
import { cn } from '@/utilities/ui'

type Props = {
  children: ReactNode
  className?: string
  delay?: number
  style?: CSSProperties
}

/**
 * Progressive-enhancement reveal: content is visible by default (SSR, no-JS,
 * reduced-motion). Only elements mounted below the fold are hidden and then
 * faded in when scrolled into view.
 */
export function FadeIn({ children, className, delay = 0, style }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    // Already on screen — leave it visible, no entrance animation.
    if (el.getBoundingClientRect().top < window.innerHeight) return

    el.classList.add('fade-pending')
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.remove('fade-pending')
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
