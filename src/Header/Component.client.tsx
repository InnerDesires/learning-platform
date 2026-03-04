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
    <header className="sticky top-0 z-20 w-full border-b border-border/40 bg-background/60 backdrop-blur-xl">
      <div className="container py-3 flex justify-between items-center">
        <Link
          href={locale === 'en' ? '/en' : '/'}
          className="flex items-center gap-3"
          data-testid="header-logo-link"
        >
          <Logo alt={t?.logoAlt || ''} loading="eager" priority="high" className="h-20 w-auto -mb-9 drop-shadow-md" />
          <span className="text-lg font-black uppercase leading-tight tracking-tight text-foreground">{t.projectName}</span>
        </Link>
        <div className="relative">
          <HeaderNav data={data} locale={locale} />
        </div>
      </div>
    </header>
  )
}
