'use client'

import React, { useEffect, useRef } from 'react'
import { cn } from '@/utilities/ui'

type Category = {
  id: number
  title: string
}

type Props = {
  categories: Category[]
  selectedCategory: number | null
  onSelect: (id: number | null) => void
  allLabel: string
}

export const filterPill = (active: boolean) =>
  cn(
    'shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 font-display text-[11px] font-semibold uppercase tracking-[0.06em] transition-colors md:px-4 md:py-2 md:text-xs md:tracking-[0.1em]',
    active
      ? 'border-orange bg-orange text-[#1B1204]'
      : 'border-line-2 text-fog hover:border-steel hover:text-cloud',
  )

export const CategoryFilter: React.FC<Props> = ({ categories, selectedCategory, onSelect, allLabel }) => {
  const activeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest', inline: 'center' })
  }, [])

  return (
    <div
      role="group"
      className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:overflow-x-visible md:px-0"
    >
      <button
        ref={selectedCategory === null ? activeRef : undefined}
        onClick={() => onSelect(null)}
        className={filterPill(selectedCategory === null)}
      >
        {allLabel}
      </button>
      {categories.map((cat) => (
        <button
          key={cat.id}
          ref={selectedCategory === cat.id ? activeRef : undefined}
          onClick={() => onSelect(cat.id)}
          className={filterPill(selectedCategory === cat.id)}
        >
          {cat.title}
        </button>
      ))}
    </div>
  )
}
