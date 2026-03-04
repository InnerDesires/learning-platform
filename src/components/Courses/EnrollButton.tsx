'use client'

import React, { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { LoaderCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { enrollInCourse } from '@/app/(frontend)/[locale]/courses/actions'

type Props = {
  courseId: number
  courseSlug: string
  label: string
}

export const EnrollButton: React.FC<Props> = ({ courseId, courseSlug, label }) => {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleEnroll = () => {
    setError(null)
    startTransition(async () => {
      const result = await enrollInCourse(courseId)
      if (result.success) {
        router.push(`/courses/${courseSlug}/steps/1`)
      } else {
        setError(result.error ?? 'Error')
      }
    })
  }

  return (
    <div>
      <Button onClick={handleEnroll} disabled={isPending} size="lg">
        {isPending && <LoaderCircle className="w-4 h-4 animate-spin" />}
        {label}
      </Button>
      {error && <p className="text-destructive text-sm mt-2">{error}</p>}
    </div>
  )
}
