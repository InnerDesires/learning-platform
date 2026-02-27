'use client'
import Link from 'next/link'
import React from 'react'

import type { Header } from '@/payload-types'
import type { SiteLocale } from '@/utilities/locales'

import { Logo } from '@/components/Logo/Logo'
import { HeaderNav } from './Nav'
import { getFrontendMessages } from '@/utilities/i18n'

interface HeaderClientProps {
  data: Header
  locale: SiteLocale
}

export const HeaderClient: React.FC<HeaderClientProps> = ({ data, locale }) => {
  const t = getFrontendMessages(locale)
  return (
    <header className="container relative z-20">
      <div className="py-6 flex justify-between items-center">
        <Link href={locale === 'en' ? '/en' : '/'} className="flex items-center gap-2">
          <Logo alt={t.logoAlt} loading="eager" priority="high" />
        </Link>
        <HeaderNav data={data} locale={locale} />
      </div>
    </header>
  )
}
