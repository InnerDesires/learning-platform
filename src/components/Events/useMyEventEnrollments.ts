'use client'

import { useEffect, useState } from 'react'
import { useSession } from '@/lib/auth/client'
import { getMyEventEnrollments } from '@/app/(frontend)/[locale]/events/actions'

/**
 * Event ids the current user is registered for. Fetched client-side after
 * hydration so listing pages stay in the shared ISR cache.
 */
export function useMyEventEnrollments(): { loading: boolean; enrolledEventIds: number[] } {
  const { data: session, isPending } = useSession()
  const [state, setState] = useState<{ loading: boolean; ids: number[] }>({
    loading: true,
    ids: [],
  })

  useEffect(() => {
    if (isPending) return
    if (!session?.user) {
      setState({ loading: false, ids: [] })
      return
    }
    let cancelled = false
    getMyEventEnrollments()
      .then((ids) => {
        if (!cancelled) setState({ loading: false, ids })
      })
      .catch(() => {
        if (!cancelled) setState({ loading: false, ids: [] })
      })
    return () => {
      cancelled = true
    }
  }, [isPending, session?.user])

  return { loading: isPending || state.loading, enrolledEventIds: state.ids }
}
