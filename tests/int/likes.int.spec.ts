import { getPayload, Payload } from 'payload'
import config from '@/payload.config'
import { describe, it, beforeAll, afterEach, expect } from 'vitest'

let payload: Payload
let userId: number

describe('Likes', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })

    const user = await payload.create({
      collection: 'users',
      data: {
        name: 'Likes Test User',
        email: `likes-test-${Date.now()}@test.local`,
        emailVerified: true,
      },
    })
    userId = user.id
  })

  afterEach(async () => {
    await payload.delete({
      collection: 'likes',
      where: { user: { equals: userId } },
    })
  })

  it('creates a like successfully', async () => {
    const like = await payload.create({
      collection: 'likes',
      data: {
        user: userId,
        targetCollection: 'posts',
        targetId: 1,
      },
    })

    expect(like.id).toBeDefined()
    expect(like.targetCollection).toBe('posts')
    expect(like.targetId).toBe(1)
  })

  it('prevents duplicate likes for the same user+target', async () => {
    await payload.create({
      collection: 'likes',
      data: {
        user: userId,
        targetCollection: 'posts',
        targetId: 99,
      },
    })

    await expect(
      payload.create({
        collection: 'likes',
        data: {
          user: userId,
          targetCollection: 'posts',
          targetId: 99,
        },
      }),
    ).rejects.toThrow()
  })

  it('allows the same user to like different targets', async () => {
    await payload.create({
      collection: 'likes',
      data: { user: userId, targetCollection: 'posts', targetId: 10 },
    })

    const second = await payload.create({
      collection: 'likes',
      data: { user: userId, targetCollection: 'posts', targetId: 11 },
    })

    expect(second.id).toBeDefined()
  })

  it('allows different users to like the same target', async () => {
    const otherUser = await payload.create({
      collection: 'users',
      data: {
        name: 'Other Likes User',
        email: `likes-other-${Date.now()}@test.local`,
        emailVerified: true,
      },
    })

    await payload.create({
      collection: 'likes',
      data: { user: userId, targetCollection: 'courses', targetId: 5 },
    })

    const secondLike = await payload.create({
      collection: 'likes',
      data: { user: otherUser.id, targetCollection: 'courses', targetId: 5 },
    })

    expect(secondLike.id).toBeDefined()

    // Delete likes before user to avoid FK not-null constraint violation
    await payload.delete({ collection: 'likes', where: { user: { equals: otherUser.id } } })
    await payload.delete({ collection: 'users', id: otherUser.id })
  })
})
