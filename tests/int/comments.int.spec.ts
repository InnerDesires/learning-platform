import { getPayload, Payload } from 'payload'
import config from '@/payload.config'
import { describe, it, beforeAll, afterAll, expect } from 'vitest'
import type { User } from '@/payload-types'

let payload: Payload
let regularUser: User
let adminUser: User
let otherUser: User
// Dummy target ID — comments reference a post/course by numeric ID; we don't
// need the target to exist to test comment access control.
const targetId = 999999

describe('Comments', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })

    const ts = Date.now()

    regularUser = await payload.create({
      collection: 'users',
      data: {
        name: 'Comment Regular User',
        email: `comment-regular-${ts}@test.local`,
        emailVerified: true,
        role: ['learner'],
      },
    })

    adminUser = await payload.create({
      collection: 'users',
      data: {
        name: 'Comment Admin User',
        email: `comment-admin-${ts}@test.local`,
        emailVerified: true,
        role: ['admin'],
      },
    })

    otherUser = await payload.create({
      collection: 'users',
      data: {
        name: 'Comment Other User',
        email: `comment-other-${ts}@test.local`,
        emailVerified: true,
        role: ['learner'],
      },
    })
  })

  afterAll(async () => {
    await payload.delete({ collection: 'comments', where: { targetId: { equals: targetId } } })
    await payload.delete({ collection: 'users', id: regularUser.id })
    await payload.delete({ collection: 'users', id: adminUser.id })
    await payload.delete({ collection: 'users', id: otherUser.id })
  })

  describe('read — anyone', () => {
    it('unauthenticated user can read comments (overrideAccess: false)', async () => {
      const comment = await payload.create({
        collection: 'comments',
        data: {
          body: 'Readable comment',
          author: regularUser.id,
          targetCollection: 'posts',
          targetId,
        },
      })

      const result = await payload.find({
        collection: 'comments',
        where: { id: { equals: comment.id } },
        overrideAccess: false,
      })

      expect(result.totalDocs).toBe(1)
    })
  })

  describe('create — authenticated only', () => {
    it('authenticated user can create a comment (overrideAccess: false)', async () => {
      const comment = await payload.create({
        collection: 'comments',
        data: {
          body: 'Hello from a regular user',
          author: regularUser.id,
          targetCollection: 'posts',
          targetId,
        },
        user: regularUser,
        overrideAccess: false,
      })

      expect(comment.id).toBeDefined()
    })

    it('unauthenticated request cannot create a comment (overrideAccess: false)', async () => {
      await expect(
        payload.create({
          collection: 'comments',
          data: {
            body: 'Should be blocked',
            author: regularUser.id,
            targetCollection: 'posts',
            targetId,
          },
          overrideAccess: false,
        }),
      ).rejects.toThrow()
    })
  })

  describe('update — admin only', () => {
    it('admin can update a comment (overrideAccess: false)', async () => {
      const comment = await payload.create({
        collection: 'comments',
        data: {
          body: 'Original body',
          author: regularUser.id,
          targetCollection: 'posts',
          targetId,
        },
      })

      const updated = await payload.update({
        collection: 'comments',
        id: comment.id,
        data: { body: 'Updated by admin' },
        user: adminUser,
        overrideAccess: false,
      })

      expect(updated.body).toBe('Updated by admin')
    })

    it('regular user cannot update a comment (overrideAccess: false)', async () => {
      const comment = await payload.create({
        collection: 'comments',
        data: {
          body: 'Cannot touch this',
          author: regularUser.id,
          targetCollection: 'posts',
          targetId,
        },
      })

      await expect(
        payload.update({
          collection: 'comments',
          id: comment.id,
          data: { body: 'Attempted update' },
          user: regularUser,
          overrideAccess: false,
        }),
      ).rejects.toThrow()
    })
  })

  describe('delete — adminOrAuthor', () => {
    it('author can delete their own comment (overrideAccess: false)', async () => {
      const comment = await payload.create({
        collection: 'comments',
        data: {
          body: 'Delete me',
          author: regularUser.id,
          targetCollection: 'posts',
          targetId,
        },
      })

      await expect(
        payload.delete({
          collection: 'comments',
          id: comment.id,
          user: regularUser,
          overrideAccess: false,
        }),
      ).resolves.toBeDefined()
    })

    it("non-author cannot delete another user's comment (overrideAccess: false)", async () => {
      const comment = await payload.create({
        collection: 'comments',
        data: {
          body: 'Not yours to delete',
          author: regularUser.id,
          targetCollection: 'posts',
          targetId,
        },
      })

      await expect(
        payload.delete({
          collection: 'comments',
          id: comment.id,
          user: otherUser,
          overrideAccess: false,
        }),
      ).rejects.toThrow()
    })

    it('admin can delete any comment (overrideAccess: false)', async () => {
      const comment = await payload.create({
        collection: 'comments',
        data: {
          body: 'Admin can remove this',
          author: regularUser.id,
          targetCollection: 'posts',
          targetId,
        },
      })

      await expect(
        payload.delete({
          collection: 'comments',
          id: comment.id,
          user: adminUser,
          overrideAccess: false,
        }),
      ).resolves.toBeDefined()
    })
  })
})
