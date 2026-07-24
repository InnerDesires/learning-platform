import { getPayload, Payload } from 'payload'
import config from '@/payload.config'
import { describe, it, beforeAll, afterAll, expect } from 'vitest'
import { minimalCourseData } from '../helpers/factories'

let payload: Payload
let courseId: number

describe('Users — cascade delete', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })

    const course = await payload.create({
      collection: 'courses',
      data: minimalCourseData('User Cascade Delete Course'),
    })
    courseId = course.id
  })

  afterAll(async () => {
    await payload.delete({ collection: 'courses', id: courseId })
  })

  it('deleting a user removes their enrollments, quiz-attempts, comments, likes, and xp-events', async () => {
    const user = await payload.create({
      collection: 'users',
      data: {
        name: 'User Cascade Delete Target',
        email: `user-cascade-${Date.now()}@test.local`,
        emailVerified: true,
        role: ['learner'],
      },
    })
    const userId = user.id

    const enrollment = await payload.create({
      collection: 'enrollments',
      data: { user: userId, course: courseId },
    })

    const quizAttempt = await payload.create({
      collection: 'quiz-attempts',
      data: {
        user: userId,
        course: courseId,
        score: 90,
        passed: true,
        totalQuestions: 5,
        correctAnswers: 5,
        attemptNumber: 1,
      },
    })

    const comment = await payload.create({
      collection: 'comments',
      data: {
        body: 'User cascade comment',
        author: userId,
        targetCollection: 'courses',
        targetId: courseId,
      },
    })

    const like = await payload.create({
      collection: 'likes',
      data: { user: userId, targetCollection: 'courses', targetId: courseId },
    })

    // xp_events.user_id (and enrollments.user_id) are NOT NULL with an
    // ON DELETE SET NULL FK — without the beforeDelete cascade, deleting a user
    // with any XP event fails at the DB level. This is the row that reproduces it.
    const xpEvent = await payload.create({
      collection: 'xp-events',
      data: { user: userId, course: courseId, kind: 'quiz', amount: 100 },
    })

    expect(enrollment.id).toBeDefined()
    expect(quizAttempt.id).toBeDefined()
    expect(comment.id).toBeDefined()
    expect(like.id).toBeDefined()
    expect(xpEvent.id).toBeDefined()

    // Must not throw (the xp-events / enrollments FK failure was the bug).
    await payload.delete({ collection: 'users', id: userId })

    const gone = await Promise.all([
      payload.find({ collection: 'enrollments', where: { user: { equals: userId } } }),
      payload.find({ collection: 'quiz-attempts', where: { user: { equals: userId } } }),
      payload.find({
        collection: 'comments',
        where: { author: { equals: userId } },
      }),
      payload.find({ collection: 'likes', where: { user: { equals: userId } } }),
      payload.find({ collection: 'xp-events', where: { user: { equals: userId } } }),
    ])

    for (const result of gone) {
      expect(result.totalDocs).toBe(0)
    }

    const stillThere = await payload.find({
      collection: 'users',
      where: { id: { equals: userId } },
    })
    expect(stillThere.totalDocs).toBe(0)
  })
})
