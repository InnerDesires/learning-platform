import React from 'react'

import { AdminBar } from '@/components/AdminBar'
import { Footer } from '@/Footer/Component'
import { Header } from '@/Header/Component'
import { Providers } from '@/providers'
import type { SiteLocale } from '@/utilities/locales'
import { draftMode } from 'next/headers'

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: SiteLocale }>
}) {
  const { locale } = await params
  const { isEnabled } = await draftMode()

  return (
    <Providers>
      <AdminBar
        adminBarProps={{
          preview: isEnabled,
        }}
      />
      <Header locale={locale} />
      {children}
      <Footer locale={locale} />
    </Providers>
  )
}
