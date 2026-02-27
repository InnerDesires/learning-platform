'use client'
import Link from 'next/link'
import React from 'react'
import { usePathname } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { getFrontendMessages, getLocaleFromPathname } from '@/utilities/i18n'

export default function NotFound() {
  const pathname = usePathname()
  const locale = getLocaleFromPathname(pathname)
  const t = getFrontendMessages(locale)
  return (
    <div className="container py-28">
      <div className="prose max-w-none">
        <h1 style={{ marginBottom: 0 }}>404</h1>
        <p className="mb-4">{t.notFoundMessage}</p>
      </div>
      <Button asChild variant="default">
        <Link href={locale === 'en' ? '/en' : '/'}>{t.goHome}</Link>
      </Button>
    </div>
  )
}
