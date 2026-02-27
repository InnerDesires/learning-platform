import { HeaderClient } from './Component.client'
import { getCachedGlobal } from '@/utilities/getGlobals'
import React from 'react'

import type { Header } from '@/payload-types'
import type { SiteLocale } from '@/utilities/locales'

export async function Header({ locale }: { locale: SiteLocale }) {
  const headerData: Header = await getCachedGlobal('header', 1, locale)()

  return <HeaderClient data={headerData} locale={locale} />
}
