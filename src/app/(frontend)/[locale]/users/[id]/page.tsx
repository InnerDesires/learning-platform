import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  Award,
  Calendar,
  Facebook,
  Globe,
  Instagram,
  Linkedin,
  Music2,
  Send,
  Twitter,
  Youtube,
  Zap,
  type LucideIcon,
} from 'lucide-react'

import { getPayload } from '@/lib/payload'
import { getFrontendMessages } from '@/utilities/i18n'
import { defaultLocale, type SiteLocale } from '@/utilities/locales'
import { STEP_XP, QUIZ_XP, levelForXp } from '@/utilities/xp'
import { formatDateTime } from '@/utilities/formatDateTime'
import { plural } from '@/utilities/plural'
import type { Course, User } from '@/payload-types'

type Args = {
  params: Promise<{ locale: SiteLocale; id: string }>
}

const socialIcons: Record<string, LucideIcon> = {
  instagram: Instagram,
  facebook: Facebook,
  telegram: Send,
  youtube: Youtube,
  tiktok: Music2,
  linkedin: Linkedin,
  x: Twitter,
  website: Globe,
}

// Public profile: only name, avatar, XP, social links, and completed courses.
// Never render email, role, quiz attempts, or in-progress enrollments here.
async function getPublicUser(id: number): Promise<User | null> {
  if (!Number.isInteger(id) || id <= 0) return null
  const payload = await getPayload()
  const user = await payload.findByID({
    collection: 'users',
    id,
    depth: 0,
    disableErrors: true,
  })
  return user ?? null
}

export default async function PublicProfilePage({ params }: Args) {
  const { locale, id } = await params
  const user = await getPublicUser(Number(id))
  if (!user) notFound()

  const t = getFrontendMessages(locale)
  const prefix = locale === defaultLocale ? '' : `/${locale}`

  const payload = await getPayload()
  const enrollments = await payload.find({
    collection: 'enrollments',
    where: { user: { equals: user.id } },
    sort: '-updatedAt',
    limit: 100,
    depth: 1,
  })

  // Same XP math as the private profile page.
  let stepsDone = 0
  let quizzesPassed = 0
  for (const enrollment of enrollments.docs) {
    stepsDone += Array.isArray(enrollment.completedSteps) ? enrollment.completedSteps.length : 0
    if (enrollment.quizPassed) quizzesPassed += 1
  }
  const completed = enrollments.docs.filter(
    (e) => e.status === 'completed' && typeof e.course === 'object' && e.course,
  )
  const totalXp = stepsDone * STEP_XP + quizzesPassed * QUIZ_XP
  const { level, intoLevel, span } = levelForXp(totalXp)
  const levelPct = Math.round((intoLevel / span) * 100)

  const initials = user.name?.[0]?.toUpperCase() || '?'
  const joinedDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString(locale === 'uk' ? 'uk-UA' : 'en-GB', {
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

        {(user.socialLinks?.length ?? 0) > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-2">
            {user.socialLinks!.map((link) => {
              const Icon = socialIcons[link.platform] ?? Globe
              return (
                <a
                  key={link.id ?? link.url}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  aria-label={link.platform}
                  title={link.url}
                  className="grid h-8 w-8 place-items-center rounded-full border border-line-2 text-fog transition-colors hover:border-orange hover:text-orange"
                >
                  <Icon className="h-3.5 w-3.5" />
                </a>
              )
            })}
          </div>
        )}
      </div>

      {/* stats */}
      <div className="rounded-2xl border border-line-2 bg-[linear-gradient(150deg,rgb(4_40_113/0.5),var(--navy))] p-6">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="num font-display text-3xl font-bold text-orange">{completed.length}</p>
            <p className="mt-1 text-[10.5px] font-bold uppercase tracking-[0.08em] text-fog">
              {plural(locale, completed.length, t.profileStatsCourses)}
            </p>
          </div>
          <div>
            <p className="num font-display text-3xl font-bold text-orange">{stepsDone}</p>
            <p className="mt-1 text-[10.5px] font-bold uppercase tracking-[0.08em] text-fog">
              {plural(locale, stepsDone, t.profileStatsSteps)}
            </p>
          </div>
          <div>
            <p className="num font-display text-3xl font-bold text-orange">{quizzesPassed}</p>
            <p className="mt-1 text-[10.5px] font-bold uppercase tracking-[0.08em] text-fog">
              {plural(locale, quizzesPassed, t.profileStatsQuizzes)}
            </p>
          </div>
        </div>
      </div>

      {/* completed courses — no scores, no certificate downloads */}
      {completed.length > 0 && (
        <>
          <h2 className="heading-display mb-4 mt-10 text-xl tracking-[0.06em]">
            {t.publicProfileCompleted}
          </h2>
          <div className="grid gap-2.5">
            {completed.map((enrollment) => {
              const course = enrollment.course as Course
              const completedAt = enrollment.completedAt ?? enrollment.updatedAt
              return (
                <div
                  key={enrollment.id}
                  className="flex items-center gap-4 rounded-xl border border-line bg-card px-5 py-3.5 transition-colors hover:border-orange/55"
                >
                  <span className="grid h-9 w-9 flex-none place-items-center rounded-full bg-orange/14">
                    <Award className="h-4 w-4 text-orange" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`${prefix}/courses/${course.slug}`}
                      className="block truncate text-sm font-bold transition-colors hover:text-amber"
                    >
                      {course.title}
                    </Link>
                    <p className="num mt-0.5 text-[11px] text-steel">
                      {t.certificateCompletedOn} {formatDateTime(completedAt, locale)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* joined date */}
      {joinedDate && (
        <div className="mt-10 flex items-center gap-3 rounded-2xl border border-line bg-card p-6">
          <Calendar className="h-5 w-5 shrink-0 text-orange" />
          <div>
            <p className="text-xs text-steel">{t.profileJoined}</p>
            <p className="text-sm font-medium">{joinedDate}</p>
          </div>
        </div>
      )}
    </div>
  )
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { locale, id } = await params
  const user = await getPublicUser(Number(id))
  return {
    title: user?.name || getFrontendMessages(locale).profileTitle,
  }
}
