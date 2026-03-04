import React from 'react'
import { getSession } from '@/lib/auth/getSession'
import { getEnrollment } from '@/app/(frontend)/[locale]/courses/actions'
import { ProgressBar } from './ProgressBar'
import { StepsList } from './StepsList'

type Step = {
  id?: string | null
  blockType: string
  title?: string
  [key: string]: unknown
}

type Props = {
  courseId: number
  courseSlug: string
  steps: Step[]
  quizEnabled?: boolean
  labels: {
    stepProgress: string
    courseCompleted: string
    courseSteps: string
    quizTitle: string
    quizPassed: string
    quizCompleteStepsFirst: string
  }
}

export async function CourseProgressAndSteps({ courseId, courseSlug, steps, quizEnabled, labels }: Props) {
  const session = await getSession().catch(() => null)
  const enrollment = session?.user ? await getEnrollment(courseId) : null
  const isEnrolled = !!enrollment

  const completedSteps: string[] = Array.isArray(enrollment?.completedSteps)
    ? (enrollment.completedSteps as string[])
    : []

  const allStepsCompleted = completedSteps.length >= steps.length
  const quizPassed = enrollment?.quizPassed === true

  const progressTotal = quizEnabled ? steps.length + 1 : steps.length
  const progressCompleted = quizEnabled ? completedSteps.length + (quizPassed ? 1 : 0) : completedSteps.length

  return (
    <>
      {isEnrolled && (
        <ProgressBar
          completed={progressCompleted}
          total={progressTotal}
          label={labels.stepProgress}
          className="mb-8"
        />
      )}
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-semibold mb-4">
            {labels.courseSteps} ({steps.length})
          </h2>
          <StepsList
            steps={steps}
            courseSlug={courseSlug}
            completedSteps={completedSteps}
            linked={isEnrolled}
            completedLabel={labels.courseCompleted}
            stepsLabel={labels.courseSteps}
            quiz={quizEnabled ? {
              enabled: true,
              passed: quizPassed,
              allStepsCompleted,
              label: labels.quizTitle,
              lockedLabel: labels.quizCompleteStepsFirst,
              passedLabel: labels.quizPassed,
            } : undefined}
          />
        </div>
      </div>
    </>
  )
}
