'use client'

import React, { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { LoaderCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { completeStep } from '@/app/(frontend)/[locale]/courses/actions'
import { clearMyXpCache } from '@/utilities/myXpCache'

type Props = {
  enrollmentId: number
  stepBlockId: string
  courseId: number
  courseSlug: string
  /** Ordered block ids of all course steps — used to find the first incomplete step. */
  stepIds: string[]
  completedSteps: string[]
  isLastStep: boolean
  nextStepIndex: number
  isAlreadyCompleted: boolean
  isCourseCompleted: boolean
  quizEnabled?: boolean
  /** True when completing this step leaves no other step incomplete, i.e. the quiz opens next. */
  quizReady?: boolean
  localePrefix?: string
  completeLabel: string
  startQuizLabel: string
  nextLabel: string
}

export const CompleteStepButton: React.FC<Props> = ({
  enrollmentId,
  stepBlockId,
  courseId,
  courseSlug,
  stepIds,
  completedSteps,
  isLastStep,
  nextStepIndex,
  isAlreadyCompleted,
  isCourseCompleted,
  quizEnabled,
  quizReady,
  localePrefix = '',
  completeLabel,
  startQuizLabel,
  nextLabel,
}) => {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const courseBase = `${localePrefix}/courses/${courseSlug}`

  const handleComplete = () => {
    startTransition(async () => {
      let latestCompleted = completedSteps
      if (!isCourseCompleted && !isAlreadyCompleted) {
        const result = await completeStep(enrollmentId, stepBlockId, courseId)
        if (result.success && Array.isArray(result.enrollment?.completedSteps)) {
          latestCompleted = result.enrollment.completedSteps as string[]
        } else {
          latestCompleted = [...completedSteps, stepBlockId]
        }
        clearMyXpCache()
        // Purge the client router cache so the next page shows fresh progress
        // instead of a stale prefetched payload.
        router.refresh()
      }

      if (!isLastStep) {
        router.push(`${courseBase}/steps/${nextStepIndex}`)
        return
      }

      if (!quizEnabled) {
        router.push(courseBase)
        return
      }

      // The quiz only opens once every step is done — otherwise continue with
      // the first step that still needs finishing.
      const firstIncomplete = isCourseCompleted
        ? -1
        : stepIds.findIndex((id) => !latestCompleted.includes(id))
      router.push(
        firstIncomplete === -1 ? `${courseBase}/quiz` : `${courseBase}/steps/${firstIncomplete + 1}`,
      )
    })
  }

  // Promise the quiz only when this press actually opens it.
  const label = !isLastStep
    ? nextLabel
    : quizEnabled
      ? quizReady
        ? startQuizLabel
        : isAlreadyCompleted
          ? nextLabel
          : completeLabel
      : completeLabel
  const isDone = isCourseCompleted || isAlreadyCompleted

  return (
    <Button
      onClick={handleComplete}
      disabled={isPending}
      variant={isDone && isLastStep && !quizEnabled ? 'outline' : 'default'}
      size="lg"
    >
      {isPending && <LoaderCircle className="w-4 h-4 animate-spin" />}
      {label}
    </Button>
  )
}
