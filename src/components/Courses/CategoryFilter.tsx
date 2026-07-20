'use client'

import React from 'react'
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

const pill = (active: boolean) =>
  cn(
    'rounded-full border px-4 py-2 font-display text-xs font-semibold uppercase tracking-[0.1em] transition-colors',
    active
      ? 'border-orange bg-orange text-[#1B1204]'
      : 'border-line-2 text-fog hover:border-steel hover:text-cloud',
  )

export const CategoryFilter: React.FC<Props> = ({ categories, selectedCategory, onSelect, allLabel }) => {
  return (
    <div className="flex flex-wrap gap-2" role="group">
      <button onClick={() => onSelect(null)} className={pill(selectedCategory === null)}>
        {allLabel}
      </button>
      {categories.map((cat) => (
        <button key={cat.id} onClick={() => onSelect(cat.id)} className={pill(selectedCategory === cat.id)}>
          {cat.title}
        </button>
      ))}
    </div>
  )
}
