'use client'

import React, { useCallback, useEffect, useState } from 'react'

import type { Header as HeaderType } from '@/payload-types'
import type { SiteLocale } from '@/utilities/locales'

import { CMSLink } from '@/components/Link'
import { UserMenu } from '@/components/UserMenu'
import Link from 'next/link'
import { SearchIcon, Menu, X } from 'lucide-react'
import { getFrontendMessages } from '@/utilities/i18n'
import { usePathname } from 'next/navigation'

export const HeaderNav: React.FC<{ data: HeaderType; locale: SiteLocale }> = ({ data, locale }) => {
  const t = getFrontendMessages(locale)
  const navItems = data?.navItems || []
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setMobileOpen(false)
    setUserMenuOpen(false)
  }, [pathname])

  const toggleMobile = useCallback(() => {
    setMobileOpen((v) => {
      if (!v) setUserMenuOpen(false)
      return !v
    })
  }, [])

  const handleUserMenuToggle = useCallback((open: boolean) => {
    setUserMenuOpen(open)
    if (open) setMobileOpen(false)
  }, [])

  return (
    <>
        <nav className="flex gap-1 items-center bg-secondary/80 backdrop-blur-sm rounded-full px-2 py-1.5">
        <button
          type="button"
          onClick={toggleMobile}
          className="p-2 rounded-full transition-colors hover:bg-primary/10 md:hidden"
          aria-label={mobileOpen ? t.menuClose : t.menuOpen}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? (
            <X className="w-4 h-4 text-foreground" />
          ) : (
            <Menu className="w-4 h-4 text-foreground" />
          )}
        </button>

        {navItems.map(({ link }, i) => (
          <CMSLink
            key={i}
            {...link}
            appearance="link"
            className="hidden md:inline-flex text-foreground no-underline hover:no-underline px-4 py-1.5 rounded-full text-sm font-medium transition-colors hover:bg-primary/10 hover:text-primary"
          />
        ))}

        <Link
          href={locale === 'en' ? '/en/search' : '/search'}
          className="p-2 rounded-full transition-colors hover:bg-primary/10 md:ml-1"
          data-testid="header-search-link"
        >
          <span className="sr-only">{t.searchLabel}</span>
          <SearchIcon className="w-4 h-4 text-foreground" />
        </Link>
        <UserMenu locale={locale} open={userMenuOpen} onToggle={handleUserMenuToggle} />
      </nav>

      {mobileOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border bg-popover p-2 shadow-lg animate-in fade-in-0 slide-in-from-top-2 md:hidden z-50">
          {navItems.map(({ link }, i) => (
            <CMSLink
              key={i}
              {...link}
              appearance="link"
              className="flex w-full text-foreground no-underline hover:no-underline px-4 py-2.5 rounded-lg text-sm font-medium transition-colors hover:bg-muted"
            />
          ))}
        </div>
      )}
    </>
  )
}
