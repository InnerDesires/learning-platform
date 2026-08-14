'use client'

import React, { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Check, LoaderCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ActionButtonSkeleton } from '@/components/Courses/ActionButtonSkeleton'
import { enrollInEvent, unenrollFromEvent } from '@/app/(frontend)/[locale]/events/actions'
import { useEventUserState } from './EventUserState'

type Props = {
  eventId: number
  eventSlug: string
  isPast: boolean
  isFull: boolean
  localePrefix?: string
  labels: {
    signIn: string
    loginToEnroll: string
    enroll: string
    unenroll: string
    unenrollConfirm: string
    enrolledBadge: string
    full: string
    finished: string
  }
}

export function EventActionBar({
  eventId,
  eventSlug,
  isPast,
  isFull,
  localePrefix = '',
  labels,
}: Props) {
  const { loading, isLoggedIn, enrolled, refresh } = useEventUserState()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  if (loading) return <ActionButtonSkeleton />

  if (isPast) {
    return (
      <span className="inline-flex items-center rounded-full bg-navy-2 px-4 py-2 font-display text-xs font-semibold uppercase tracking-[0.1em] text-fog">
        {labels.finished}
      </span>
    )
  }

  const handleEnroll = () => {
    setError(null)
    startTransition(async () => {
      const result = await enrollInEvent(eventId)
      if (result.success) {
        await refresh()
        router.refresh()
      } else {
        setError(result.error ?? 'Error')
      }
    })
  }

  const handleUnenroll = () => {
    if (!window.confirm(labels.unenrollConfirm)) return
    setError(null)
    startTransition(async () => {
      const result = await unenrollFromEvent(eventId)
      if (result.success) {
        await refresh()
        router.refresh()
      } else {
        setError(result.error ?? 'Error')
      }
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        {!isLoggedIn && (
          <>
            <Button size="lg" asChild>
              <Link
                data-testid="event-signin-link"
                href={`${localePrefix}/login?redirect=${encodeURIComponent(`${localePrefix}/events/${eventSlug}`)}`}
              >
                {labels.signIn}
              </Link>
            </Button>
            <span className="text-[13.5px] font-semibold text-fog">{labels.loginToEnroll}</span>
          </>
        )}

        {isLoggedIn && !enrolled && isFull && (
          <span className="inline-flex items-center rounded-full bg-error/15 px-4 py-2 font-display text-xs font-semibold uppercase tracking-[0.1em] text-error">
            {labels.full}
          </span>
        )}

        {isLoggedIn && !enrolled && !isFull && (
          <Button onClick={handleEnroll} disabled={isPending} size="lg">
            {isPending && <LoaderCircle className="h-4 w-4 animate-spin" />}
            {labels.enroll}
          </Button>
        )}

        {isLoggedIn && enrolled && (
          <>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-success px-3.5 py-1.5 font-display text-xs font-semibold uppercase tracking-[0.1em] text-[#08130C]">
              <Check className="h-3 w-3" strokeWidth={4} />
              {labels.enrolledBadge}
            </span>
            <Button onClick={handleUnenroll} disabled={isPending} size="lg" variant="outline">
              {isPending && <LoaderCircle className="h-4 w-4 animate-spin" />}
              {labels.unenroll}
            </Button>
          </>
        )}
      </div>
      {error && <p className="text-sm text-error">{error}</p>}
    </div>
  )
}
