import type { AccessArgs } from 'payload'

import type { User } from '@/payload-types'

type IsAdmin = (args: AccessArgs<User>) => boolean

export const admin: IsAdmin = ({ req: { user } }) => {
  if (!user || !('role' in user)) return false
  return Boolean(user.role?.includes('admin'))
}
