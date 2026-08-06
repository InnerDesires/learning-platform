import type { SiteLocale } from '@/utilities/locales'

const formatters: Record<SiteLocale, Intl.DateTimeFormat> = {
  uk: new Intl.DateTimeFormat('uk-UA', { day: 'numeric', month: 'short', year: 'numeric' }),
  en: new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
}

export const formatDateTime = (timestamp: string, locale: SiteLocale = 'uk'): string => {
  const date = timestamp ? new Date(timestamp) : new Date()
  return formatters[locale].format(date)
}
