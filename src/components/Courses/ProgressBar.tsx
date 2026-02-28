import React from 'react'
import { cn } from '@/utilities/ui'

type Props = {
  completed: number
  total: number
  label?: string
  className?: string
}

export const ProgressBar: React.FC<Props> = ({ completed, total, label, className }) => {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <div className="flex justify-between items-center mb-1.5 text-sm">
          <span className="font-medium">{label}</span>
          <span className="text-muted-foreground">{percentage}%</span>
        </div>
      )}
      <div className="w-full bg-secondary rounded-full h-2.5 overflow-hidden">
        <div
          className="bg-primary h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
