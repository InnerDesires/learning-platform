'use client'
import Link from 'next/link'
import React from 'react'
import { usePathname } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Rails } from '@/components/brand'
import { getFrontendMessages, getLocaleFromPathname } from '@/utilities/i18n'

export default function NotFound() {
  const pathname = usePathname()
  const locale = getLocaleFromPathname(pathname)
  const t = getFrontendMessages(locale)
  return (
    <div className="relative flex min-h-[70vh] items-center overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(720px 440px at 80% 10%, rgb(4 40 113 / 0.5), transparent 60%)',
        }}
        aria-hidden="true"
      />
      <img
        src="/illustrations/hero-rails.svg"
        alt=""
        className="pointer-events-none absolute -bottom-8 -right-32 w-[560px] max-w-none opacity-50"
        aria-hidden="true"
      />
      <div className="container relative py-24">
        <h1 className="heading-display num text-[clamp(96px,18vw,220px)] font-bold leading-none text-transparent [-webkit-text-stroke:2px_var(--orange)]">
          404
        </h1>
        <Rails className="mt-2" />
        <p className="mt-5 max-w-[40ch] text-fog">{t.notFoundMessage}</p>
        <Button asChild className="mt-7">
          <Link href={locale === 'en' ? '/en' : '/'}>{t.goHome}</Link>
        </Button>
      </div>
    </div>
  )
}
