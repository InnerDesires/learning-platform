import React from 'react'
import Link from 'next/link'
import { getSession } from '@/lib/auth/getSession'
import { getEnrollment } from '@/app/(frontend)/[locale]/courses/actions'
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
  }
}

export async function CourseActionBar({ courseId, courseSlug, steps, quizEnabled, labels }: Props) {
  const session = await getSession().catch(() => null)
  const isLoggedIn = !!session?.user
  const enrollment = isLoggedIn ? await getEnrollment(courseId) : null
  const isEnrolled = !!enrollment
  const isCompleted = enrollment?.status === 'completed'

  const completedSteps: string[] = Array.isArray(enrollment?.completedSteps)
    ? (enrollment.completedSteps as string[])
    : []
  const firstIncompleteIndex = steps.findIndex((step) => !completedSteps.includes(step.id ?? ''))
  const continueStepIndex = firstIncompleteIndex >= 0 ? firstIncompleteIndex + 1 : 1

  const enrollmentQuizPassed = enrollment?.quizPassed ?? false
  const enrollmentBestScore = enrollment?.bestQuizScore ?? null

  return (
    <div className="mt-6 flex gap-3 items-center flex-wrap">
      {isCompleted && (
        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-green-500 text-white">
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          {labels.completed}
        </span>
      )}
      {isCompleted && quizEnabled && enrollmentQuizPassed && (
        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-green-500/10 text-green-600">
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          {labels.quizPassed}
          {enrollmentBestScore != null && (
            <span className="ml-1">({enrollmentBestScore}%)</span>
          )}
        </span>
      )}
      {!isLoggedIn && (
        <Link href="/login">
          <Button size="lg">{labels.loginToEnroll}</Button>
        </Link>
      )}
      {isLoggedIn && !isEnrolled && (
        <EnrollButton
          courseId={courseId}
          courseSlug={courseSlug}
          label={labels.enroll}
        />
      )}
      {isEnrolled && !isCompleted && (
        <Link href={`/courses/${courseSlug}/steps/${continueStepIndex}`}>
          <Button size="lg">{labels.continueLearning}</Button>
        </Link>
      )}
      {isCompleted && (
        <Link href={`/courses/${courseSlug}/steps/1`}>
          <Button size="lg" variant="outline">{labels.reviewMaterials}</Button>
        </Link>
      )}
      {isCompleted && quizEnabled && !enrollmentQuizPassed && (
        <Link href={`/courses/${courseSlug}/quiz`}>
          <Button size="lg">{labels.quizTakeQuiz}</Button>
        </Link>
      )}
      {isCompleted && quizEnabled && enrollmentQuizPassed && (
        <Link href={`/courses/${courseSlug}/quiz`}>
          <Button size="lg" variant="outline">{labels.quizRetakeQuiz}</Button>
        </Link>
      )}
    </div>
  )
}
