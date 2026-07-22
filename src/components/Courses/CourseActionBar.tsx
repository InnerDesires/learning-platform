'use client'

import React from 'react'
import Link from 'next/link'
import { useCourseUserState } from './CourseUserState'
import { ActionButtonSkeleton } from './ActionButtonSkeleton'
import { EnrollButton } from './EnrollButton'
import { Button } from '@/components/ui/button'

type Step = {
  id?: string | null
  [key: string]: unknown
}

type Props = {
  courseId: number
  courseSlug: string
  steps: Step[]
  quizEnabled?: boolean
  localePrefix?: string
  quizPassed?: boolean
  bestQuizScore?: number | null
  labels: {
    completed: string
    loginToEnroll: string
    enroll: string
    continueLearning: string
    reviewMaterials: string
    quizTakeQuiz?: string
    quizRetakeQuiz?: string
    quizPassed?: string
    quizBestScore?: string
    downloadCertificate: string
  }
}

export function CourseActionBar({ courseId, courseSlug, steps, quizEnabled, localePrefix = '', labels }: Props) {
  const { loading, isLoggedIn, enrollment } = useCourseUserState()

  if (loading) return <ActionButtonSkeleton />

  const isEnrolled = !!enrollment
  const isCompleted = enrollment?.status === 'completed'

  const completedSteps: string[] = Array.isArray(enrollment?.completedSteps)
    ? (enrollment.completedSteps as string[])
    : []
  const firstIncompleteIndex = steps.findIndex((step) => !completedSteps.includes(step.id ?? ''))
  const continueStepIndex = firstIncompleteIndex >= 0 ? firstIncompleteIndex + 1 : 1

  const enrollmentQuizPassed = enrollment?.quizPassed ?? false
  const enrollmentBestScore = enrollment?.bestQuizScore ?? null

  const hasTags = isCompleted || (isCompleted && quizEnabled && enrollmentQuizPassed)

  return (
    <div className="mt-6 space-y-3">
      {hasTags && (
        <div className="flex gap-2 items-center flex-wrap">
          {isCompleted && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-success text-[#08130C]">
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              {labels.completed}
            </span>
          )}
          {isCompleted && quizEnabled && enrollmentQuizPassed && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-success/15 text-success">
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              {labels.quizPassed}
              {enrollmentBestScore != null && (
                <span className="ml-1">({enrollmentBestScore}%)</span>
              )}
            </span>
          )}
        </div>
      )}
      <div className="flex gap-3 items-center flex-wrap">
        {!isLoggedIn && (
          <Button size="lg" asChild>
            <Link
              href={`${localePrefix}/login?redirect=${encodeURIComponent(`${localePrefix}/courses/${courseSlug}`)}`}
            >
              {labels.loginToEnroll}
            </Link>
          </Button>
        )}
        {isLoggedIn && !isEnrolled && (
          <EnrollButton
            courseId={courseId}
            courseSlug={courseSlug}
            label={labels.enroll}
          />
        )}
        {isEnrolled && !isCompleted && (
          <Button size="lg" asChild>
            <Link href={`${localePrefix}/courses/${courseSlug}/steps/${continueStepIndex}`}>
              {labels.continueLearning}
            </Link>
          </Button>
        )}
        {isCompleted && (
          <Button size="lg" variant="outline" asChild>
            <Link href={`${localePrefix}/courses/${courseSlug}/steps/1`}>{labels.reviewMaterials}</Link>
          </Button>
        )}
        {isCompleted && quizEnabled && !enrollmentQuizPassed && (
          <Button size="lg" asChild>
            <Link href={`${localePrefix}/courses/${courseSlug}/quiz`}>{labels.quizTakeQuiz}</Link>
          </Button>
        )}
        {isCompleted && quizEnabled && enrollmentQuizPassed && (
          <Button size="lg" variant="outline" asChild>
            <Link href={`${localePrefix}/courses/${courseSlug}/quiz`}>{labels.quizRetakeQuiz}</Link>
          </Button>
        )}
        {isCompleted && (
          <a href={`/courses/${courseSlug}/certificate`} download>
            <Button size="lg" variant="outline">
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              {labels.downloadCertificate}
            </Button>
          </a>
        )}
      </div>
    </div>
  )
}
