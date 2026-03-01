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
import { StepsList } from '@/components/Courses/StepsList'
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
  const file = step.blockType === 'fileStep' && step.file && typeof step.file === 'object'
    ? step.file as CourseFile
    : null

  return (
    <div className="pt-14 pb-16">
      <div className="container max-w-7xl">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
          <Link
            href={`/courses/${slug}`}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            {t.courseBackToOverview}
          </Link>
          <span className="text-sm text-muted-foreground font-medium">
            {stepIndex + 1} / {steps.length}
          </span>
        </div>

        <ProgressBar
          completed={completedCount}
          total={steps.length}
          className="mb-6"
        />

        {/* Two-column layout on desktop */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main content */}
          <div className="flex-1 min-w-0 order-2 lg:order-1">
            <h1 className="text-2xl font-bold mb-5">{stepTitle}</h1>

            <div className="mb-8">
              {step.blockType === 'richTextStep' && step.content && (
                <RichText data={step.content} enableGutter={false} />
              )}

              {step.blockType === 'youtubeVideoStep' && (
                <div className="space-y-3">
                  {step.description && (
                    <p className="text-muted-foreground">{step.description}</p>
                  )}
                  <YouTubeEmbed url={step.youtubeUrl} />
                </div>
              )}

              {step.blockType === 'fileStep' && (
                <div className="space-y-3">
                  {step.description && (
                    <p className="text-muted-foreground">{step.description}</p>
                  )}
                  {file?.url && (
                    <div className="border rounded-xl p-5 bg-card">
                      <div className="flex items-center gap-4 flex-wrap sm:flex-nowrap">
                        <div className="flex-shrink-0 w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center">
                          {file.mimeType?.includes('pdf') ? (
                            <svg className="w-5 h-5 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                              <polyline points="14 2 14 8 20 8" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5 text-orange-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                              <line x1="8" y1="21" x2="16" y2="21" />
                              <line x1="12" y1="17" x2="12" y2="21" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate text-sm">
                            {file.title || file.filename}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {file.mimeType?.includes('pdf') ? 'PDF' : 'Presentation'}
                            {file.filesize ? ` · ${Math.round(file.filesize / 1024)} KB` : ''}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <a href={file.url} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" size="sm">{t.stepOpenFile}</Button>
                          </a>
                          <a href={file.url} download>
                            <Button variant="secondary" size="sm">{t.stepDownloadFile}</Button>
                          </a>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Navigation footer */}
            <div className="flex items-center justify-between gap-4 pt-5 border-t">
              {stepIndex > 0 ? (
                <Link href={`/courses/${slug}/steps/${stepIndex}`}>
                  <Button variant="outline" size="sm">
                    <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                    {t.stepPrevious}
                  </Button>
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
          </div>

          {/* Sidebar steps list — visible on desktop */}
          <aside className="w-full lg:w-72 xl:w-80 flex-shrink-0 order-1 lg:order-2">
            <div className="lg:sticky lg:top-20">
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">{t.courseSteps}</h3>
              <StepsList
                steps={steps}
                courseSlug={slug}
                completedSteps={completedSteps}
                activeStepIndex={stepIndex}
                linked
                completedLabel={t.courseCompleted}
                stepsLabel={t.courseSteps}
              />
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
