'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'

import type { Header as HeaderType } from '@/payload-types'
import type { SiteLocale } from '@/utilities/locales'

import { CMSLink } from '@/components/Link'
import { UserMenu, UserMenuMobileSection } from '@/components/UserMenu'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import Link from 'next/link'
import { SearchIcon, Menu, X } from 'lucide-react'
import { getFrontendMessages } from '@/utilities/i18n'
import { usePathname } from 'next/navigation'

export const HeaderNav: React.FC<{ data: HeaderType; locale: SiteLocale }> = ({ data, locale }) => {
  const t = getFrontendMessages(locale)
  const navItems = data?.navItems || []
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  const searchPath = locale === 'en' ? '/en/search' : '/search'

  useEffect(() => {
    setMobileOpen(false)
    setUserMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!mobileOpen) return
    const handlePointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setMobileOpen(false)
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false)
    }
    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [mobileOpen])

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

  const closeMobile = useCallback(() => setMobileOpen(false), [])

  // Mirrors CMSLink's href computation so the active nav item can be highlighted.
  const isActive = useCallback(
    (link: NonNullable<HeaderType['navItems']>[number]['link']) => {
      const href =
        link.type === 'reference' &&
        typeof link.reference?.value === 'object' &&
        link.reference.value.slug
          ? `${link.reference.relationTo !== 'pages' ? `/${link.reference.relationTo}` : ''}/${link.reference.value.slug}`
          : link.url
      if (!href) return false
      const path = pathname.replace(/^\/en(?=\/|$)/, '') || '/'
      const target = href.replace(/^\/en(?=\/|$)/, '') || '/'
      return target === '/' ? path === '/' : path === target || path.startsWith(`${target}/`)
    },
    [pathname],
  )

  return (
    <div ref={rootRef} className="contents">
      <nav className="flex items-center gap-0.5" aria-label={t.projectName}>
        <button
          type="button"
          onClick={toggleMobile}
          className="grid h-11 w-11 place-items-center rounded-full text-fog transition-colors hover:bg-navy hover:text-cloud lg:hidden"
          aria-label={mobileOpen ? t.menuClose : t.menuOpen}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        {navItems.map(({ link }, i) => (
          <CMSLink
            key={i}
            {...link}
            appearance="link"
            className={
              'relative hidden rounded-full px-3.5 py-2 font-display text-[13.5px] font-medium uppercase tracking-[0.12em] no-underline transition-colors hover:no-underline lg:inline-flex ' +
              (isActive(link)
                ? 'text-orange after:absolute after:inset-x-3.5 after:bottom-0.5 after:h-0.5 after:rounded-full after:bg-orange'
                : 'text-fog hover:text-cloud')
            }
          />
        ))}

        <Link
          href={searchPath}
          className="hidden h-[34px] w-[34px] place-items-center rounded-full border border-transparent text-fog transition-colors hover:border-line-2 hover:bg-navy hover:text-cloud lg:ml-1 lg:grid"
          data-testid="header-search-link"
        >
          <span className="sr-only">{t.searchLabel}</span>
          <SearchIcon className="h-4 w-4" />
        </Link>
        <div className="mx-2 hidden lg:block">
          <LanguageSwitcher withTestIds />
        </div>
        <div className="hidden lg:block">
          <UserMenu locale={locale} open={userMenuOpen} onToggle={handleUserMenuToggle} />
        </div>
      </nav>

      {mobileOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-line-2 bg-popover p-2 shadow-[0_18px_40px_-22px_rgba(0,0,0,0.8)] animate-in fade-in-0 slide-in-from-top-2 lg:hidden">
          {navItems.map(({ link }, i) => (
            <CMSLink
              key={i}
              {...link}
              appearance="link"
              className={
                'flex w-full justify-start rounded-lg px-4 py-3 font-display text-sm font-medium uppercase tracking-[0.1em] no-underline transition-colors hover:no-underline ' +
                (isActive(link) ? 'text-orange' : 'text-fog hover:bg-navy hover:text-cloud')
              }
            />
          ))}
          <Link
            href={searchPath}
            onClick={closeMobile}
            className="flex w-full items-center gap-2.5 rounded-lg px-4 py-3 font-display text-sm font-medium uppercase tracking-[0.1em] text-fog no-underline transition-colors hover:bg-navy hover:text-cloud hover:no-underline"
          >
            <SearchIcon className="h-4 w-4" />
            {t.searchLabel}
          </Link>
          <div className="my-2 border-t border-line" />
          <UserMenuMobileSection locale={locale} onNavigate={closeMobile} />
          <div className="mt-2 flex justify-center border-t border-line px-4 pb-1 pt-3">
            <LanguageSwitcher />
          </div>
        </div>
      )}
    </div>
  )
}
