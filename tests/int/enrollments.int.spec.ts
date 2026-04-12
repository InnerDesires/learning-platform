import { getPayload, Payload } from 'payload'
import config from '@/payload.config'
import { describe, it, beforeAll, afterEach, expect } from 'vitest'

let payload: Payload
let userId: number
let courseId: number

describe('Enrollments', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })

    const user = await payload.create({
      collection: 'users',
      data: {
        name: 'Enrollment Test User',
        email: `enroll-test-${Date.now()}@test.local`,
        emailVerified: true,
      },
    })
    userId = user.id

    const course = await payload.create({
      collection: 'courses',
      data: {
        title: 'Enrollment Test Course',
        steps: [
          {
            blockType: 'richTextStep',
            title: 'Step 1',
            content: {
              root: {
                children: [{ children: [], direction: null, format: '', indent: 0, type: 'paragraph', version: 1 }],
                direction: null,
                format: '',
                indent: 0,
                type: 'root',
                version: 1,
              },
            },
          },
        ],
      },
    })
    courseId = course.id
  })

  afterEach(async () => {
    await payload.delete({
      collection: 'enrollments',
      where: { user: { equals: userId } },
    })
  })

  it('sets default fields on create: status enrolled, empty completedSteps, enrolledAt date', async () => {
    const enrollment = await payload.create({
      collection: 'enrollments',
      data: { user: userId, course: courseId },
    })

    expect(enrollment.status).toBe('enrolled')
    expect(enrollment.completedSteps).toEqual([])
    expect(enrollment.enrolledAt).toBeTruthy()
    expect(new Date(enrollment.enrolledAt!).getFullYear()).toBeGreaterThanOrEqual(2025)
  })

  it('prevents duplicate enrollment for same user+course', async () => {
    await payload.create({
      collection: 'enrollments',
      data: { user: userId, course: courseId },
    })

    await expect(
      payload.create({
        collection: 'enrollments',
        data: { user: userId, course: courseId },
      }),
    ).rejects.toThrow()
  })

  it('allows the same user to enroll in different courses', async () => {
    const course2 = await payload.create({
      collection: 'courses',
      data: {
        title: 'Enrollment Test Course 2',
        steps: [
          {
            blockType: 'richTextStep',
            title: 'Step 1',
            content: {
              root: {
                children: [],
                direction: null,
                format: '',
                indent: 0,
                type: 'root',
                version: 1,
              },
            },
          },
        ],
      },
    })

    await payload.create({ collection: 'enrollments', data: { user: userId, course: courseId } })
    const second = await payload.create({ collection: 'enrollments', data: { user: userId, course: course2.id } })

    expect(second.id).toBeDefined()

    await payload.delete({ collection: 'courses', id: course2.id })
  })
})
