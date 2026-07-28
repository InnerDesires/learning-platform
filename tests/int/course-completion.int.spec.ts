import { getPayload, Payload } from 'payload'
import config from '@/payload.config'
import { describe, it, beforeAll, expect } from 'vitest'
import { minimalCourseData } from '../helpers/factories'
import { isCourseComplete } from '@/utilities/courseCompletion'

const quizData = {
  enabled: true,
  passingScore: 70,
  questions: [
    {
      question: 'Q1',
      answers: [
        { text: 'right', isCorrect: true },
        { text: 'wrong', isCorrect: false },
      ],
    },
  ],
}

let payload: Payload
let userId: number

describe('Course completion', () => {
  beforeAll(async () => {
    payload = await getPayload({ config: await config })

    const user = await payload.create({
      collection: 'users',
      data: {
        name: 'Completion Test User',
        email: `completion-test-${Date.now()}@test.local`,
        emailVerified: true,
      },
    })
    userId = user.id
  })

  describe('isCourseComplete', () => {
    const course = {
      steps: [{ id: 'a', blockType: 'richTextStep' }, { id: 'b', blockType: 'richTextStep' }],
    } as never

    it('needs every step regardless of the quiz', () => {
      expect(isCourseComplete({ course, completedSteps: ['a'] })).toBe(false)
    })

    it('completes without a quiz once all steps are done', () => {
      expect(isCourseComplete({ course, completedSteps: ['a', 'b'] })).toBe(true)
    })

    it('withholds completion until an enabled quiz is passed', () => {
      const withQuiz = { ...(course as object), quiz: { enabled: true } } as never
      expect(isCourseComplete({ course: withQuiz, completedSteps: ['a', 'b'] })).toBe(false)
      expect(
        isCourseComplete({ course: withQuiz, completedSteps: ['a', 'b'], quizPassed: true }),
      ).toBe(true)
    })

    it('never completes a course with neither steps nor a quiz', () => {
      expect(isCourseComplete({ course: { steps: [] } as never, completedSteps: [] })).toBe(false)
    })
  })

  describe('syncCourseCompletions hook', () => {
    it('promotes stranded enrollments when the quiz is removed', async () => {
      const course = await payload.create({
        collection: 'courses',
        data: { ...minimalCourseData('Quiz Removal Course', 1), quiz: quizData, _status: 'published' },
      })
      const stepIds = (course.steps as Array<{ id?: string }>).map((s) => s.id!)

      const enrollment = await payload.create({
        collection: 'enrollments',
        data: { user: userId, course: course.id },
      })
      await payload.update({
        collection: 'enrollments',
        id: enrollment.id,
        data: { completedSteps: stepIds, status: 'in_progress' },
      })

      await payload.update({
        collection: 'courses',
        id: course.id,
        data: { quiz: { ...quizData, enabled: false }, _status: 'published' },
      })

      const after = await payload.findByID({ collection: 'enrollments', id: enrollment.id })
      expect(after.status).toBe('completed')
      expect(after.completedAt).toBeTruthy()
    })

    it('does not demote a completed enrollment when a quiz is added', async () => {
      const course = await payload.create({
        collection: 'courses',
        data: { ...minimalCourseData('Quiz Added Course', 1), _status: 'published' },
      })
      const stepIds = (course.steps as Array<{ id?: string }>).map((s) => s.id!)

      const enrollment = await payload.create({
        collection: 'enrollments',
        data: { user: userId, course: course.id },
      })
      await payload.update({
        collection: 'enrollments',
        id: enrollment.id,
        data: {
          completedSteps: stepIds,
          status: 'completed',
          completedAt: new Date().toISOString(),
        },
      })

      await payload.update({
        collection: 'courses',
        id: course.id,
        data: { quiz: quizData, _status: 'published' },
      })

      const after = await payload.findByID({ collection: 'enrollments', id: enrollment.id })
      expect(after.status).toBe('completed')
    })
  })
})
