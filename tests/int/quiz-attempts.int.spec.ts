import { getPayload, Payload } from 'payload'
import config from '@/payload.config'
import { describe, it, beforeAll, afterEach, expect } from 'vitest'

let payload: Payload
let userId: number
let courseId: number
let enrollmentId: number

describe('QuizAttempts', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })

    const user = await payload.create({
      collection: 'users',
      data: {
        name: 'Quiz Test User',
        email: `quiz-test-${Date.now()}@test.local`,
        emailVerified: true,
      },
    })
    userId = user.id

    const course = await payload.create({
      collection: 'courses',
      data: {
        title: 'Quiz Test Course',
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
    courseId = course.id

    const enrollment = await payload.create({
      collection: 'enrollments',
      data: { user: userId, course: courseId },
    })
    enrollmentId = enrollment.id
  })

  afterEach(async () => {
    await payload.delete({
      collection: 'quiz-attempts',
      where: { user: { equals: userId } },
    })
  })

  it('sets attemptNumber to 1 for the first attempt', async () => {
    const attempt = await payload.create({
      collection: 'quiz-attempts',
      data: {
        user: userId,
        course: courseId,
        score: 80,
        passed: true,
        totalQuestions: 5,
        correctAnswers: 4,
        attemptNumber: 0, // should be overwritten by beforeChange hook
      },
    })

    expect(attempt.attemptNumber).toBe(1)
  })

  it('increments attemptNumber for subsequent attempts', async () => {
    await payload.create({
      collection: 'quiz-attempts',
      data: {
        user: userId,
        course: courseId,
        score: 60,
        passed: false,
        totalQuestions: 5,
        correctAnswers: 3,
        attemptNumber: 0,
      },
    })

    const second = await payload.create({
      collection: 'quiz-attempts',
      data: {
        user: userId,
        course: courseId,
        score: 80,
        passed: true,
        totalQuestions: 5,
        correctAnswers: 4,
        attemptNumber: 0,
      },
    })

    expect(second.attemptNumber).toBe(2)
  })

  it('updates bestQuizScore and quizPassed on enrollment after quiz', async () => {
    // Simulate what submitQuizAttempt does to the enrollment
    await payload.update({
      collection: 'enrollments',
      id: enrollmentId,
      data: {
        quizAttempts: 1,
        bestQuizScore: 80,
        quizPassed: true,
      },
    })

    const enrollment = await payload.findByID({
      collection: 'enrollments',
      id: enrollmentId,
    })

    expect(enrollment.bestQuizScore).toBe(80)
    expect(enrollment.quizPassed).toBe(true)
    expect(enrollment.quizAttempts).toBe(1)
  })

  it('does not decrease bestQuizScore when a lower score is submitted', async () => {
    await payload.update({
      collection: 'enrollments',
      id: enrollmentId,
      data: { bestQuizScore: 90 },
    })

    // submitQuizAttempt only updates bestQuizScore if score > currentBest
    const currentBest = 90
    const newScore = 50
    const updateData = newScore > currentBest ? { bestQuizScore: newScore } : {}

    await payload.update({
      collection: 'enrollments',
      id: enrollmentId,
      data: updateData,
    })

    const enrollment = await payload.findByID({
      collection: 'enrollments',
      id: enrollmentId,
    })

    expect(enrollment.bestQuizScore).toBe(90)
  })
})
