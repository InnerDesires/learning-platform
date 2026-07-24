'use client'

import React, { useState } from 'react'
import Link from 'next/link'

import { cn } from '@/utilities/ui'
import { filterPill } from '@/components/Courses/CategoryFilter'
import { formatXp, levelForXp } from '@/utilities/xp'
import type { LeaderboardEntry } from '@/utilities/leaderboard'

type Board = {
  key: string
  label: string
  entries: LeaderboardEntry[]
}

const rankColor = (rank: number): string => {
  if (rank === 1) return 'text-orange'
  if (rank === 2) return 'text-amber'
  if (rank === 3) return 'text-amber/70'
  return 'text-fog'
}

export const LeaderboardTabs: React.FC<{
  boards: Board[]
  localePrefix: string
  emptyText: string
  levelLabel: string
}> = ({ boards, localePrefix, emptyText, levelLabel }) => {
  const [active, setActive] = useState(0)
  const board = boards[active] ?? boards[0]

  return (
    <div>
      <div
        role="tablist"
        className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:overflow-x-visible md:px-0"
      >
        {boards.map((b, i) => (
          <button
            key={b.key}
            type="button"
            role="tab"
            aria-selected={i === active}
            data-testid={`leaderboard-tab-${b.key}`}
            onClick={() => setActive(i)}
            className={filterPill(i === active)}
          >
            {b.label}
          </button>
        ))}
      </div>

      {board.entries.length === 0 ? (
        <p className="mt-8 text-sm text-fog">{emptyText}</p>
      ) : (
        <ol className="mt-6 space-y-2" data-testid="leaderboard-list">
          {board.entries.map((entry, idx) => (
            <li key={entry.userId}>
              <Link
                href={`${localePrefix}/users/${entry.userId}`}
                className="flex items-center gap-3.5 rounded-xl border border-line-2 bg-navy/40 px-4 py-3 transition-colors hover:border-line hover:bg-navy"
              >
                <span
                  className={cn(
                    'num w-7 shrink-0 text-center font-display text-lg font-bold',
                    rankColor(idx + 1),
                  )}
                >
                  {idx + 1}
                </span>
                {entry.image ? (
                  <img
                    src={entry.image}
                    alt=""
                    referrerPolicy="no-referrer"
                    className="h-10 w-10 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-navy-2 font-display text-base font-bold text-amber">
                    {entry.name[0]?.toUpperCase() || '?'}
                  </span>
                )}
                <span className="min-w-0 flex-1 truncate text-[15px] font-semibold">
                  {entry.name}
                </span>
                <span className="chip hidden sm:inline-flex">
                  {levelLabel} {levelForXp(entry.xp).level}
                </span>
                <span className="num shrink-0 text-[15px] font-bold text-orange">
                  {formatXp(entry.xp)}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
