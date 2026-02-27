import { redirect } from 'next/navigation'

import { defaultLocale, type SiteLocale } from '@/utilities/locales'
import { getSession } from './getSession'

export const requireSession = async (locale: SiteLocale, currentPath: string) => {
  const session = await getSession()
  if (!session) {
    const loginPath = locale === defaultLocale ? '/login' : `/${locale}/login`
    redirect(`${loginPath}?redirect=${encodeURIComponent(currentPath)}`)
  }
  return session
}
