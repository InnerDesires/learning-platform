import type { Metadata } from 'next/types'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import React from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { SiteLocale } from '@/utilities/locales'
import { getFrontendMessages } from '@/utilities/i18n'
import { getSession } from '@/lib/auth/getSession'
import { getEnrollment } from '../actions'
import { Media } from '@/components/Media'
import { EnrollButton } from '@/components/Courses/EnrollButton'
import { ProgressBar } from '@/components/Courses/ProgressBar'
import { Button } from '@/components/ui/button'
import type { Course } from '@/payload-types'

type Args = {
  params: Promise<{ locale: SiteLocale; slug: string }>
}

function getStepIcon(blockType: string) {
  switch (blockType) {
    case 'richTextStep':
      return '📄'
    case 'youtubeVideoStep':
      return '▶️'
    case 'fileStep':
      return '📎'
    default:
      return '•'
  }
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
  let session: Awaited<ReturnType<typeof getSession>> = null
  let enrollment: Awaited<ReturnType<typeof getEnrollment>> = null

  try {
    session = await getSession()
    if (session?.user) {
      enrollment = await getEnrollment(course.id)
    }
  } catch {
    // Anonymous user
  }

  const completedSteps: string[] = Array.isArray(enrollment?.completedSteps)
    ? (enrollment.completedSteps as string[])
    : []
  const completedCount = completedSteps.length
  const isEnrolled = !!enrollment
  const isCompleted = enrollment?.status === 'completed'
  const isLoggedIn = !!session?.user

  const firstIncompleteIndex = steps.findIndex((step) => !completedSteps.includes(step.id ?? ''))
  const continueStepIndex = firstIncompleteIndex >= 0 ? firstIncompleteIndex + 1 : 1

  return (
    <div className="pt-24 pb-24">
      <div className="container max-w-4xl">
        <Link href="/courses" className="text-sm text-muted-foreground hover:text-primary transition-colors mb-6 inline-flex items-center gap-1">
          ← {t.courseBackToCourses}
        </Link>

        {course.heroImage && typeof course.heroImage === 'object' && (
          <div className="rounded-2xl overflow-hidden mb-8 mt-4">
            <Media resource={course.heroImage} />
          </div>
        )}

        <div className="flex flex-col gap-6">
          <div>
            {isCompleted && (
              <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full bg-green-500 text-white mb-3">
                {t.courseCompleted}
              </span>
            )}
            <h1 className="text-3xl font-bold">{course.title}</h1>
            {course.description && (
              <p className="mt-3 text-lg text-muted-foreground">{course.description}</p>
            )}
          </div>

          {isEnrolled && (
            <ProgressBar
              completed={completedCount}
              total={steps.length}
              label={t.stepProgress}
            />
          )}

          <div className="flex gap-3 items-center">
            {!isLoggedIn && (
              <Link href="/login">
                <Button size="lg" variant="outline">
                  {t.courseLoginToEnroll}
                </Button>
              </Link>
            )}
            {isLoggedIn && !isEnrolled && (
              <EnrollButton
                courseId={course.id}
                courseSlug={course.slug}
                label={t.courseEnroll}
              />
            )}
            {isEnrolled && !isCompleted && (
              <Link href={`/courses/${course.slug}/steps/${continueStepIndex}`}>
                <Button size="lg">{t.courseContinueLearning}</Button>
              </Link>
            )}
            {isCompleted && (
              <Link href={`/courses/${course.slug}/steps/1`}>
                <Button size="lg" variant="outline">{t.courseStartLearning}</Button>
              </Link>
            )}
          </div>

          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">
              {t.courseSteps} ({steps.length})
            </h2>
            <div className="space-y-2">
              {steps.map((step, index) => {
                const isStepCompleted = completedSteps.includes(step.id ?? '')
                const stepTitle = 'title' in step ? step.title : `${t.courseSteps} ${index + 1}`

                return (
                  <div
                    key={step.id ?? index}
                    className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                  >
                    <span className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium bg-secondary">
                      {isStepCompleted ? '✓' : index + 1}
                    </span>
                    <span className="mr-1">{getStepIcon(step.blockType)}</span>
                    <span className="flex-1 text-sm font-medium">{stepTitle}</span>
                    {isStepCompleted && (
                      <span className="text-green-500 text-xs font-semibold">{t.courseCompleted}</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
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
