'use client'

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import Link from 'next/link'

import type { CourseCompletion } from '@/utilities/leaderboard'

const REFRESH_MS = 60_000

const SPEED_PX_PER_S = 35

export const CompletedByTicker: React.FC<{
  courseId: number
  localePrefix: string
  label: string
}> = ({ courseId, localePrefix, label }) => {
  const [items, setItems] = useState<CourseCompletion[]>([])
  const containerRef = useRef<HTMLDivElement>(null)
  const firstGroupRef = useRef<HTMLDivElement>(null)
  const [copies, setCopies] = useState(2)
  const [duration, setDuration] = useState(30)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const res = await fetch(`/api/courses/${courseId}/completions`)
        if (!res.ok) return
        const data = (await res.json()) as { items?: CourseCompletion[] }
        if (!cancelled && Array.isArray(data.items)) setItems(data.items)
      } catch {
        // decorative — a failed refresh just keeps the previous list
      }
    }

    load()
    const timer = setInterval(load, REFRESH_MS)
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [courseId])

  // The -50% keyframe loops seamlessly only when the track is two identical
  // halves and each half is at least as wide as the container, so repeat the
  // chip group however many times that takes (always an even total).
  useLayoutEffect(() => {
    const container = containerRef.current
    const group = firstGroupRef.current
    if (!container || !group || items.length === 0) return

    const measure = () => {
      const groupWidth = group.scrollWidth
      const containerWidth = container.clientWidth
      if (groupWidth === 0 || containerWidth === 0) return
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        setCopies(1)
        return
      }
      const groupsPerHalf = Math.max(1, Math.ceil(containerWidth / groupWidth))
      setCopies(groupsPerHalf * 2)
      setDuration(Math.max(15, Math.round((groupWidth * groupsPerHalf) / SPEED_PX_PER_S)))
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(container)
    return () => observer.disconnect()
  }, [items])

  if (items.length === 0) return null

  const chips = (groupIndex: number) => (
    <div
      key={groupIndex}
      ref={groupIndex === 0 ? firstGroupRef : undefined}
      className="flex items-center gap-2 pr-2"
      aria-hidden={groupIndex > 0 || undefined}
    >
      {items.map((item) => (
        <Link
          key={item.userId}
          href={`${localePrefix}/users/${item.userId}`}
          tabIndex={groupIndex > 0 ? -1 : undefined}
          className="flex shrink-0 items-center gap-1.5 rounded-full border border-line-2 bg-navy/60 py-1 pl-1 pr-3 text-[12px] font-semibold text-fog transition-colors hover:text-cloud"
        >
          {item.image ? (
            <img
              src={item.image}
              alt=""
              referrerPolicy="no-referrer"
              className="h-5 w-5 rounded-full object-cover"
            />
          ) : (
            <span className="grid h-5 w-5 place-items-center rounded-full bg-navy-2 text-[10px] font-bold text-amber">
              {item.name[0]?.toUpperCase() || '?'}
            </span>
          )}
          {item.name}
        </Link>
      ))}
    </div>
  )

  return (
    <div className="mt-5 flex items-center gap-3" data-testid="completed-by-ticker">
      <span className="shrink-0 text-[11px] font-bold uppercase tracking-[0.08em] text-fog">
        {label}:
      </span>
      <div
        ref={containerRef}
        className="min-w-0 flex-1 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]"
      >
        <div
          className="animate-ticker flex w-max"
          style={{ '--ticker-duration': `${duration}s` } as React.CSSProperties}
        >
          {Array.from({ length: copies }, (_, i) => chips(i))}
        </div>
      </div>
    </div>
  )
}
