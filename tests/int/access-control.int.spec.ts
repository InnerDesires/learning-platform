import { getPayload, Payload } from 'payload'
import config from '@/payload.config'
import { describe, it, beforeAll, afterAll, expect } from 'vitest'
import type { User } from '@/payload-types'
import { minimalCourseData } from '../helpers/factories'

let payload: Payload
let regularUser: User
let adminUser: User
let otherUser: User
let courseId: number
let regularUserEnrollmentId: number

describe('Access Control', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })

    const ts = Date.now()

    regularUser = await payload.create({
      collection: 'users',
      data: {
        name: 'Regular User',
        email: `regular-${ts}@test.local`,
        emailVerified: true,
        role: ['learner'],
      },
    })

    adminUser = await payload.create({
      collection: 'users',
      data: {
        name: 'Admin User',
        email: `admin-${ts}@test.local`,
        emailVerified: true,
        role: ['admin'],
      },
    })

    otherUser = await payload.create({
      collection: 'users',
      data: {
        name: 'Other User',
        email: `other-${ts}@test.local`,
        emailVerified: true,
        role: ['learner'],
      },
    })

    const course = await payload.create({
      collection: 'courses',
      data: minimalCourseData('Access Control Test Course'),
    })
    courseId = course.id

    const enrollment = await payload.create({
      collection: 'enrollments',
      data: { user: regularUser.id, course: courseId },
    })
    regularUserEnrollmentId = enrollment.id
  })

  afterAll(async () => {
    await payload.delete({ collection: 'enrollments', where: { course: { equals: courseId } } })
    await payload.delete({ collection: 'courses', id: courseId })
    await payload.delete({ collection: 'users', id: regularUser.id })
    await payload.delete({ collection: 'users', id: adminUser.id })
    await payload.delete({ collection: 'users', id: otherUser.id })
  })

  describe('Enrollments — adminOrOwn access', () => {
    it('regular user can read their own enrollment (overrideAccess: false)', async () => {
      const result = await payload.find({
        collection: 'enrollments',
        where: { id: { equals: regularUserEnrollmentId } },
        user: regularUser,
        overrideAccess: false,
      })

      expect(result.totalDocs).toBe(1)
    })

    it("another regular user cannot read a different user's enrollment (overrideAccess: false)", async () => {
      const result = await payload.find({
        collection: 'enrollments',
        where: { id: { equals: regularUserEnrollmentId } },
        user: otherUser,
        overrideAccess: false,
      })

      expect(result.totalDocs).toBe(0)
    })

    it('admin can read all enrollments (overrideAccess: false)', async () => {
      const result = await payload.find({
        collection: 'enrollments',
        user: adminUser,
        overrideAccess: false,
      })

      expect(result.totalDocs).toBeGreaterThan(0)
    })

    it('unauthenticated request cannot access enrollments (overrideAccess: false)', async () => {
      // No user passed + overrideAccess: false → adminOrOwn returns false → ForbiddenError
      await expect(
        payload.find({
          collection: 'enrollments',
          overrideAccess: false,
        }),
      ).rejects.toThrow()
    })
  })

  // Regression tests for the payload-skill access-control audit. Each asserts an
  // enforced-access (overrideAccess: false) call — the path REST requests take —
  // is blocked, while server actions (overrideAccess: true) keep working.
  describe('Enrollments — progress fields are not owner-writable', () => {
    it('owner cannot mark their own enrollment completed (overrideAccess: false)', async () => {
      await expect(
        payload.update({
          collection: 'enrollments',
          id: regularUserEnrollmentId,
          data: { status: 'completed', quizPassed: true },
          user: regularUser,
          overrideAccess: false,
        }),
      ).rejects.toThrow()

      const check = await payload.findByID({
        collection: 'enrollments',
        id: regularUserEnrollmentId,
      })
      expect(check.status).not.toBe('completed')
      expect(check.quizPassed).not.toBe(true)
    })

    it('server-side progress update still works (overrideAccess: true)', async () => {
      const updated = await payload.update({
        collection: 'enrollments',
        id: regularUserEnrollmentId,
        data: { status: 'in_progress' },
      })
      expect(updated.status).toBe('in_progress')
    })
  })

  describe('QuizAttempts — create is admin-only', () => {
    it('learner cannot forge a passing attempt (overrideAccess: false)', async () => {
      await expect(
        payload.create({
          collection: 'quiz-attempts',
          data: {
            user: regularUser.id,
            course: courseId,
            score: 100,
            passed: true,
            totalQuestions: 1,
            correctAnswers: 1,
            attemptNumber: 1,
          },
          user: regularUser,
          overrideAccess: false,
        }),
      ).rejects.toThrow()
    })
  })

  describe('Users — no privilege escalation', () => {
    it('learner cannot escalate their own role to admin (overrideAccess: false)', async () => {
      // payload-auth's self-update restricts non-admins to allowed fields; the
      // role change is either rejected or stripped — never persisted.
      await payload
        .update({
          collection: 'users',
          id: regularUser.id,
          data: { role: ['admin'] },
          user: regularUser,
          overrideAccess: false,
        })
        .catch(() => undefined)

      const check = await payload.findByID({ collection: 'users', id: regularUser.id })
      expect(check.role).toEqual(['learner'])
    })

    it("learner cannot update another user's profile (overrideAccess: false)", async () => {
      await payload
        .update({
          collection: 'users',
          id: otherUser.id,
          data: { name: 'Hacked Name' },
          user: regularUser,
          overrideAccess: false,
        })
        .catch(() => undefined)

      const check = await payload.findByID({ collection: 'users', id: otherUser.id })
      expect(check.name).not.toBe('Hacked Name')
    })
  })

  describe('Likes — delete is owner-or-admin', () => {
    it("learner cannot delete another user's like (overrideAccess: false)", async () => {
      const like = await payload.create({
        collection: 'likes',
        data: { user: regularUser.id, targetCollection: 'courses', targetId: courseId },
      })

      await expect(
        payload.delete({
          collection: 'likes',
          id: like.id,
          user: otherUser,
          overrideAccess: false,
        }),
      ).rejects.toThrow()

      const still = await payload.findByID({ collection: 'likes', id: like.id })
      expect(still.id).toBe(like.id)

      await payload.delete({ collection: 'likes', id: like.id })
    })
  })

  describe('Globals — only admins can update header/footer', () => {
    it('non-admin cannot update the header global (overrideAccess: false)', async () => {
      await expect(
        payload.updateGlobal({
          slug: 'header',
          data: { navItems: [] },
          user: regularUser,
          overrideAccess: false,
        }),
      ).rejects.toThrow()
    })

    it('admin can update the header global (overrideAccess: false)', async () => {
      const updated = await payload.updateGlobal({
        slug: 'header',
        data: { navItems: [] },
        user: adminUser,
        overrideAccess: false,
        // The afterChange revalidation hook calls revalidateTag, which needs a
        // Next.js request store absent under vitest; this flag is the hook's
        // own escape hatch and does not affect the access check under test.
        context: { disableRevalidate: true },
      })
      expect(updated).toBeDefined()
    })
  })
})
