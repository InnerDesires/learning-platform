'use client'

import React from 'react'

import type { Header as HeaderType } from '@/payload-types'
import type { SiteLocale } from '@/utilities/locales'

import { CMSLink } from '@/components/Link'
import Link from 'next/link'
import { SearchIcon } from 'lucide-react'
import { getFrontendMessages } from '@/utilities/i18n'

export const HeaderNav: React.FC<{ data: HeaderType; locale: SiteLocale }> = ({ data, locale }) => {
  const t = getFrontendMessages(locale)
  const navItems = data?.navItems || []

  return (
    <nav className="flex gap-1 items-center bg-secondary/80 backdrop-blur-sm rounded-full px-2 py-1.5">
      {navItems.map(({ link }, i) => {
        return (
          <CMSLink
            key={i}
            {...link}
            appearance="link"
            className="text-foreground no-underline hover:no-underline px-4 py-1.5 rounded-full text-sm font-medium transition-colors hover:bg-primary/10 hover:text-primary"
          />
        )
      })}
      <Link
        href={locale === 'en' ? '/en/search' : '/search'}
        className="ml-1 p-2 rounded-full transition-colors hover:bg-primary/10"
        data-testid="header-search-link"
      >
        <span className="sr-only">{t.searchLabel}</span>
        <SearchIcon className="w-4 h-4 text-foreground" />
      </Link>
    </nav>
  )
}
