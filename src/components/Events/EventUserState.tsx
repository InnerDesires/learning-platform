'use client'

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useSession } from '@/lib/auth/client'
import { getEventJoinInfo } from '@/app/(frontend)/[locale]/events/actions'

type EventUserState = {
  loading: boolean
  isLoggedIn: boolean
  enrolled: boolean
  meetingLink: string | null
  refresh: () => Promise<void>
}

const Context = createContext<EventUserState>({
  loading: true,
  isLoggedIn: false,
  enrolled: false,
  meetingLink: null,
  refresh: async () => {},
})

export function EventUserStateProvider({
  eventId,
  children,
}: {
  eventId: number
  children: React.ReactNode
}) {
  const { data: session, isPending } = useSession()
  const [state, setState] = useState<{
    loading: boolean
    enrolled: boolean
    meetingLink: string | null
  }>({ loading: true, enrolled: false, meetingLink: null })

  const fetchState = useCallback(async () => {
    try {
      const info = await getEventJoinInfo(eventId)
      setState({ loading: false, enrolled: info.enrolled, meetingLink: info.meetingLink })
    } catch {
      setState({ loading: false, enrolled: false, meetingLink: null })
    }
  }, [eventId])

  useEffect(() => {
    if (isPending) return
    if (!session?.user) {
      setState({ loading: false, enrolled: false, meetingLink: null })
      return
    }
    let cancelled = false
    getEventJoinInfo(eventId)
      .then((info) => {
        if (!cancelled) {
          setState({ loading: false, enrolled: info.enrolled, meetingLink: info.meetingLink })
        }
      })
      .catch(() => {
        if (!cancelled) setState({ loading: false, enrolled: false, meetingLink: null })
      })
    return () => {
      cancelled = true
    }
  }, [eventId, isPending, session?.user])

  return (
    <Context.Provider
      value={{
        loading: isPending || state.loading,
        isLoggedIn: !!session?.user,
        enrolled: state.enrolled,
        meetingLink: state.meetingLink,
        refresh: fetchState,
      }}
    >
      {children}
    </Context.Provider>
  )
}

export const useEventUserState = () => useContext(Context)
