import type { Metadata } from 'next'
import { LogOut, Mail, Shield, Calendar, Zap } from 'lucide-react'

import { getPayload } from '@/lib/payload'
import { requireSession } from '@/lib/auth/requireSession'
import { getFrontendMessages } from '@/utilities/i18n'
import { defaultLocale, type SiteLocale } from '@/utilities/locales'
import { STEP_XP, QUIZ_XP, levelForXp } from '@/utilities/xp'
import { SignOutButton } from './SignOutButton'

type Args = {
  params: Promise<{ locale: SiteLocale }>
}

export default async function ProfilePage({ params }: Args) {
  const { locale } = await params
  const profilePath = locale === defaultLocale ? '/profile' : `/${locale}/profile`
  const session = await requireSession(locale, profilePath)
  const user = session.user
  const t = getFrontendMessages(locale)

  const payload = await getPayload()
  const [userDoc, enrollments] = await Promise.all([
    payload.findByID({
      collection: 'users',
      id: Number(user.id),
    }),
    payload.find({
      collection: 'enrollments',
      where: { user: { equals: Number(user.id) } },
      limit: 1000,
      depth: 0,
      select: { completedSteps: true, status: true, quizPassed: true },
    }),
  ])

  // XP scoreboard: 30 XP per completed step, 100 XP per passed final quiz.
  let stepsDone = 0
  let quizzesPassed = 0
  let coursesCompleted = 0
  for (const enrollment of enrollments.docs) {
    stepsDone += Array.isArray(enrollment.completedSteps) ? enrollment.completedSteps.length : 0
    if (enrollment.quizPassed) quizzesPassed += 1
    if (enrollment.status === 'completed') coursesCompleted += 1
  }
  const totalXp = stepsDone * STEP_XP + quizzesPassed * QUIZ_XP
  const { level, intoLevel, span } = levelForXp(totalXp)
  const levelPct = Math.round((intoLevel / span) * 100)

  const initials = (user.name || user.email)?.[0]?.toUpperCase() || '?'
  const joinedDate =
    userDoc?.createdAt != null
      ? new Date(userDoc.createdAt).toLocaleDateString(locale === 'uk' ? 'uk-UA' : 'en-GB', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : null

  return (
    <div className="container max-w-2xl py-16">
      <div className="mb-8 flex flex-col items-center gap-4">
        {/* avatar with XP level ring */}
        <div
          className="h-24 w-24 rounded-full p-[4px]"
          style={{
            background: `conic-gradient(from -90deg, var(--orange) 0 ${levelPct}%, var(--blue-line) ${levelPct}% 100%)`,
          }}
        >
          {user.image ? (
            <img
              src={user.image}
              alt=""
              className="h-full w-full rounded-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center rounded-full bg-navy-2 font-display text-3xl font-bold text-amber">
              {initials}
            </span>
          )}
        </div>
        <div className="text-center">
          <h1 className="heading-display text-2xl">{user.name}</h1>
          <p className="num mt-1.5 inline-flex items-center gap-1.5 font-display text-sm font-semibold uppercase tracking-[0.08em] text-amber">
            <Zap className="h-3.5 w-3.5" fill="currentColor" strokeWidth={0} />
            {t.profileLevel} {level} · {totalXp.toLocaleString('uk-UA')} XP
          </p>
        </div>
      </div>

      {/* XP progress to next level */}
      <div className="rounded-2xl border border-line-2 bg-[linear-gradient(150deg,rgb(4_40_113/0.5),var(--navy))] p-6">
        <div className="mb-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.1em] text-fog">
          <span>{t.profileToNextLevel}</span>
          <b className="num text-amber">
            {intoLevel}/{span} XP
          </b>
        </div>
        <div className="pbar" role="progressbar" aria-valuenow={levelPct} aria-valuemin={0} aria-valuemax={100}>
          <i style={{ width: `${levelPct}%` }} />
        </div>
        <div className="mt-5 grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="num font-display text-3xl font-bold text-orange">{coursesCompleted}</p>
            <p className="mt-1 text-[10.5px] font-bold uppercase tracking-[0.08em] text-fog">
              {t.profileStatsCourses}
            </p>
          </div>
          <div>
            <p className="num font-display text-3xl font-bold text-orange">{stepsDone}</p>
            <p className="mt-1 text-[10.5px] font-bold uppercase tracking-[0.08em] text-fog">
              {t.profileStatsSteps}
            </p>
          </div>
          <div>
            <p className="num font-display text-3xl font-bold text-orange">{quizzesPassed}</p>
            <p className="mt-1 text-[10.5px] font-bold uppercase tracking-[0.08em] text-fog">
              {t.profileStatsQuizzes}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 space-y-5 rounded-2xl border border-line bg-card p-6">
        <div className="flex items-center gap-3">
          <Mail className="h-5 w-5 shrink-0 text-orange" />
          <div>
            <p className="text-xs text-steel">{t.profileEmail}</p>
            <p className="text-sm font-medium">{user.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Shield className="h-5 w-5 shrink-0 text-orange" />
          <div>
            <p className="text-xs text-steel">{t.profileRole}</p>
            <p className="text-sm font-medium">
              {(user as { role?: string[] }).role?.includes('admin')
                ? t.profileRoleAdmin
                : t.profileRoleLearner}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Calendar className="h-5 w-5 shrink-0 text-orange" />
          <div>
            <p className="text-xs text-steel">{t.profileJoined}</p>
            <p className="text-sm font-medium">{joinedDate ?? '—'}</p>
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-center">
        <SignOutButton locale={locale}>
          <LogOut className="mr-2 h-4 w-4" />
          {t.profileSignOut}
        </SignOutButton>
      </div>
    </div>
  )
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { locale } = await params
  return {
    title: getFrontendMessages(locale).profileTitle,
  }
}

export function generateStaticParams() {
  return [{ locale: 'uk' }, { locale: 'en' }]
}
