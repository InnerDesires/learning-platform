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
}) => {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const nextUrl = isLastStep
    ? (quizEnabled ? `/courses/${courseSlug}/quiz` : `/courses/${courseSlug}`)
    : `/courses/${courseSlug}/steps/${nextStepIndex}`

  const handleComplete = () => {
    startTransition(async () => {
      if (!isCourseCompleted && !isAlreadyCompleted) {
        await completeStep(enrollmentId, stepBlockId, courseId)
      }
      router.push(nextUrl)
    })
  }

  if (isCourseCompleted || isAlreadyCompleted) {
    return (
      <Button
        onClick={handleComplete}
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
