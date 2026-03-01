import { cache } from 'react'
import { getPayload } from '@/lib/payload'
import { headers } from 'next/headers'

export const getSession = cache(async () => {
  const payload = await getPayload()
  const session = await payload.betterAuth.api.getSession({
    headers: await headers(),
  })
  return session
})
