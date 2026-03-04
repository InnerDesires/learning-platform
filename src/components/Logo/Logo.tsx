import clsx from 'clsx'
import React from 'react'

interface Props {
  alt?: string
  className?: string
  loading?: 'lazy' | 'eager'
  priority?: 'auto' | 'high' | 'low'
}

export const Logo = (props: Props) => {
  const { alt, className, loading = 'eager', priority = 'high' } = props

  return (
    <img
      src="/logo.svg"
      alt={alt || 'Залізна Зміна'}
      width={150}
      height={40}
      loading={loading}
      fetchPriority={priority}
      className={clsx('w-auto', className)}
    />
  )
}
