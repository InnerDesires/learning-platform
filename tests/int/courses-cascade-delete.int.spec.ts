import { getPayload, Payload } from 'payload'
import config from '@/payload.config'
import { describe, it, beforeAll, afterAll, expect } from 'vitest'
import { minimalCourseData } from '../helpers/factories'

let payload: Payload
let userId: number
let courseId: number

describe('Courses — cascade delete', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })

    const user = await payload.create({
      collection: 'users',
      data: {
        name: 'Cascade Delete Test User',
        email: `cascade-delete-${Date.now()}@test.local`,
        emailVerified: true,
      },
    })
    userId = user.id

    const course = await payload.create({
      collection: 'courses',
      data: minimalCourseData('Cascade Delete Test Course'),
    })
    courseId = course.id
  })

  afterAll(async () => {
    // Clean up user; related records were either created and deleted by the
    // test, or never created if the test failed early.
    await payload.delete({ collection: 'users', id: userId })
  })

  it('deleting a course removes all related enrollments, quiz-attempts, comments, and likes', async () => {
    // Seed related records
    const enrollment = await payload.create({
      collection: 'enrollments',
      data: { user: userId, course: courseId },
    })

    const quizAttempt = await payload.create({
      collection: 'quiz-attempts',
      data: {
        user: userId,
        course: courseId,
        score: 80,
        passed: true,
        totalQuestions: 5,
        correctAnswers: 4,
        attemptNumber: 1,
      },
    })

    const comment = await payload.create({
      collection: 'comments',
      data: {
        body: 'Course comment',
        author: userId,
        targetCollection: 'courses',
        targetId: courseId,
      },
    })

    const like = await payload.create({
      collection: 'likes',
      data: {
        user: userId,
        targetCollection: 'courses',
        targetId: courseId,
      },
    })

    // Verify they all exist before deletion
    expect(enrollment.id).toBeDefined()
    expect(quizAttempt.id).toBeDefined()
    expect(comment.id).toBeDefined()
    expect(like.id).toBeDefined()

    // Delete the course — triggers beforeDelete cascade hook
    await payload.delete({ collection: 'courses', id: courseId })

    // All related records should be gone
    const remainingEnrollments = await payload.find({
      collection: 'enrollments',
      where: { course: { equals: courseId } },
    })
    expect(remainingEnrollments.totalDocs).toBe(0)

    const remainingAttempts = await payload.find({
      collection: 'quiz-attempts',
      where: { course: { equals: courseId } },
    })
    expect(remainingAttempts.totalDocs).toBe(0)

    const remainingComments = await payload.find({
      collection: 'comments',
      where: {
        and: [
          { targetCollection: { equals: 'courses' } },
          { targetId: { equals: courseId } },
        ],
      },
    })
    expect(remainingComments.totalDocs).toBe(0)

    const remainingLikes = await payload.find({
      collection: 'likes',
      where: {
        and: [
          { targetCollection: { equals: 'courses' } },
          { targetId: { equals: courseId } },
        ],
      },
    })
    expect(remainingLikes.totalDocs).toBe(0)
  })
})
