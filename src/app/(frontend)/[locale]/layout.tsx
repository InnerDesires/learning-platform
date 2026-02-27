import React from 'react'

import { AdminBar } from '@/components/AdminBar'
import { Footer } from '@/Footer/Component'
import { Header } from '@/Header/Component'
import { Providers } from '@/providers'
import { SetHtmlLang } from '@/components/SetHtmlLang'
import type { SiteLocale } from '@/utilities/locales'

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: SiteLocale }>
}) {
  const { locale } = await params

  return (
    <Providers>
      <SetHtmlLang locale={locale} />
      <AdminBar
        adminBarProps={{
          preview: false,
        }}
      />
      <Header locale={locale} />
      {children}
      <Footer locale={locale} />
    </Providers>
  )
}
