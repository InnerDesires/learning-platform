import { redirect } from 'next/navigation'

import { getSession } from '@/lib/auth/getSession'

export const getMeUser = async (args?: {
  nullUserRedirect?: string
  validUserRedirect?: string
}) => {
  const { nullUserRedirect, validUserRedirect } = args || {}
  const session = await getSession()

  if (validUserRedirect && session?.user) {
    redirect(validUserRedirect)
  }

  if (nullUserRedirect && !session?.user) {
    redirect(nullUserRedirect)
  }

  return {
    user: session?.user ?? null,
    session: session?.session ?? null,
  }
}
