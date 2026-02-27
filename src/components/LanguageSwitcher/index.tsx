'use client'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import React from 'react'

const locales = [
  { code: 'uk', label: 'UA' },
  { code: 'en', label: 'EN' },
]
const defaultLocale = 'uk'

export const LanguageSwitcher: React.FC = () => {
  const pathname = usePathname()

  const isEnglish = pathname.startsWith('/en/') || pathname === '/en'
  const currentLocale = isEnglish ? 'en' : 'uk'

  const getLocalePath = (targetLocale: string) => {
    const cleanPath = isEnglish ? pathname.replace(/^\/en/, '') || '/' : pathname

    if (targetLocale === defaultLocale) return cleanPath
    return `/en${cleanPath === '/' ? '' : cleanPath}`
  }

  return (
    <div className="flex items-center gap-1">
      {locales.map(({ code, label }, i) => (
        <React.Fragment key={code}>
          {i > 0 && <span className="text-muted-foreground text-sm">/</span>}
          <Link
            href={getLocalePath(code)}
            data-testid={`lang-switch-${code}`}
            className={
              currentLocale === code
                ? 'text-primary font-semibold text-sm'
                : 'text-muted-foreground hover:text-primary transition-colors text-sm'
            }
          >
            {label}
          </Link>
        </React.Fragment>
      ))}
    </div>
  )
}
