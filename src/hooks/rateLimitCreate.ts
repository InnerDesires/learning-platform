import { APIError, type CollectionBeforeValidateHook } from 'payload'

import { checkRateLimit } from '@/lib/rate-limit'

// Lives on the collection so both write paths — REST (req.user) and server actions
// (Local API, user id in data) — go through one choke point. Admin operations and system
// writes without a user id (seeds, hooks) pass through.
export const rateLimitCreate = ({
  prefix,
  userField = 'user',
  windowSeconds,
  max,
}: {
  prefix: string
  userField?: string
  windowSeconds: number
  max: number
}): CollectionBeforeValidateHook =>
  async ({ data, operation, req }) => {
    if (operation !== 'create' || !data) return data
    if (req.user && 'role' in req.user && req.user.role?.includes('admin')) return data

    const userId = req.user?.id ?? data[userField]
    if (!userId) return data

    const result = await checkRateLimit(req.payload, {
      key: `${prefix}:${userId}`,
      windowSeconds,
      max,
    })
    if (!result.ok) {
      throw new APIError('Забагато запитів. Спробуйте пізніше.', 429)
    }
    return data
  }
