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

  return (
    <div className="pb-16">
      <div className="relative overflow-hidden">
        {heroUrl ? (
          <>
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${heroUrl})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/90 to-background" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-background" />
        )}
        <div className="relative container max-w-5xl pt-20 pb-10">
          <Link
            href="/courses"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1.5 mb-6"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
            {t.courseBackToCourses}
          </Link>

          <div className="flex flex-col lg:flex-row lg:items-start gap-8">
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">{course.title}</h1>
              {course.description && (
                <p className="mt-3 text-lg text-muted-foreground max-w-2xl">{course.description}</p>
              )}

              <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <line x1="9" y1="3" x2="9" y2="21" />
                  </svg>
                  {steps.length} {t.courseStepsCount}
                </span>
                {enrolledCount > 0 && (
                  <span className="flex items-center gap-1.5">
                    <svg
                      className="w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                    </svg>
                    {enrolledCount} {t.courseEnrolledCount}
                  </span>
                )}
                {completedCount > 0 && (
                  <span className="flex items-center gap-1.5">
                    <svg
                      className="w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                    {completedCount} {t.courseCompletedCount}
                  </span>
                )}
              </div>

              <Suspense fallback={<ActionButtonSkeleton />}>
                <CourseActionBar
                  courseId={course.id}
                  courseSlug={course.slug}
                  steps={steps}
                  quizEnabled={course.quiz?.enabled === true}
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
        </div>
      </div>

      <div className="container max-w-5xl mt-8">
        <Suspense
          fallback={
            <div className="flex flex-col lg:flex-row gap-8">
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-semibold mb-4">
                  {t.courseSteps} ({steps.length})
                </h2>
                <StepsList
                  steps={steps}
                  courseSlug={course.slug}
                  completedSteps={[]}
                  linked={false}
                  completedLabel={t.courseCompleted}
                  stepsLabel={t.courseSteps}
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
