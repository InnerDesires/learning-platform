'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LogOut, User as UserIcon } from 'lucide-react'
import { useSession, signOut } from '@/lib/auth/client'
import { cn } from '@/utilities/ui'
import type { SiteLocale } from '@/utilities/locales'
import { getFrontendMessages } from '@/utilities/i18n'

interface UserMenuProps {
  locale: SiteLocale
  open?: boolean
  onToggle?: (open: boolean) => void
}

export const UserMenu: React.FC<UserMenuProps> = ({ locale, open: controlledOpen, onToggle }) => {
  const { data: session, isPending } = useSession()
  const [internalOpen, setInternalOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const t = getFrontendMessages(locale)

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
  const loginPath = isEn ? '/en/login' : '/login'
  const profilePath = isEn ? '/en/profile' : '/profile'

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
        className="ml-1 flex h-9 w-9 items-center justify-center rounded-full bg-muted transition-colors hover:bg-primary/10"
        aria-label={t.signIn}
      >
        <UserIcon className="h-4 w-4 text-muted-foreground" />
      </Link>
    )
  }

  const user = session.user
  const initials = (user.name || user.email)?.[0]?.toUpperCase() || '?'

  return (
    <div ref={menuRef} className="relative ml-1">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-9 items-center justify-center rounded-full overflow-hidden border-2 border-transparent transition-colors hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-expanded={open}
        aria-haspopup="true"
      >
        {user.image ? (
          <img
            src={user.image}
            alt=""
            className="h-full w-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center bg-primary text-primary-foreground text-sm font-semibold">
            {initials}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-48 rounded-lg border bg-popover p-1 shadow-lg animate-in fade-in-0 zoom-in-95">
          <div className="px-3 py-2 border-b mb-1">
            <p className="text-sm font-medium truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
          <Link
            href={profilePath}
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm no-underline text-popover-foreground transition-colors hover:bg-muted hover:text-foreground hover:no-underline"
          >
            <UserIcon className="h-4 w-4" />
            {t.profile}
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
