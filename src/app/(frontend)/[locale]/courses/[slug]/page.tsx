import type { Metadata } from 'next/types'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import React, { Suspense } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { SiteLocale } from '@/utilities/locales'
import { getFrontendMessages } from '@/utilities/i18n'
import { CourseActionBar } from '@/components/Courses/CourseActionBar'
import { CourseProgressAndSteps } from '@/components/Courses/CourseProgressAndSteps'
import { ActionButtonSkeleton } from '@/components/Courses/ActionButtonSkeleton'
import { StepsList } from '@/components/Courses/StepsList'
import type { Course, Media as MediaType } from '@/payload-types'
import { InteractionSection } from '@/components/CommentsAndLikes/InteractionSection'
import { getLikesCountsBatch } from '@/actions/commentsAndLikes'
import { ArrowLeft, Check, Heart, Rows3, Users } from 'lucide-react'
import { RewardPill } from '@/components/brand'
import { courseXp } from '@/utilities/xp'

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
    payload.find({
      collection: 'enrollments',
      where: { course: { equals: course.id } },
      limit: 10000,
      depth: 0,
      select: { status: true },
    }),
    getLikesCountsBatch('courses', [course.id]),
  ])
  const enrolledCount = enrollmentStats.totalDocs
  const completedCount = enrollmentStats.docs.filter((e) => e.status === 'completed').length
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
    <div className="pb-16">
      <div className="relative overflow-hidden">
        {heroUrl && (
          <div
            className="absolute inset-0 bg-cover bg-center opacity-25"
            style={{ backgroundImage: `url(${heroUrl})` }}
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
              {steps.length} {t.courseStepsCount}
            </span>
            {enrolledCount > 0 && (
              <span className="num flex items-center gap-2">
                <Users className="h-[15px] w-[15px] text-orange" />
                {enrolledCount} {t.courseEnrolledCount}
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

          <Suspense fallback={<ActionButtonSkeleton />}>
            <CourseActionBar
              courseId={course.id}
              courseSlug={course.slug}
              steps={steps}
              quizEnabled={course.quiz?.enabled === true}
              localePrefix={prefix}
              labels={{
                completed: t.courseCompleted,
                loginToEnroll: t.courseLoginToEnroll,
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
          </Suspense>
        </div>
      </div>

      <div className="container max-w-5xl mt-8">
        <Suspense
          fallback={
            <div className="flex flex-col lg:flex-row gap-8">
              <div className="flex-1 min-w-0">
                <h2 className="heading-display mb-4 text-xl tracking-[0.06em]">
                  {t.courseSteps} <span className="num text-fog">({steps.length})</span>
                </h2>
                <StepsList
                  steps={steps}
                  courseSlug={course.slug}
                  completedSteps={[]}
                  linked={false}
                  completedLabel={t.courseCompleted}
                  stepsLabel={t.courseSteps}
                  localePrefix={prefix}
                  typeLabels={{
                    richTextStep: t.stepRichText,
                    youtubeVideoStep: t.stepVideo,
                    fileStep: t.stepFile,
                  }}
                  quiz={course.quiz?.enabled ? {
                    enabled: true,
                    passed: false,
                    allStepsCompleted: false,
                    label: t.quizTitle,
                    lockedLabel: t.quizCompleteStepsFirst,
                    passedLabel: t.quizPassed,
                  } : undefined}
                />
              </div>
            </div>
          }
        >
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
            labels={{
              stepProgress: t.stepProgress,
              courseCompleted: t.courseCompleted,
              courseSteps: t.courseSteps,
              quizTitle: t.quizTitle,
              quizPassed: t.quizPassed,
              quizCompleteStepsFirst: t.quizCompleteStepsFirst,
            }}
          />
        </Suspense>

        <InteractionSection targetCollection="courses" targetId={course.id} locale={locale} />
      </div>
    </div>
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
