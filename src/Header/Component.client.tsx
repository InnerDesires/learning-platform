'use client'
import React from 'react'

import type { Header } from '@/payload-types'
import type { SiteLocale } from '@/utilities/locales'

import { Brand } from '@/components/Logo/Brand'
import { HeaderNav } from './Nav'

interface HeaderClientProps {
  data: Header
  locale: SiteLocale
}

export const HeaderClient: React.FC<HeaderClientProps> = ({ data, locale }) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-line bg-void/85 shadow-[0_1px_0_rgb(42_84_176/0.25)] backdrop-blur-xl">
      <div className="container flex h-16 items-center gap-7">
        <Brand locale={locale} testId="header-logo-link" />
        <div className="relative ml-auto flex items-center">
          <HeaderNav data={data} locale={locale} />
        </div>
      </div>
    </header>
  )
}
