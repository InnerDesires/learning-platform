import { getPayload, Payload } from 'payload'
import config from '@/payload.config'
import { describe, it, beforeAll, afterAll, expect } from 'vitest'
import type { Course, User } from '@/payload-types'
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

  describe('steps validation (courses can never publish with zero steps)', () => {
    async function expectStepsValidationError(promise: Promise<unknown>) {
      let error: unknown
      try {
        await promise
      } catch (e) {
        error = e
      }
      expect(error, 'expected the operation to be rejected').toBeDefined()
      expect((error as Error).name).toBe('ValidationError')
      const paths = ((error as { data?: { errors?: { path: string }[] } }).data?.errors ?? []).map(
        (fieldError) => fieldError.path,
      )
      expect(paths).toContain('steps')
    }

    it('draft save with zero steps is allowed (admin autosave workflow)', async () => {
      const course = await payload.create({
        collection: 'courses',
        data: minimalCourseData('Draft Zero Steps Test', 0),
        draft: true,
      })

      expect(course.id).toBeDefined()

      await payload.delete({ collection: 'courses', id: course.id })
    })

    it('non-draft create with zero steps is rejected', async () => {
      await expectStepsValidationError(
        payload.create({
          collection: 'courses',
          data: minimalCourseData('Create Zero Steps Test', 0),
        }),
      )
    })

    it('publishing a course with zero steps is rejected', async () => {
      await expectStepsValidationError(
        payload.create({
          collection: 'courses',
          data: {
            ...minimalCourseData('Publish Zero Steps Test', 0),
            _status: 'published',
          },
        }),
      )
    })

    it('removing all steps from a published course is rejected', async () => {
      const course = await payload.create({
        collection: 'courses',
        data: {
          ...minimalCourseData('Remove All Steps Test'),
          _status: 'published',
        },
      })

      await expectStepsValidationError(
        payload.update({
          collection: 'courses',
          id: course.id,
          data: { steps: [] },
        }),
      )

      // The published version must be untouched by the rejected update.
      const persisted = await payload.findByID({ collection: 'courses', id: course.id })
      expect(persisted.steps).toHaveLength(1)

      await payload.delete({ collection: 'courses', id: course.id })
    })

    it('deleting steps in a draft of a published course does not touch the published version', async () => {
      const course = await payload.create({
        collection: 'courses',
        data: {
          ...minimalCourseData('Draft Steps Removal Test'),
          _status: 'published',
        },
      })

      // Admin deletes all steps → autosave stores it as a draft version only.
      await payload.update({
        collection: 'courses',
        id: course.id,
        data: { steps: [] },
        draft: true,
      })

      const published = await payload.findByID({ collection: 'courses', id: course.id })
      expect(published.steps).toHaveLength(1)

      await payload.delete({ collection: 'courses', id: course.id })
    })
  })

  describe('quiz validation (enabled quiz can never publish without questions)', () => {
    type QuizQuestions = NonNullable<NonNullable<Course['quiz']>['questions']>

    function quizQuestion(answerCount = 2): QuizQuestions[number] {
      return {
        question: 'What is 2 + 2?',
        answers: Array.from({ length: answerCount }, (_, i) => ({
          text: `Answer ${i + 1}`,
          isCorrect: i === 0,
        })),
      }
    }

    function enabledQuiz(questions: QuizQuestions): Course['quiz'] {
      return {
        enabled: true,
        title: 'Test Quiz',
        passingScore: 70,
        questions,
      }
    }

    async function expectValidationErrorOn(path: string, promise: Promise<unknown>) {
      let error: unknown
      try {
        await promise
      } catch (e) {
        error = e
      }
      expect(error, 'expected the operation to be rejected').toBeDefined()
      expect((error as Error).name).toBe('ValidationError')
      const paths = ((error as { data?: { errors?: { path: string }[] } }).data?.errors ?? []).map(
        (fieldError) => fieldError.path,
      )
      expect(paths).toContain(path)
    }

    it('publishing with an enabled quiz and zero questions is rejected', async () => {
      await expectValidationErrorOn(
        'quiz.questions',
        payload.create({
          collection: 'courses',
          data: {
            ...minimalCourseData('Quiz Zero Questions Test'),
            quiz: enabledQuiz([]),
            _status: 'published',
          },
        }),
      )
    })

    it('draft save with an enabled quiz and zero questions is allowed (admin autosave workflow)', async () => {
      const course = await payload.create({
        collection: 'courses',
        data: {
          ...minimalCourseData('Quiz Draft Zero Questions Test'),
          quiz: enabledQuiz([]),
        },
        draft: true,
      })

      expect(course.id).toBeDefined()

      await payload.delete({ collection: 'courses', id: course.id })
    })

    it('publishing with quiz disabled and no questions is allowed', async () => {
      const course = await payload.create({
        collection: 'courses',
        data: {
          ...minimalCourseData('Quiz Disabled Test'),
          quiz: { enabled: false, questions: [] },
          _status: 'published',
        },
      })

      expect(course._status).toBe('published')

      await payload.delete({ collection: 'courses', id: course.id })
    })

    it('publishing with an enabled quiz with a complete question succeeds', async () => {
      const course = await payload.create({
        collection: 'courses',
        data: {
          ...minimalCourseData('Quiz Valid Test'),
          quiz: enabledQuiz([quizQuestion()]),
          _status: 'published',
        },
      })

      expect(course._status).toBe('published')
      expect(course.quiz?.questions).toHaveLength(1)

      await payload.delete({ collection: 'courses', id: course.id })
    })

    it('publishing a question with zero answers is rejected', async () => {
      await expectValidationErrorOn(
        'quiz.questions.0.answers',
        payload.create({
          collection: 'courses',
          data: {
            ...minimalCourseData('Quiz Zero Answers Test'),
            quiz: enabledQuiz([quizQuestion(0)]),
            _status: 'published',
          },
        }),
      )
    })

    it('publishing a question with a single answer is rejected (minRows: 2)', async () => {
      await expectValidationErrorOn(
        'quiz.questions.0.answers',
        payload.create({
          collection: 'courses',
          data: {
            ...minimalCourseData('Quiz One Answer Test'),
            quiz: enabledQuiz([quizQuestion(1)]),
            _status: 'published',
          },
        }),
      )
    })

    it('enabling the quiz without questions on a published course is rejected', async () => {
      const course = await payload.create({
        collection: 'courses',
        data: {
          ...minimalCourseData('Quiz Enable Without Questions Test'),
          _status: 'published',
        },
      })

      await expectValidationErrorOn(
        'quiz.questions',
        payload.update({
          collection: 'courses',
          id: course.id,
          data: { quiz: { enabled: true } },
        }),
      )

      // The published version must be untouched by the rejected update.
      const persisted = await payload.findByID({ collection: 'courses', id: course.id })
      expect(persisted.quiz?.enabled).not.toBe(true)

      await payload.delete({ collection: 'courses', id: course.id })
    })
  })
})
