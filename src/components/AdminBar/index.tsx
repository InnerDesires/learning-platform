'use client'

import {
  CalendarDays,
  CalendarRange,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Newspaper,
  PanelsTopLeft,
  Users,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'

import { cn } from '@/utilities/ui'
import { getClientSideURL } from '@/utilities/getURL'
import { Logo } from '@/components/Logo/Logo'
import { useSession } from '@/lib/auth/client'

import './index.scss'

const baseClass = 'admin-bar'

const quickLinks = [
  { href: '/admin/collections/courses', icon: GraduationCap, label: 'Курси' },
  { href: '/admin/collections/events', icon: CalendarDays, label: 'Події' },
  { href: '/admin/globals/home-calendar', icon: CalendarRange, label: 'Календар змін' },
  { href: '/admin/collections/posts', icon: Newspaper, label: 'Публікації' },
  { href: '/admin/collections/pages', icon: PanelsTopLeft, label: 'Сторінки' },
  { href: '/admin/collections/users', icon: Users, label: 'Користувачі' },
] as const

type AdminBarProps = {
  adminBarProps?: {
    preview?: boolean
  }
}

type MeUser = {
  id?: number | string
  role?: ('admin' | 'learner')[] | null
}

export const AdminBar: React.FC<AdminBarProps> = ({ adminBarProps }) => {
  const preview = adminBarProps?.preview ?? false
  const [isAdmin, setIsAdmin] = useState(false)
  const router = useRouter()
  const { data: session } = useSession()
  const cmsURL = getClientSideURL()

  useEffect(() => {
    if (!session?.user) {
      setIsAdmin(false)
      return
    }
    // The session payload carries the role; only sessions that claim admin are
    // verified against /api/users/me. Regular members skip the request entirely.
    const sessionRole = (session.user as { role?: string[] | string }).role
    const claimsAdmin = Array.isArray(sessionRole)
      ? sessionRole.includes('admin')
      : sessionRole === 'admin'
    if (!claimsAdmin) {
      setIsAdmin(false)
      return
    }
    let cancelled = false
    fetch(`${cmsURL}/api/users/me`, { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { user?: MeUser | null } | null) => {
        if (cancelled) return
        const user = data?.user
        setIsAdmin(Boolean(user?.id && user?.role?.includes('admin')))
      })
      .catch(() => {
        if (!cancelled) setIsAdmin(false)
      })
    return () => {
      cancelled = true
    }
  }, [cmsURL, session])

  const exitPreview = () => {
    fetch('/next/exit-preview').then(() => {
      router.push('/')
      router.refresh()
    })
  }

  return (
    <div
      className={cn(baseClass, 'py-1.5 bg-black text-white', isAdmin ? 'block' : 'hidden')}
      data-testid="admin-bar"
    >
      <div className="container flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        <Link
          className={`${baseClass}__brand flex items-center gap-2 font-medium`}
          href="/admin"
          title="Відкрити адмін-панель"
        >
          <Logo alt="Залізна Зміна" className="h-6" />
          <LayoutDashboard aria-hidden="true" size={14} />
          Адмін-панель
        </Link>
        <nav className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {quickLinks.map(({ href, icon: IconComponent, label }) => (
            <Link
              className="flex items-center gap-1.5 hover:text-orange transition-colors"
              href={href}
              key={href}
            >
              <IconComponent aria-hidden="true" size={14} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          {preview ? (
            <button
              className="hover:text-orange transition-colors"
              onClick={exitPreview}
              type="button"
            >
              Вийти з режиму перегляду
            </button>
          ) : null}
          <Link
            className="flex items-center gap-1.5 hover:text-orange transition-colors"
            href="/admin/logout"
          >
            <LogOut aria-hidden="true" size={14} />
            Вийти
          </Link>
        </div>
      </div>
    </div>
  )
}
