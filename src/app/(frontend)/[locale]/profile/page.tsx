import type { Metadata } from 'next'
import Link from 'next/link'
import {
  ArrowRight,
  Award,
  Calendar,
  Download,
  ExternalLink,
  Facebook,
  Globe,
  Instagram,
  Linkedin,
  LogOut,
  Mail,
  Music2,
  Send,
  Settings,
  Shield,
  Twitter,
  Youtube,
  Zap,
  type LucideIcon,
} from 'lucide-react'

import { getPayload } from '@/lib/payload'
import { requireSession } from '@/lib/auth/requireSession'
import { getFrontendMessages } from '@/utilities/i18n'
import { defaultLocale, type SiteLocale } from '@/utilities/locales'
import { STEP_XP, QUIZ_XP, levelForXp } from '@/utilities/xp'
import { formatDateTime } from '@/utilities/formatDateTime'
import { plural } from '@/utilities/plural'
import type { Course } from '@/payload-types'
import { SignOutButton } from './SignOutButton'

type Args = {
  params: Promise<{ locale: SiteLocale }>
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

export default async function ProfilePage({ params }: Args) {
  const { locale } = await params
  const profilePath = locale === defaultLocale ? '/profile' : `/${locale}/profile`
  const session = await requireSession(locale, profilePath)
  const user = session.user
  const t = getFrontendMessages(locale)
  const prefix = locale === defaultLocale ? '' : `/${locale}`

  const payload = await getPayload()
  const [userDoc, enrollments, recentAttempts] = await Promise.all([
    payload.findByID({
      collection: 'users',
      id: Number(user.id),
    }),
    payload.find({
      collection: 'enrollments',
      where: { user: { equals: Number(user.id) } },
      sort: '-updatedAt',
      limit: 100,
      depth: 1,
    }),
    payload.find({
      collection: 'quiz-attempts',
      where: { user: { equals: Number(user.id) } },
      sort: '-createdAt',
      limit: 5,
      depth: 1,
    }),
  ])

  // XP scoreboard: 30 XP per completed step, 100 XP per passed final quiz.
  let stepsDone = 0
  let quizzesPassed = 0
  for (const enrollment of enrollments.docs) {
    stepsDone += Array.isArray(enrollment.completedSteps) ? enrollment.completedSteps.length : 0
    if (enrollment.quizPassed) quizzesPassed += 1
  }
  const completed = enrollments.docs.filter(
    (e) => e.status === 'completed' && typeof e.course === 'object' && e.course,
  )
  const inProgress = enrollments.docs.filter(
    (e) => e.status !== 'completed' && typeof e.course === 'object' && e.course,
  )
  const totalXp = stepsDone * STEP_XP + quizzesPassed * QUIZ_XP
  const { level, intoLevel, span } = levelForXp(totalXp)
  const levelPct = Math.round((intoLevel / span) * 100)

  // Prefer the DB doc over the session snapshot: the session cookie cache can
  // lag behind server-action updates (avatar) by up to its 5-minute maxAge.
  const displayName = userDoc.name || user.name || ''
  const image = userDoc.image ?? user.image
  const initials = (displayName || user.email)?.[0]?.toUpperCase() || '?'
  const joinedDate =
    userDoc?.createdAt != null
      ? new Date(userDoc.createdAt).toLocaleDateString(locale === 'uk' ? 'uk-UA' : 'en-GB', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : null

  const sectionHeading = 'heading-display mb-4 mt-10 text-xl tracking-[0.06em]'

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
          {image ? (
            <img
              src={image}
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
          <h1 className="heading-display text-2xl">{displayName}</h1>
          <p className="num mt-1.5 inline-flex items-center gap-1.5 font-display text-sm font-semibold uppercase tracking-[0.08em] text-amber">
            <Zap className="h-3.5 w-3.5" fill="currentColor" strokeWidth={0} />
            {t.profileLevel} {level} · {totalXp.toLocaleString('uk-UA')} XP
          </p>
        </div>

        {userDoc.about && (
          <p className="max-w-prose whitespace-pre-line text-center text-sm leading-relaxed text-fog">
            {userDoc.about}
          </p>
        )}

        {(userDoc.socialLinks?.length ?? 0) > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-2">
            {userDoc.socialLinks!.map((link) => {
              const Icon = socialIcons[link.platform] ?? Globe
              return (
                <a
                  key={link.id ?? link.url}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
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

        <div className="flex flex-wrap items-center justify-center gap-2">
          <Link
            href={`${prefix}/profile/settings`}
            className="inline-flex items-center gap-2 rounded-full border-[1.5px] border-line-2 px-4 py-1.5 font-display text-xs font-semibold uppercase tracking-[0.1em] text-cloud transition-colors hover:border-orange hover:text-orange"
          >
            <Settings className="h-3.5 w-3.5" />
            {t.profileSettings}
          </Link>
          <Link
            href={`${prefix}/users/${user.id}`}
            className="inline-flex items-center gap-2 rounded-full border-[1.5px] border-line-2 px-4 py-1.5 font-display text-xs font-semibold uppercase tracking-[0.1em] text-cloud transition-colors hover:border-orange hover:text-orange"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            {t.profileViewPublic}
          </Link>
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

      {/* courses in progress */}
      <h2 className={sectionHeading}>{t.profileMyCourses}</h2>
      {inProgress.length === 0 && completed.length === 0 ? (
        <div className="rounded-2xl border border-line bg-card p-8 text-center">
          <p className="text-sm text-fog">{t.profileNoCourses}</p>
          <Link
            href={`${prefix}/courses`}
            className="mt-4 inline-flex items-center gap-2 rounded-full border-[1.5px] border-line-2 px-5 py-2 font-display text-xs font-semibold uppercase tracking-[0.1em] text-cloud transition-colors hover:border-orange hover:text-orange"
          >
            {t.profileBrowseCourses}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      ) : (
        <div className="grid gap-2.5">
          {inProgress.map((enrollment) => {
            const course = enrollment.course as Course
            const stepsTotal = course.steps?.length ?? 0
            const done = Array.isArray(enrollment.completedSteps)
              ? enrollment.completedSteps.length
              : 0
            const pct = stepsTotal > 0 ? Math.round((done / stepsTotal) * 100) : 0
            const nextStep = Math.min(done + 1, Math.max(stepsTotal, 1))
            return (
              <Link
                key={enrollment.id}
                href={`${prefix}/courses/${course.slug}/steps/${nextStep}`}
                className="group rounded-xl border border-line bg-card px-5 py-4 transition-colors hover:border-orange/55"
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="min-w-0 break-words text-sm font-bold transition-colors group-hover:text-amber">
                    {course.title}
                  </span>
                  <span className="num flex-none text-[11px] font-bold uppercase tracking-[0.1em] text-amber">
                    {done}/{stepsTotal} · {pct}%
                  </span>
                </div>
                <div className="pbar mt-2.5">
                  <i style={{ width: `${pct}%` }} />
                </div>
              </Link>
            )
          })}
          {inProgress.length === 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-card px-5 py-4">
              <p className="text-sm text-fog">{t.profileAllCoursesDone}</p>
              <Link
                href={`${prefix}/courses`}
                className="inline-flex items-center gap-2 rounded-full border-[1.5px] border-line-2 px-4 py-1.5 font-display text-xs font-semibold uppercase tracking-[0.1em] text-cloud transition-colors hover:border-orange hover:text-orange"
              >
                {t.profileBrowseCourses}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}
        </div>
      )}

      {/* certificates */}
      {completed.length > 0 && (
        <>
          <h2 className={sectionHeading}>{t.profileCertificates}</h2>
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
                      className="block break-words text-sm font-bold transition-colors hover:text-amber"
                    >
                      {course.title}
                    </Link>
                    <p className="num mt-0.5 text-[11px] text-steel">
                      {t.certificateCompletedOn} {formatDateTime(completedAt, locale)}
                      {enrollment.bestQuizScore != null && (
                        <span className="text-success"> · {enrollment.bestQuizScore}%</span>
                      )}
                    </p>
                  </div>
                  <a
                    href={`/courses/${course.slug}/certificate`}
                    download
                    className="grid h-9 w-9 flex-none place-items-center rounded-full border border-line-2 text-fog transition-colors hover:border-orange hover:text-orange"
                    aria-label={t.certificateDownload}
                    title={t.certificateDownload}
                  >
                    <Download className="h-4 w-4" />
                  </a>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* recent quiz attempts */}
      {recentAttempts.docs.length > 0 && (
        <>
          <h2 className={sectionHeading}>{t.profileRecentQuizzes}</h2>
          <div className="grid gap-2.5">
            {recentAttempts.docs.map((attempt) => {
              const course =
                typeof attempt.course === 'object' && attempt.course
                  ? (attempt.course as Course)
                  : null
              return (
                <div
                  key={attempt.id}
                  className="flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-xl border border-line bg-card px-5 py-3 text-[13px] font-semibold"
                >
                  <b
                    className={`num min-w-[52px] font-display text-[17px] font-semibold ${
                      attempt.passed ? 'text-success' : 'text-cloud'
                    }`}
                  >
                    {attempt.score}%
                  </b>
                  <span
                    className={`rounded-full px-2.5 py-0.5 font-display text-[10.5px] font-semibold uppercase tracking-[0.1em] ${
                      attempt.passed ? 'bg-success/18 text-success' : 'bg-error/16 text-error'
                    }`}
                  >
                    {attempt.passed ? t.quizPassed : t.quizFailed}
                  </span>
                  {course && (
                    <Link
                      href={`${prefix}/courses/${course.slug}/quiz`}
                      className="order-first w-full min-w-0 break-words text-cloud transition-colors hover:text-amber sm:order-none sm:w-auto sm:flex-1 sm:truncate sm:text-fog sm:hover:text-cloud"
                    >
                      {course.title}
                    </Link>
                  )}
                  <span className="num text-xs font-medium text-steel-dim sm:ml-auto">
                    {formatDateTime(attempt.createdAt, locale)}
                  </span>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* account info */}
      <div className="mt-10 space-y-5 rounded-2xl border border-line bg-card p-6">
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

      <div className="mt-8">
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
