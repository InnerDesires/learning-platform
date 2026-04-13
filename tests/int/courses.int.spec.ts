import { getPayload, Payload } from 'payload'
import config from '@/payload.config'
import { describe, it, beforeAll, afterAll, expect } from 'vitest'
import type { User } from '@/payload-types'
import { minimalCourseData } from '../helpers/factories'
import { populatePublishedAt } from '@/hooks/populatePublishedAt'

let payload: Payload
let regularUser: User

// populatePublishedAt is a pure hook function that reads req.data (HTTP request body).
// It is a no-op in Local API calls because req.data is not populated there — it is
// designed to fire from admin-panel / REST requests. These unit tests call the hook
// directly with a mocked req so the contract is clear.
describe('populatePublishedAt hook (unit)', () => {
  it('sets publishedAt when req.data is present and has no publishedAt', () => {
    const before = new Date()
    const result = populatePublishedAt({
      data: { title: 'Test' },
      operation: 'create',
      req: { data: { title: 'Test' } } as any,
      collection: {} as any,
      context: {},
    })
    const publishedAt = (result as any)?.publishedAt
    expect(publishedAt).toBeDefined()
    expect(new Date(publishedAt).getTime()).toBeGreaterThanOrEqual(before.getTime())
  })

  it('does not override publishedAt when already present in req.data', () => {
    const existing = '2024-06-15T12:00:00.000Z'
    const result = populatePublishedAt({
      data: { title: 'Test', publishedAt: existing },
      operation: 'create',
      req: { data: { title: 'Test', publishedAt: existing } } as any,
      collection: {} as any,
      context: {},
    })
    expect((result as any)?.publishedAt).toBe(existing)
  })

  it('is a no-op when req.data is absent (Local API usage)', () => {
    const result = populatePublishedAt({
      data: { title: 'Test' },
      operation: 'create',
      req: {} as any,
      collection: {} as any,
      context: {},
    })
    expect((result as any)?.publishedAt).toBeUndefined()
  })

  it('is a no-op for operations other than create/update', () => {
    const result = populatePublishedAt({
      data: { title: 'Test' },
      operation: 'delete' as any,
      req: { data: { title: 'Test' } } as any,
      collection: {} as any,
      context: {},
    })
    expect((result as any)?.publishedAt).toBeUndefined()
  })
})

describe('Courses', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })

    regularUser = await payload.create({
      collection: 'users',
      data: {
        name: 'Courses Test User',
        email: `courses-test-${Date.now()}@test.local`,
        emailVerified: true,
        role: ['learner'],
      },
    })
  })

  afterAll(async () => {
    await payload.delete({ collection: 'users', id: regularUser.id })
  })

  describe('authenticatedOrPublished access', () => {
    it('unauthenticated user cannot see a draft course (overrideAccess: false)', async () => {
      const course = await payload.create({
        collection: 'courses',
        data: minimalCourseData('Draft Course Access Test'),
        // no _status → defaults to draft
      })

      // draft: true bypasses the versioning "only published" filter, so the
      // access function's WHERE clause is the only thing restricting results.
      const result = await payload.find({
        collection: 'courses',
        where: { id: { equals: course.id } },
        draft: true,
        overrideAccess: false,
        // no user → authenticatedOrPublished returns { _status: { equals: 'published' } }
      })

      expect(result.totalDocs).toBe(0)

      await payload.delete({ collection: 'courses', id: course.id })
    })

    it('authenticated user can see a draft course (overrideAccess: false)', async () => {
      const course = await payload.create({
        collection: 'courses',
        data: minimalCourseData('Draft Course Auth Test'),
      })

      const result = await payload.find({
        collection: 'courses',
        where: { id: { equals: course.id } },
        draft: true,
        user: regularUser,
        overrideAccess: false,
        // authenticated → authenticatedOrPublished returns true (no WHERE constraint)
      })

      expect(result.totalDocs).toBe(1)

      await payload.delete({ collection: 'courses', id: course.id })
    })

    it('unauthenticated user can see a published course (overrideAccess: false)', async () => {
      const course = await payload.create({
        collection: 'courses',
        data: {
          ...minimalCourseData('Published Course Access Test'),
          _status: 'published',
        },
      })

      const result = await payload.find({
        collection: 'courses',
        where: { id: { equals: course.id } },
        overrideAccess: false,
      })

      expect(result.totalDocs).toBe(1)

      await payload.delete({ collection: 'courses', id: course.id })
    })
  })
})
