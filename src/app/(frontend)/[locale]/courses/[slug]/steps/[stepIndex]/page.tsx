import { getPayload } from 'payload'
import configPromise from '@payload-config'
import React from 'react'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import type { SiteLocale } from '@/utilities/locales'
import { getFrontendMessages } from '@/utilities/i18n'
import { getSession } from '@/lib/auth/getSession'
import { getEnrollment } from '../../../actions'
import { ProgressBar } from '@/components/Courses/ProgressBar'
import { CompleteStepButton } from '@/components/Courses/CompleteStepButton'
import { YouTubeEmbed } from '@/components/Courses/YouTubeEmbed'
import { Button } from '@/components/ui/button'
import RichText from '@/components/RichText'
import type { Course, CourseFile } from '@/payload-types'

type Args = {
  params: Promise<{ locale: SiteLocale; slug: string; stepIndex: string }>
}

export default async function StepViewerPage({ params: paramsPromise }: Args) {
  const { locale, slug, stepIndex: stepIndexStr } = await paramsPromise
  const t = getFrontendMessages(locale)

  const session = await getSession()
  if (!session?.user) {
    redirect('/login')
  }

  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'courses',
    locale,
    depth: 2,
    where: {
      slug: { equals: slug },
      _status: { equals: 'published' },
    },
    limit: 1,
  })

  const course = result.docs[0] as Course | undefined
  if (!course) notFound()

  const steps = course.steps ?? []
  const stepIndex = parseInt(stepIndexStr, 10) - 1

  if (isNaN(stepIndex) || stepIndex < 0 || stepIndex >= steps.length) {
    notFound()
  }

  const enrollment = await getEnrollment(course.id)
  if (!enrollment) {
    redirect(`/courses/${slug}`)
  }

  const step = steps[stepIndex]
  const completedSteps: string[] = Array.isArray(enrollment.completedSteps)
    ? (enrollment.completedSteps as string[])
    : []
  const isStepCompleted = completedSteps.includes(step.id ?? '')
  const isCourseCompleted = enrollment.status === 'completed'
  const completedCount = completedSteps.length
  const isLastStep = stepIndex === steps.length - 1
  const stepTitle = 'title' in step ? step.title : `${t.courseSteps} ${stepIndex + 1}`

  return (
    <div className="pt-24 pb-24">
      <div className="container max-w-4xl">
        <div className="flex items-center gap-4 mb-6 flex-wrap">
          <Link
            href={`/courses/${slug}`}
            className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
          >
            ← {t.courseBackToOverview}
          </Link>
          <span className="text-sm text-muted-foreground">
            {t.courseSteps} {stepIndex + 1} {t.stepOf} {steps.length}
          </span>
        </div>

        <ProgressBar
          completed={completedCount}
          total={steps.length}
          label={t.stepProgress}
          className="mb-8"
        />

        <h1 className="text-2xl font-bold mb-6">{stepTitle}</h1>

        <div className="mb-8">
          {step.blockType === 'richTextStep' && step.content && (
            <RichText data={step.content} enableGutter={false} />
          )}

          {step.blockType === 'youtubeVideoStep' && (
            <div className="space-y-4">
              {step.description && (
                <p className="text-muted-foreground">{step.description}</p>
              )}
              <YouTubeEmbed url={step.youtubeUrl} />
            </div>
          )}

          {step.blockType === 'fileStep' && (
            <div className="space-y-4">
              {step.description && (
                <p className="text-muted-foreground">{step.description}</p>
              )}
              {step.file && typeof step.file === 'object' && (step.file as CourseFile).url && (
                <div className="border rounded-lg p-6 bg-card">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-xl">
                      {(step.file as CourseFile).mimeType?.includes('pdf') ? '📄' : '📊'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {(step.file as CourseFile).title || (step.file as CourseFile).filename}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {(step.file as CourseFile).mimeType?.includes('pdf') ? 'PDF' : 'Presentation'}
                        {(step.file as CourseFile).filesize
                          ? ` · ${Math.round(((step.file as CourseFile).filesize ?? 0) / 1024)} KB`
                          : ''}
                      </p>
                    </div>
                    <a
                      href={(step.file as CourseFile).url!}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline">{t.stepOpenFile}</Button>
                    </a>
                    <a
                      href={(step.file as CourseFile).url!}
                      download
                    >
                      <Button variant="secondary">{t.stepDownloadFile}</Button>
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-4 pt-6 border-t">
          {stepIndex > 0 ? (
            <Link href={`/courses/${slug}/steps/${stepIndex}`}>
              <Button variant="outline">← {t.stepPrevious}</Button>
            </Link>
          ) : (
            <div />
          )}

          <CompleteStepButton
            enrollmentId={enrollment.id}
            stepBlockId={step.id ?? ''}
            courseId={course.id}
            courseSlug={course.slug}
            isLastStep={isLastStep}
            nextStepIndex={stepIndex + 2}
            isAlreadyCompleted={isStepCompleted}
            isCourseCompleted={isCourseCompleted}
            completeAndContinueLabel={t.stepCompleteAndContinue}
            completeLabel={t.stepComplete}
            nextLabel={t.stepNext}
          />
        </div>

        <div className="mt-8 border-t pt-6">
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">{t.courseSteps}</h3>
          <div className="space-y-1">
            {steps.map((s, i) => {
              const isActive = i === stepIndex
              const isComplete = completedSteps.includes(s.id ?? '')
              const sTitle = 'title' in s ? s.title : `${t.courseSteps} ${i + 1}`

              return (
                <Link
                  key={s.id ?? i}
                  href={`/courses/${slug}/steps/${i + 1}`}
                  className={`flex items-center gap-3 p-2 rounded-lg text-sm transition-colors ${
                    isActive
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'hover:bg-secondary'
                  }`}
                >
                  <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                    isComplete ? 'bg-green-500 text-white' : 'bg-secondary'
                  }`}>
                    {isComplete ? '✓' : i + 1}
                  </span>
                  <span className="truncate">{sTitle}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
