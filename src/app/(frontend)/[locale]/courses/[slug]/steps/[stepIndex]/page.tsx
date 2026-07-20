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
import { YouTubeEmbed } from '@/components/YouTubeEmbed'
import { FileEmbed } from '@/components/Courses/FileEmbed'
import { StepsList } from '@/components/Courses/StepsList'
import { Button } from '@/components/ui/button'
import RichText from '@/components/RichText'
import { ArrowLeft } from 'lucide-react'
import type { Course, CourseFile } from '@/payload-types'

type Args = {
  params: Promise<{ locale: SiteLocale; slug: string; stepIndex: string }>
}

export default async function StepViewerPage({ params: paramsPromise }: Args) {
  const { locale, slug, stepIndex: stepIndexStr } = await paramsPromise
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

  const prefix = locale === 'en' ? '/en' : ''

  return (
    <div className="pt-10 pb-16">
      <div className="container max-w-7xl">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
          <Link
            href={`${prefix}/courses/${slug}`}
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.08em] text-fog transition-colors hover:text-orange"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {t.courseBackToOverview}
          </Link>
          <span className="num font-display text-sm tracking-[0.14em] text-fog">
            {t.courseSteps} <b className="font-semibold text-amber">{stepIndex + 1}</b> / {steps.length}
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
          <div className="order-1 min-w-0 flex-1">
            <h1 className="heading-display mb-5 text-[clamp(24px,3vw,34px)]">{stepTitle}</h1>

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
                <Link href={`${prefix}/courses/${slug}/steps/${stepIndex}`}>
                  <Button variant="outline" size="sm">
                    <ArrowLeft className="mr-1 h-4 w-4" />
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
              />
            </div>
          </div>

          {/* Sidebar steps list — visible on desktop */}
          <aside className="order-2 w-full flex-shrink-0 lg:w-72 xl:w-80">
            <div className="rounded-2xl border border-line bg-card p-4 lg:sticky lg:top-24">
              <h3 className="mb-3.5 px-1 font-display text-xs font-semibold uppercase tracking-[0.2em] text-fog">
                {t.courseSteps}
              </h3>
              <StepsList
                steps={steps}
                courseSlug={slug}
                completedSteps={completedSteps}
                activeStepIndex={stepIndex}
                linked
                completedLabel={t.courseCompleted}
                stepsLabel={t.courseSteps}
                localePrefix={prefix}
                compact
                typeLabels={{
                  richTextStep: t.stepRichText,
                  youtubeVideoStep: t.stepVideo,
                  fileStep: t.stepFile,
                }}
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
