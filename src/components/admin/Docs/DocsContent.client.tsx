'use client'

import { useRouter } from 'next/navigation'
import React, { useCallback } from 'react'

/**
 * Renders server-rendered article HTML and upgrades internal doc links to
 * client-side navigation, so moving between articles doesn't reload the admin.
 */
export const DocsContent: React.FC<{ html: string }> = ({ html }) => {
  const router = useRouter()

  const onClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      const anchor = (event.target as HTMLElement).closest('a')
      if (!anchor) return
      const href = anchor.getAttribute('href')
      if (!href || !href.startsWith('/admin/')) return
      event.preventDefault()
      router.push(href)
    },
    [router],
  )

  return (
    <div
      className="admin-docs__content"
      dangerouslySetInnerHTML={{ __html: html }}
      onClick={onClick}
    />
  )
}
