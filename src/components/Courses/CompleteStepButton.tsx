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
  completeLabel: string
  startQuizLabel: string
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
  completeLabel,
  startQuizLabel,
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
        // Purge the client router cache so the next page shows fresh progress
        // instead of a stale prefetched payload.
        router.refresh()
      }
      router.push(nextUrl)
    })
  }

  const label = isLastStep ? (quizEnabled ? startQuizLabel : completeLabel) : nextLabel
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
