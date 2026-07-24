import type { Metadata } from 'next/types'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import React from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { locales, type SiteLocale } from '@/utilities/locales'
import { getFrontendMessages } from '@/utilities/i18n'
import { CourseActionBar } from '@/components/Courses/CourseActionBar'
import { CompletedByTicker } from '@/components/Courses/CompletedByTicker'
import { CourseProgressAndSteps } from '@/components/Courses/CourseProgressAndSteps'
import { CourseUserStateProvider } from '@/components/Courses/CourseUserState'
import type { Course, Media as MediaType } from '@/payload-types'
import { InteractionSection } from '@/components/CommentsAndLikes/InteractionSection'
import { getCachedEnrollmentStats, getCachedLikesCounts } from '@/utilities/contentCounts'
import { ArrowLeft, Check, Heart, Rows3, Users } from 'lucide-react'
import { RewardPill } from '@/components/brand'
import { courseXp } from '@/utilities/xp'
import { plural } from '@/utilities/plural'

// Per-user state (enrollment, progress) is fetched client-side via
// CourseUserStateProvider, so the page itself is the same for everyone and
// can be served from the ISR cache. Enrollment mutations revalidate it by path.
export const revalidate = 300

export async function generateStaticParams() {
  const payload = await getPayload({ config: configPromise })
  const courses = await payload.find({
    collection: 'courses',
    draft: false,
    limit: 1000,
    overrideAccess: false,
    pagination: false,
    where: { _status: { equals: 'published' } },
    select: { slug: true },
  })

  return courses.docs.flatMap(({ slug }) => locales.map((locale) => ({ locale, slug })))
}

type Args = {
  params: Promise<{ locale: SiteLocale; slug: string }>
}

export default async function CourseOverviewPage({ params: paramsPromise }: Args) {
  const { locale, slug } = await paramsPromise
  const t = getFrontendMessages(locale)
  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'courses',
    locale,
    depth: 1,
    where: {
      slug: { equals: slug },
      _status: { equals: 'published' },
    },
    limit: 1,
  })

  const course = result.docs[0] as Course | undefined
  if (!course) notFound()

  const steps = course.steps ?? []

  const [enrollmentStats, courseLikesCounts] = await Promise.all([
    getCachedEnrollmentStats(),
    getCachedLikesCounts('courses'),
  ])
  const enrolledCount = enrollmentStats[course.id]?.enrolledCount ?? 0
  const completedCount = enrollmentStats[course.id]?.completedCount ?? 0
  const likesCount = courseLikesCounts[course.id] ?? 0

  const heroImage =
    course.heroImage && typeof course.heroImage === 'object'
      ? (course.heroImage as MediaType)
      : null
  const heroUrl = heroImage?.sizes?.large?.url || heroImage?.sizes?.xlarge?.url || heroImage?.url
  const prefix = locale === 'en' ? '/en' : ''
  const categoryTitle =
    course.category && typeof course.category === 'object' ? course.category.title : null
  const xpReward = courseXp(steps.length, course.quiz?.enabled === true)

  return (
    <CourseUserStateProvider courseId={course.id}>
    <div className="pb-16">
      <div className="relative overflow-hidden">
        {heroUrl && (
          <Image
            src={heroUrl}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-25"
          />
        )}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(720px 440px at 85% 0%, rgb(4 40 113 / 0.5), transparent 60%), linear-gradient(180deg, rgb(34 52 88 / 0.86) 0%, var(--void) 100%)',
          }}
        />
        <div className="relative container max-w-5xl pb-12 pt-14">
          <Link
            href={`${prefix}/courses`}
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.08em] text-fog transition-colors hover:text-orange"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {t.courseBackToCourses}
          </Link>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            {categoryTitle && <span className="chip">{categoryTitle}</span>}
            <RewardPill>
              {t.courseRewardLabel} · +{xpReward} XP
              {course.quiz?.enabled ? ` · ${t.certificateTitle}` : ''}
            </RewardPill>
          </div>

          <h1 className="heading-display mb-3.5 mt-4 max-w-[22ch] text-[clamp(34px,4.6vw,54px)] font-bold leading-[1.04]">
            {course.title}
          </h1>
          {course.description && (
            <p className="max-w-[60ch] text-[15.5px] leading-relaxed text-fog">
              {course.description}
            </p>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12.5px] font-semibold text-fog">
            <span className="num flex items-center gap-2">
              <Rows3 className="h-[15px] w-[15px] text-orange" />
              {steps.length} {plural(locale, steps.length, t.courseStepsPlural)}
            </span>
            {enrolledCount > 0 && (
              <span className="num flex items-center gap-2">
                <Users className="h-[15px] w-[15px] text-orange" />
                {enrolledCount} {plural(locale, enrolledCount, t.courseEnrolledPlural)}
              </span>
            )}
            {completedCount > 0 && (
              <span className="num flex items-center gap-2">
                <Check className="h-[15px] w-[15px] text-orange" />
                {completedCount} {t.courseCompletedCount}
              </span>
            )}
            {likesCount > 0 && (
              <span className="num flex items-center gap-2">
                <Heart className="h-[15px] w-[15px] text-orange" fill="currentColor" strokeWidth={0} />
                {likesCount}
              </span>
            )}
          </div>

          <CompletedByTicker
            courseId={course.id}
            localePrefix={prefix}
            label={t.tickerCompletedBy}
          />

          <CourseActionBar
            courseId={course.id}
            courseSlug={course.slug}
            steps={steps}
            quizEnabled={course.quiz?.enabled === true}
            localePrefix={prefix}
            labels={{
              completed: t.courseCompleted,
              loginToEnroll: t.courseLoginToEnroll,
              signIn: t.signIn,
              enroll: t.courseEnroll,
              continueLearning: t.courseContinueLearning,
              reviewMaterials: t.courseReviewMaterials,
              quizTakeQuiz: t.quizTakeQuiz,
              quizRetakeQuiz: t.quizRetakeQuiz,
              quizPassed: t.quizPassed,
              quizBestScore: t.quizBestScore,
              downloadCertificate: t.certificateDownload,
            }}
          />
        </div>
      </div>

      <div className="container max-w-5xl mt-8">
        <CourseProgressAndSteps
          courseId={course.id}
          courseSlug={course.slug}
          steps={steps}
          quizEnabled={course.quiz?.enabled === true}
          localePrefix={prefix}
          typeLabels={{
            richTextStep: t.stepRichText,
            youtubeVideoStep: t.stepVideo,
            fileStep: t.stepFile,
          }}
          minutesLabel={t.minutesShort}
          labels={{
            stepProgress: t.stepProgress,
            courseCompleted: t.courseCompleted,
            courseSteps: t.courseSteps,
            quizTitle: t.quizTitle,
            quizPassed: t.quizPassed,
            quizCompleteStepsFirst: t.quizCompleteStepsFirst,
            loginPromptTitle: t.courseLoginPromptTitle,
            loginPromptText: t.courseLoginPromptText,
            loginPromptLogin: t.signIn,
            loginPromptClose: t.courseLoginPromptClose,
          }}
        />

        <InteractionSection
          targetCollection="courses"
          targetId={course.id}
          locale={locale}
          redirectPath={`${prefix}/courses/${course.slug}`}
        />
      </div>
    </div>
    </CourseUserStateProvider>
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { locale, slug } = await paramsPromise
  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'courses',
    locale,
    where: { slug: { equals: slug } },
    limit: 1,
    select: { title: true },
  })

  const course = result.docs[0]
  return {
    title: course?.title ? `${course.title} | Залізна Зміна` : 'Курс',
  }
}
