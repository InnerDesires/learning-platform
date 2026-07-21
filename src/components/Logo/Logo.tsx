import clsx from 'clsx'
import React from 'react'

interface Props {
  alt?: string
  className?: string
  loading?: 'lazy' | 'eager'
  priority?: 'auto' | 'high' | 'low'
}

/** Official Iron Squad emblem (circular badge). Roughly square — size via height. */
export const Logo = (props: Props) => {
  const { alt, className, loading = 'eager', priority = 'high' } = props

  return (
    <img
      src="/logo-iron-squad.svg"
      alt={alt || 'Залізна Зміна'}
      width={48}
      height={44}
      loading={loading}
      fetchPriority={priority}
      className={clsx('w-auto drop-shadow-[0_1px_5px_rgba(0,0,0,0.5)]', className)}
    />
  )
}
