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

  const navigateNext = () => {
    const target = isLastStep
      ? `/courses/${courseSlug}`
      : `/courses/${courseSlug}/steps/${nextStepIndex}`
    startTransition(() => {
      router.push(target)
    })
  }

  const handleComplete = () => {
    if (!isCourseCompleted && !isAlreadyCompleted) {
      completeStep(enrollmentId, stepBlockId, courseId)
    }
    navigateNext()
  }

  if (isCourseCompleted || isAlreadyCompleted) {
    return (
      <Button
        onClick={navigateNext}
        disabled={isPending}
        variant={isLastStep ? 'outline' : 'default'}
        size="lg"
      >
        {isPending ? '...' : isLastStep ? completeLabel : nextLabel}
      </Button>
    )
  }

  return (
    <Button onClick={handleComplete} disabled={isPending} size="lg">
      {isPending ? '...' : isLastStep ? completeLabel : completeAndContinueLabel}
    </Button>
  )
}
