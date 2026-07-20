import Link from 'next/link'
import React from 'react'

import type { SiteLocale } from '@/utilities/locales'
import { Logo } from './Logo'
import { getFrontendMessages } from '@/utilities/i18n'
import { cn } from '@/utilities/ui'

/**
 * Brand lockup: official emblem + two-tone Oswald wordmark with the
 * "Платформа" sub-label. Used in the header and footer.
 */
export const Brand: React.FC<{
  locale: SiteLocale
  size?: 'md' | 'lg'
  className?: string
  testId?: string
}> = ({ locale, size = 'md', className, testId }) => {
  const t = getFrontendMessages(locale)

  return (
    <Link
      href={locale === 'en' ? '/en' : '/'}
      className={cn('flex min-w-0 items-center gap-2.5', className)}
      data-testid={testId}
    >
      <Logo
        alt={t.logoAlt}
        className={size === 'lg' ? 'h-[50px]' : 'h-11'}
        loading="eager"
        priority="high"
      />
      <span className="font-display text-[17px] font-semibold uppercase leading-[1.1] tracking-[0.06em] whitespace-nowrap text-cloud">
        {t.brandName1} <em className="not-italic text-orange">{t.brandName2}</em>
        <span className="block font-sans text-[9px] font-bold uppercase tracking-[0.28em] text-steel">
          {t.brandSub}
        </span>
      </span>
    </Link>
  )
}
