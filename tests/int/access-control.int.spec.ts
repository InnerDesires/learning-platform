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
})
