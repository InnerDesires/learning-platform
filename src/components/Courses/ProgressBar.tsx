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
        <div className="mb-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.1em] text-fog">
          <span>{label}</span>
          <b className="num text-amber">
            {completed}/{total} · {percentage}%
          </b>
        </div>
      )}
      <div
        className="pbar"
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <i style={{ width: `${percentage}%` }} />
      </div>
    </div>
  )
}
