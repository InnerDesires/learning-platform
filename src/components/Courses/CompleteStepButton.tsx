'use client'

import React, { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { LoaderCircle } from 'lucide-react'
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
  quizEnabled?: boolean
  completeAndContinueLabel: string
  completeLabel: string
  nextLabel: string
  optimisticStepIds?: string[]
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
  quizEnabled,
  completeAndContinueLabel,
  completeLabel,
  nextLabel,
  optimisticStepIds = [],
}) => {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const lastStepTarget = isLastStep && quizEnabled
    ? `/courses/${courseSlug}/quiz`
    : `/courses/${courseSlug}`

  const getNextStepUrl = (addStepId?: string) => {
    if (isLastStep) return lastStepTarget
    const basePath = `/courses/${courseSlug}/steps/${nextStepIndex}`
    const ids = [...optimisticStepIds]
    if (addStepId && !ids.includes(addStepId)) {
      ids.push(addStepId)
    }
    if (ids.length === 0) return basePath
    return `${basePath}?oc=${ids.join(',')}`
  }

  const navigateNext = () => {
    startTransition(() => {
      router.push(getNextStepUrl())
    })
  }

  const handleComplete = () => {
    if (!isCourseCompleted && !isAlreadyCompleted) {
      if (isLastStep) {
        startTransition(async () => {
          await completeStep(enrollmentId, stepBlockId, courseId)
          router.push(lastStepTarget)
        })
        return
      }
      completeStep(enrollmentId, stepBlockId, courseId)
    }
    const addId = (!isCourseCompleted && !isAlreadyCompleted) ? stepBlockId : undefined
    startTransition(() => {
      router.push(getNextStepUrl(addId))
    })
  }

  if (isCourseCompleted || isAlreadyCompleted) {
    return (
      <Button
        onClick={navigateNext}
        disabled={isPending}
        variant={isLastStep ? 'outline' : 'default'}
        size="lg"
      >
        {isPending && <LoaderCircle className="w-4 h-4 animate-spin" />}
        {isLastStep ? completeLabel : nextLabel}
      </Button>
    )
  }

  return (
    <Button onClick={handleComplete} disabled={isPending} size="lg">
      {isPending && <LoaderCircle className="w-4 h-4 animate-spin" />}
      {isLastStep ? completeLabel : completeAndContinueLabel}
    </Button>
  )
}
