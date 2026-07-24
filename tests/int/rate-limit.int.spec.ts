import { getPayload, Payload } from 'payload'
import config from '@/payload.config'
import { describe, it, beforeAll, afterAll, expect } from 'vitest'

import { checkRateLimit } from '@/lib/rate-limit'

let payload: Payload

// Rate limiting is off outside production; opt this process in (the flag is
// read at call time) and restore afterwards so suites sharing the worker
// process aren't throttled.
const prevRateLimitFlag = process.env.RATE_LIMIT
beforeAll(() => {
  process.env.RATE_LIMIT = 'true'
})
afterAll(() => {
  if (prevRateLimitFlag === undefined) delete process.env.RATE_LIMIT
  else process.env.RATE_LIMIT = prevRateLimitFlag
})

const wipeKeys = async (like: string) => {
  await payload.delete({
    collection: 'rateLimit',
    where: { key: { like } },
  })
}

describe('Rate limiting', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })
  })

  describe('checkRateLimit', () => {
    it('allows up to max requests, then blocks with retryAfter', async () => {
      const key = `test:limit-basic:${Date.now()}`
      for (let i = 0; i < 3; i++) {
        expect(await checkRateLimit(payload, { key, windowSeconds: 60, max: 3 })).toEqual({ ok: true })
      }
      const blocked = await checkRateLimit(payload, { key, windowSeconds: 60, max: 3 })
      expect(blocked.ok).toBe(false)
      if (!blocked.ok) {
        expect(blocked.retryAfter).toBeGreaterThanOrEqual(1)
        expect(blocked.retryAfter).toBeLessThanOrEqual(60)
      }
    })

    it('starts a fresh window once the previous one expires', async () => {
      const key = `test:limit-reset:${Date.now()}`
      expect(await checkRateLimit(payload, { key, windowSeconds: 60, max: 1 })).toEqual({ ok: true })
      expect((await checkRateLimit(payload, { key, windowSeconds: 60, max: 1 })).ok).toBe(false)

      // Rewind the stored window start instead of sleeping out the window.
      const { docs } = await payload.find({
        collection: 'rateLimit',
        where: { key: { equals: key } },
        limit: 1,
      })
      await payload.update({
        collection: 'rateLimit',
        id: docs[0]!.id,
        data: { lastRequest: Date.now() - 61_000 },
      })

      expect(await checkRateLimit(payload, { key, windowSeconds: 60, max: 1 })).toEqual({ ok: true })
    })

    it('tracks keys independently', async () => {
      const a = `test:limit-a:${Date.now()}`
      const b = `test:limit-b:${Date.now()}`
      expect(await checkRateLimit(payload, { key: a, windowSeconds: 60, max: 1 })).toEqual({ ok: true })
      expect((await checkRateLimit(payload, { key: a, windowSeconds: 60, max: 1 })).ok).toBe(false)
      expect(await checkRateLimit(payload, { key: b, windowSeconds: 60, max: 1 })).toEqual({ ok: true })
    })
  })

  describe('comment create throttle', () => {
    it('blocks the 11th comment in a minute for a learner, admins exempt', async () => {
      const learner = await payload.create({
        collection: 'users',
        data: {
          name: 'RL Learner',
          email: `rl-learner-${Date.now()}@test.local`,
          emailVerified: true,
        },
      })
      await wipeKeys(`comment-create:${learner.id}`)

      for (let i = 0; i < 10; i++) {
        await payload.create({
          collection: 'comments',
          data: { body: `spam ${i}`, author: learner.id, targetCollection: 'posts', targetId: 1 },
        })
      }
      await expect(
        payload.create({
          collection: 'comments',
          data: { body: 'one too many', author: learner.id, targetCollection: 'posts', targetId: 1 },
        }),
      ).rejects.toMatchObject({ status: 429 })

      // The admin panel goes through the same hook but must never be throttled.
      const admin = await payload.create({
        collection: 'users',
        data: {
          name: 'RL Admin',
          email: `rl-admin-${Date.now()}@test.local`,
          emailVerified: true,
          role: ['admin'],
        },
      })
      const adminComment = await payload.create({
        collection: 'comments',
        data: { body: 'admin is exempt', author: learner.id, targetCollection: 'posts', targetId: 1 },
        user: admin,
      })
      expect(adminComment.id).toBeDefined()

      await payload.delete({ collection: 'comments', where: { author: { equals: learner.id } } })
      await payload.delete({ collection: 'users', id: learner.id })
      await payload.delete({ collection: 'users', id: admin.id })
    })
  })
})
