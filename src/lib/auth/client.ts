'use client'

import { createAuthClient } from 'better-auth/react'

const baseURL =
  process.env.NEXT_PUBLIC_BETTER_AUTH_URL ||
  (process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL}`
    : undefined)

export const authClient = createAuthClient({
  baseURL,
})

export const { signIn, signUp, signOut, useSession } = authClient
