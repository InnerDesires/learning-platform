'use client'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import React from 'react'
import { cn } from '@/utilities/ui'

const locales = [
  { code: 'uk', label: 'UA' },
  { code: 'en', label: 'EN' },
]
const defaultLocale = 'uk'

export const LanguageSwitcher: React.FC<{ withTestIds?: boolean }> = ({ withTestIds }) => {
  const pathname = usePathname()

  const isEnglish = pathname.startsWith('/en/') || pathname === '/en'
  const currentLocale = isEnglish ? 'en' : 'uk'

  const getLocalePath = (targetLocale: string) => {
    // During prerender usePathname() returns the internal /uk/* route path
    // (middleware rewrites / -> /uk and redirects public /uk/* to /*),
    // so strip either locale prefix, not just /en.
    const cleanPath = pathname.replace(/^\/(en|uk)(?=\/|$)/, '') || '/'

    if (targetLocale === defaultLocale) return cleanPath
    return `/en${cleanPath === '/' ? '' : cleanPath}`
  }

  return (
    <div className="inline-flex rounded-full border border-line-2 bg-void/50 p-0.5 text-[10.5px] font-bold">
      {locales.map(({ code, label }) => (
        <Link
          key={code}
          href={getLocalePath(code)}
          data-testid={withTestIds ? `lang-switch-${code}` : undefined}
          className={cn(
            'rounded-full px-2.5 py-1 transition-colors',
            currentLocale === code ? 'bg-orange text-ink' : 'text-fog hover:text-cloud',
          )}
        >
          {label}
        </Link>
      ))}
    </div>
  )
}
