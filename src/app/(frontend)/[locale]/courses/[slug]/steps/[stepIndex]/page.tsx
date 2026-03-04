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
import { FileEmbed } from '@/components/Courses/FileEmbed'
import { StepsList } from '@/components/Courses/StepsList'
import { Button } from '@/components/ui/button'
import RichText from '@/components/RichText'
import type { Course, CourseFile } from '@/payload-types'

type Args = {
  params: Promise<{ locale: SiteLocale; slug: string; stepIndex: string }>
  searchParams: Promise<{ oc?: string }>
}

export default async function StepViewerPage({ params: paramsPromise, searchParams: searchParamsPromise }: Args) {
  const [{ locale, slug, stepIndex: stepIndexStr }, { oc }] = await Promise.all([
    paramsPromise,
    searchParamsPromise,
  ])
  const t = getFrontendMessages(locale)

  const payload = await getPayload({ config: configPromise })

  const [session, result] = await Promise.all([
    getSession(),
    payload.find({
      collection: 'courses',
      locale,
      depth: 2,
      where: {
        slug: { equals: slug },
        _status: { equals: 'published' },
      },
      limit: 1,
    }),
  ])

  if (!session?.user) {
    redirect('/login')
  }

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
  const dbCompletedSteps: string[] = Array.isArray(enrollment.completedSteps)
    ? (enrollment.completedSteps as string[])
    : []
  const validStepIds = new Set(steps.map((s) => s.id).filter(Boolean))
  const optimisticIds = oc ? oc.split(',').filter((id) => validStepIds.has(id)) : []
  const completedSteps = [...new Set([...dbCompletedSteps, ...optimisticIds])]
  const pendingOptimisticIds = optimisticIds.filter((id) => !dbCompletedSteps.includes(id))
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
          completed={course.quiz?.enabled ? completedCount + (enrollment.quizPassed ? 1 : 0) : completedCount}
          total={course.quiz?.enabled ? steps.length + 1 : steps.length}
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
                    <FileEmbed
                      url={file.url}
                      mimeType={file.mimeType}
                      filename={file.filename}
                      title={file.title}
                      filesize={file.filesize}
                      downloadLabel={t.stepDownloadFile}
                      openLabel={t.stepOpenFile}
                    />
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
                quizEnabled={course.quiz?.enabled === true}
                completeAndContinueLabel={t.stepCompleteAndContinue}
                completeLabel={t.stepComplete}
                nextLabel={t.stepNext}
                optimisticStepIds={pendingOptimisticIds}
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
                quiz={course.quiz?.enabled ? {
                  enabled: true,
                  passed: enrollment.quizPassed === true,
                  allStepsCompleted: completedSteps.length >= steps.length,
                  label: t.quizTitle,
                  lockedLabel: t.quizCompleteStepsFirst,
                  passedLabel: t.quizPassed,
                } : undefined}
              />
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
