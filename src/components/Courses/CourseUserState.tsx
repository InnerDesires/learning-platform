'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useSession } from '@/lib/auth/client'
import { getEnrollment } from '@/app/(frontend)/[locale]/courses/actions'
import type { Enrollment } from '@/payload-types'

/**
 * Per-user course state, fetched once per course page after hydration.
 * Keeping this client-side lets the course overview page render from the
 * shared ISR cache; guests never trigger the enrollment request.
 */

type CourseUserState = {
  /** true until the session (and enrollment, when logged in) is resolved */
  loading: boolean
  isLoggedIn: boolean
  enrollment: Enrollment | null
}

const Context = createContext<CourseUserState>({
  loading: true,
  isLoggedIn: false,
  enrollment: null,
})

export function CourseUserStateProvider({
  courseId,
  children,
}: {
  courseId: number
  children: React.ReactNode
}) {
  const { data: session, isPending } = useSession()
  const [state, setState] = useState<{ loading: boolean; enrollment: Enrollment | null }>({
    loading: true,
    enrollment: null,
  })

  useEffect(() => {
    if (isPending) return
    if (!session?.user) {
      setState({ loading: false, enrollment: null })
      return
    }
    let cancelled = false
    getEnrollment(courseId)
      .then((enrollment) => {
        if (!cancelled) setState({ loading: false, enrollment })
      })
      .catch(() => {
        if (!cancelled) setState({ loading: false, enrollment: null })
      })
    return () => {
      cancelled = true
    }
  }, [courseId, isPending, session?.user])

  return (
    <Context.Provider
      value={{
        loading: isPending || state.loading,
        isLoggedIn: !!session?.user,
        enrollment: state.enrollment,
      }}
    >
      {children}
    </Context.Provider>
  )
}

export const useCourseUserState = () => useContext(Context)
