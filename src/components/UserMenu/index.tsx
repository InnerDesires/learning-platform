'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LogOut, Settings, User as UserIcon, Zap } from 'lucide-react'
import { useSession, signOut } from '@/lib/auth/client'
import { cn } from '@/utilities/ui'
import type { SiteLocale } from '@/utilities/locales'
import { getFrontendMessages } from '@/utilities/i18n'
import { getMyXp, type MyXp } from '@/actions/xp'
import { readMyXpCache, writeMyXpCache } from '@/utilities/myXpCache'

interface UserMenuProps {
  locale: SiteLocale
  open?: boolean
  onToggle?: (open: boolean) => void
}

function useMyXp(session: ReturnType<typeof useSession>['data']) {
  const [xp, setXp] = useState<MyXp | null>(null)

  useEffect(() => {
    if (!session?.user) {
      setXp(null)
      return
    }
    const userId = String(session.user.id)
    const cached = readMyXpCache(userId)
    if (cached) {
      setXp(cached)
      return
    }
    let cancelled = false
    getMyXp()
      .then((result) => {
        if (cancelled) return
        setXp(result)
        if (result) writeMyXpCache(userId, result)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [session?.user])

  return xp
}

export const UserMenu: React.FC<UserMenuProps> = ({ locale, open: controlledOpen, onToggle }) => {
  const { data: session, isPending } = useSession()
  const [internalOpen, setInternalOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const t = getFrontendMessages(locale)
  const xp = useMyXp(session)

  const open = controlledOpen ?? internalOpen
  const setOpen = useCallback(
    (value: boolean | ((prev: boolean) => boolean)) => {
      const next = typeof value === 'function' ? value(open) : value
      if (onToggle) {
        onToggle(next)
      } else {
        setInternalOpen(next)
      }
    },
    [open, onToggle],
  )

  const isEn = locale === 'en'
  const profilePath = isEn ? '/en/profile' : '/profile'
  const pathname = usePathname()
  const loginPath = `${isEn ? '/en' : ''}/login?redirect=${encodeURIComponent(pathname)}`

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [setOpen])

  const handleSignOut = useCallback(async () => {
    setOpen(false)
    await signOut({ fetchOptions: { onSuccess: () => router.refresh() } })
  }, [router, setOpen])

  if (isPending) {
    return (
      <div className="ml-1 h-9 w-9 rounded-full bg-muted animate-pulse" />
    )
  }

  if (!session?.user) {
    return (
      <Link
        href={loginPath}
        className="ml-1 flex h-9 w-9 items-center justify-center rounded-full border border-line-2 bg-void/50 transition-colors hover:border-orange hover:shadow-[0_0_16px_rgb(249_140_31/0.22)]"
        aria-label={t.signIn}
      >
        <UserIcon className="h-4 w-4 text-fog" />
      </Link>
    )
  }

  const user = session.user
  // The session payload omits `image`, so the avatar comes from getMyXp (users doc).
  const image = xp?.image ?? user.image
  const initials = (user.name || user.email)?.[0]?.toUpperCase() || '?'

  return (
    <div ref={menuRef} className="relative ml-1">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-9 flex-none rounded-full p-[2.5px] transition-shadow hover:shadow-[0_0_16px_rgb(249_140_31/0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        style={{
          background: `conic-gradient(from -90deg, var(--orange) 0 ${
            xp ? Math.round((xp.intoLevel / xp.span) * 100) : 0
          }%, var(--blue-line) 0 100%)`,
        }}
        aria-expanded={open}
        aria-haspopup="true"
      >
        {image ? (
          <img
            src={image}
            alt=""
            className="h-full w-full rounded-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center rounded-full bg-navy-2 text-xs font-extrabold text-amber">
            {initials}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-48 rounded-lg border bg-popover p-1 shadow-lg animate-in fade-in-0 zoom-in-95">
          <div className="px-3 py-2 border-b mb-1">
            <p className="text-sm font-medium truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            {xp && (
              <p className="num mt-1.5 inline-flex items-center gap-1 font-display text-[10px] font-semibold uppercase tracking-[0.08em] text-amber">
                <Zap className="h-2.5 w-2.5" fill="currentColor" strokeWidth={0} />
                {t.profileLevel} {xp.level} · {xp.xp.toLocaleString('uk-UA')} XP
              </p>
            )}
          </div>
          <Link
            href={profilePath}
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm no-underline text-popover-foreground transition-colors hover:bg-muted hover:text-foreground hover:no-underline"
          >
            <UserIcon className="h-4 w-4" />
            {t.profile}
          </Link>
          <Link
            href={`${profilePath}/settings`}
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm no-underline text-popover-foreground transition-colors hover:bg-muted hover:text-foreground hover:no-underline"
          >
            <Settings className="h-4 w-4" />
            {t.profileSettings}
          </Link>
          <button
            type="button"
            onClick={handleSignOut}
            className={cn(
              'flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm',
              'transition-colors hover:bg-destructive/10 hover:text-destructive',
            )}
          >
            <LogOut className="h-4 w-4" />
            {t.signOut}
          </button>
        </div>
      )}
    </div>
  )
}

const mobileRowClass =
  'flex w-full items-center gap-2.5 rounded-lg px-4 py-3 text-sm font-medium text-fog no-underline transition-colors hover:bg-navy hover:text-cloud hover:no-underline'

export const UserMenuMobileSection: React.FC<{
  locale: SiteLocale
  onNavigate?: () => void
}> = ({ locale, onNavigate }) => {
  const { data: session, isPending } = useSession()
  const xp = useMyXp(session)
  const router = useRouter()
  const pathname = usePathname()
  const t = getFrontendMessages(locale)

  const isEn = locale === 'en'
  const profilePath = isEn ? '/en/profile' : '/profile'
  const loginPath = `${isEn ? '/en' : ''}/login?redirect=${encodeURIComponent(pathname)}`

  const handleSignOut = async () => {
    onNavigate?.()
    await signOut({ fetchOptions: { onSuccess: () => router.refresh() } })
  }

  if (isPending) {
    return <div className="mx-4 my-3 h-5 animate-pulse rounded bg-muted" />
  }

  if (!session?.user) {
    return (
      <Link href={loginPath} onClick={onNavigate} className={mobileRowClass}>
        <UserIcon className="h-4 w-4" />
        {t.signIn}
      </Link>
    )
  }

  const user = session.user

  return (
    <>
      <div className="px-4 pb-2 pt-1">
        <p className="truncate text-sm font-medium text-cloud">{user.name}</p>
        <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        {xp && (
          <p className="num mt-1.5 inline-flex items-center gap-1 font-display text-[10px] font-semibold uppercase tracking-[0.08em] text-amber">
            <Zap className="h-2.5 w-2.5" fill="currentColor" strokeWidth={0} />
            {t.profileLevel} {xp.level} · {xp.xp.toLocaleString('uk-UA')} XP
          </p>
        )}
      </div>
      <Link href={profilePath} onClick={onNavigate} className={mobileRowClass}>
        <UserIcon className="h-4 w-4" />
        {t.profile}
      </Link>
      <Link href={`${profilePath}/settings`} onClick={onNavigate} className={mobileRowClass}>
        <Settings className="h-4 w-4" />
        {t.profileSettings}
      </Link>
      <button
        type="button"
        onClick={handleSignOut}
        className={cn(mobileRowClass, 'hover:bg-destructive/10 hover:text-destructive')}
      >
        <LogOut className="h-4 w-4" />
        {t.signOut}
      </button>
    </>
  )
}
