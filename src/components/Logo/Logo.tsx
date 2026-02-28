import clsx from 'clsx'
import React from 'react'

interface Props {
  alt?: string
  className?: string
  loading?: 'lazy' | 'eager'
  priority?: 'auto' | 'high' | 'low'
}

export const Logo = (props: Props) => {
  const { alt, className } = props

  return (
    <span
      role="img"
      aria-label={alt || 'Залізна Зміна'}
      className={clsx('inline-flex items-center gap-1.5 text-lg font-bold tracking-tight', className)}
    >
      <svg
        width="28"
        height="28"
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
        aria-hidden="true"
      >
        <rect width="100" height="100" rx="16" fill="currentColor" />
        <path
          d="M28 30h44v8H44v12h24v8H44v12h28v8H28z"
          fill="var(--theme-bg, white)"
          className="fill-white dark:fill-black"
        />
      </svg>
      <span className="whitespace-nowrap">Залізна Зміна</span>
    </span>
  )
}
