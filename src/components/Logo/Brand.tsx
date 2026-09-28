import Link from 'next/link'
import React from 'react'

import type { SiteLocale } from '@/utilities/locales'
import { Logo } from './Logo'
import { getFrontendMessages } from '@/utilities/i18n'
import { cn } from '@/utilities/ui'

export const Brand: React.FC<{
  locale: SiteLocale
  size?: 'md' | 'lg' | 'header'
  className?: string
  testId?: string
}> = ({ locale, size = 'md', className, testId }) => {
  const t = getFrontendMessages(locale)

  return (
    <Link
      href={locale === 'en' ? '/en' : '/'}
      className={cn('flex min-w-0 gap-3',
        size === 'header' ? 'items-start' : 'items-center', className)}
      data-testid={testId}
    >
      <Logo
        alt={t.logoAlt}
        className={
          size === 'lg' ? 'h-16' : size === 'header' ? 'mt-1 h-[72px] md:mt-1.5 md:h-[90px]' : 'h-14 md:h-16'
        }
        loading="eager"
        priority="high"
      />
      <span
        className={cn(
          'font-display text-[17px] font-semibold uppercase leading-[1.1] tracking-[0.06em] whitespace-nowrap text-cloud md:text-[19px]',
          size === 'header' && 'mt-[22px]',
        )}
      >
        {t.brandName1} <em className="not-italic text-orange">{t.brandName2}</em>
        <span className="block font-sans text-[9px] font-bold uppercase tracking-[0.28em] text-steel">
          {t.brandSub}
        </span>
      </span>
    </Link>
  )
}
