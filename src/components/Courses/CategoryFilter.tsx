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

export const CategoryFilter: React.FC<Props> = ({ categories, selectedCategory, onSelect, allLabel }) => {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onSelect(null)}
        className={cn(
          'px-4 py-2 rounded-full text-sm font-medium transition-colors',
          selectedCategory === null
            ? 'bg-primary text-primary-foreground'
            : 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        )}
      >
        {allLabel}
      </button>
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.id)}
          className={cn(
            'px-4 py-2 rounded-full text-sm font-medium transition-colors',
            selectedCategory === cat.id
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
          )}
        >
          {cat.title}
        </button>
      ))}
    </div>
  )
}
