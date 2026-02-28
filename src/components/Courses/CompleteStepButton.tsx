'use client'

import React, { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { completeStep } from '@/app/(frontend)/[locale]/courses/actions'

type Props = {
  enrollmentId: number
  stepBlockId: string
  courseId: number
  courseSlug: string
  isLastStep: boolean
  nextStepIndex: number
  isAlreadyCompleted: boolean
  isCourseCompleted: boolean
  completeAndContinueLabel: string
  completeLabel: string
  nextLabel: string
}

export const CompleteStepButton: React.FC<Props> = ({
  enrollmentId,
  stepBlockId,
  courseId,
  courseSlug,
  isLastStep,
  nextStepIndex,
  isAlreadyCompleted,
  isCourseCompleted,
  completeAndContinueLabel,
  completeLabel,
  nextLabel,
}) => {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleComplete = () => {
    startTransition(async () => {
      if (!isCourseCompleted && !isAlreadyCompleted) {
        await completeStep(enrollmentId, stepBlockId, courseId)
      }

      if (!isLastStep) {
        router.push(`/courses/${courseSlug}/steps/${nextStepIndex}`)
      } else {
        router.push(`/courses/${courseSlug}`)
      }
      router.refresh()
    })
  }

  if (isCourseCompleted || isAlreadyCompleted) {
    if (isLastStep) {
      return (
        <Button onClick={() => router.push(`/courses/${courseSlug}`)} variant="outline" size="lg">
          {completeLabel}
        </Button>
      )
    }
    return (
      <Button
        onClick={() => router.push(`/courses/${courseSlug}/steps/${nextStepIndex}`)}
        size="lg"
      >
        {nextLabel}
      </Button>
    )
  }

  return (
    <Button onClick={handleComplete} disabled={isPending} size="lg">
      {isPending ? '...' : isLastStep ? completeLabel : completeAndContinueLabel}
    </Button>
  )
}
