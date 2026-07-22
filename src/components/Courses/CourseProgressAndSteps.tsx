'use client'

import React from 'react'
import { useCourseUserState } from './CourseUserState'
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
  localePrefix?: string
  typeLabels?: { richTextStep: string; youtubeVideoStep: string; fileStep: string }
  minutesLabel?: string
  labels: {
    stepProgress: string
    courseCompleted: string
    courseSteps: string
    quizTitle: string
    quizPassed: string
    quizCompleteStepsFirst: string
  }
}

export function CourseProgressAndSteps({ courseSlug, steps, quizEnabled, localePrefix, typeLabels, minutesLabel, labels }: Props) {
  const { enrollment } = useCourseUserState()
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
          <h2 className="heading-display mb-4 text-xl tracking-[0.06em]">
            {labels.courseSteps} <span className="num text-fog">({steps.length})</span>
          </h2>
          <StepsList
            steps={steps}
            courseSlug={courseSlug}
            completedSteps={completedSteps}
            linked={isEnrolled}
            completedLabel={labels.courseCompleted}
            stepsLabel={labels.courseSteps}
            localePrefix={localePrefix}
            typeLabels={typeLabels}
            minutesLabel={minutesLabel}
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
