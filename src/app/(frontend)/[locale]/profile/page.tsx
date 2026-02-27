import type { Metadata } from 'next'
import { LogOut, Mail, Shield, Calendar } from 'lucide-react'

import { getPayload } from '@/lib/payload'
import { requireSession } from '@/lib/auth/requireSession'
import { defaultLocale, type SiteLocale } from '@/utilities/locales'
import { SignOutButton } from './SignOutButton'

type Args = {
  params: Promise<{ locale: SiteLocale }>
}

const labels = {
  uk: {
    title: 'Профіль',
    email: 'Електронна пошта',
    role: 'Роль',
    joined: 'Дата реєстрації',
    signOut: 'Вийти з акаунту',
    roleAdmin: 'Адміністратор',
    roleLearner: 'Учень',
  },
  en: {
    title: 'Profile',
    email: 'Email',
    role: 'Role',
    joined: 'Joined',
    signOut: 'Sign out',
    roleAdmin: 'Admin',
    roleLearner: 'Learner',
  },
} as const

export default async function ProfilePage({ params }: Args) {
  const { locale } = await params
  const profilePath = locale === defaultLocale ? '/profile' : `/${locale}/profile`
  const session = await requireSession(locale, profilePath)
  const user = session.user
  const t = labels[locale]

  const payload = await getPayload()
  const userDoc = await payload.findByID({
    collection: 'users',
    id: Number(user.id),
  })

  const initials = (user.name || user.email)?.[0]?.toUpperCase() || '?'
  const joinedDate =
    userDoc?.createdAt != null
      ? new Date(userDoc.createdAt).toLocaleDateString(
          locale === 'uk' ? 'uk-UA' : 'en-US',
          { year: 'numeric', month: 'long', day: 'numeric' },
        )
      : null

  return (
    <div className="container max-w-2xl py-16">
      <div className="flex flex-col items-center gap-4 mb-10">
        <div className="h-20 w-20 rounded-full overflow-hidden border-4 border-primary/20">
          {user.image ? (
            <img
              src={user.image}
              alt=""
              className="h-full w-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center bg-primary text-primary-foreground text-2xl font-bold">
              {initials}
            </span>
          )}
        </div>
        <h1 className="text-2xl font-bold">{user.name}</h1>
      </div>

      <div className="rounded-xl border bg-card p-6 space-y-5">
        <div className="flex items-center gap-3">
          <Mail className="h-5 w-5 text-muted-foreground shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground">{t.email}</p>
            <p className="text-sm font-medium">{user.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Shield className="h-5 w-5 text-muted-foreground shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground">{t.role}</p>
            <p className="text-sm font-medium">
              {(user as { role?: string[] }).role?.includes('admin')
                ? t.roleAdmin
                : t.roleLearner}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Calendar className="h-5 w-5 text-muted-foreground shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground">{t.joined}</p>
            <p className="text-sm font-medium">{joinedDate ?? '—'}</p>
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-center">
        <SignOutButton locale={locale}>
          <LogOut className="h-4 w-4 mr-2" />
          {t.signOut}
        </SignOutButton>
      </div>
    </div>
  )
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { locale } = await params
  return {
    title: labels[locale].title,
  }
}

export function generateStaticParams() {
  return [{ locale: 'uk' }, { locale: 'en' }]
}
