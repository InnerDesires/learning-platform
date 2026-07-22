'use client'

import { useEffect, useState } from 'react'
import { useSession } from '@/lib/auth/client'
import { getMyCourseStatuses, type MyCourseStatuses } from '@/app/(frontend)/[locale]/courses/actions'

const NO_STATUSES: MyCourseStatuses = { completed: [], inProgress: [] }

/**
 * The signed-in user's completed / in-progress course ids, fetched after
 * hydration so pages rendering course cards can stay in the shared ISR cache.
 * Guests never trigger the request.
 */
export function useMyCourseStatuses(): MyCourseStatuses {
  const { data: session } = useSession()
  const [statuses, setStatuses] = useState<MyCourseStatuses>(NO_STATUSES)

  useEffect(() => {
    if (!session?.user) {
      setStatuses(NO_STATUSES)
      return
    }
    let cancelled = false
    getMyCourseStatuses()
      .then((result) => {
        if (!cancelled) setStatuses(result)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [session?.user])

  return statuses
}
