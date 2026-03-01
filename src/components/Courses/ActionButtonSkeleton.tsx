import React from 'react'

export function ActionButtonSkeleton() {
  return (
    <div className="mt-6 flex gap-3 items-center">
      <div className="h-11 w-44 rounded-md bg-muted animate-pulse" />
    </div>
  )
}
