'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'

import type { CourseCompletion } from '@/utilities/leaderboard'

const REFRESH_MS = 60_000

/** Animate only when there are enough chips for the loop to read as a ticker. */
const MIN_ANIMATE = 5

/**
 * Live «completed by» running line for the course hero. Fetched client-side
 * (and refreshed on an interval) so the page itself stays statically cached.
 */
export const CompletedByTicker: React.FC<{
  courseId: number
  localePrefix: string
  label: string
}> = ({ courseId, localePrefix, label }) => {
  const [items, setItems] = useState<CourseCompletion[]>([])

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

  if (items.length === 0) return null

  const animate = items.length >= MIN_ANIMATE

  const chips = (ariaHidden: boolean) => (
    <div className="flex items-center gap-2 pr-2" aria-hidden={ariaHidden || undefined}>
      {items.map((item) => (
        <Link
          key={item.userId}
          href={`${localePrefix}/users/${item.userId}`}
          tabIndex={ariaHidden ? -1 : undefined}
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
        className="min-w-0 flex-1 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]"
      >
        {animate ? (
          // Two identical halves + translateX(-50%) make a seamless loop.
          <div
            className="animate-ticker flex w-max"
            style={{ '--ticker-duration': `${Math.max(20, items.length * 4)}s` } as React.CSSProperties}
          >
            {chips(false)}
            {chips(true)}
          </div>
        ) : (
          <div className="no-scrollbar overflow-x-auto">{chips(false)}</div>
        )}
      </div>
    </div>
  )
}
