import { getPayload, Payload } from 'payload'
import { beforeAll, describe, expect, it } from 'vitest'

import config from '@/payload.config'
import { minimalCourseData } from '../helpers/factories'

let payload: Payload

const question = (answers: { isCorrect?: boolean; text: string }[]) => ({
  question: 'Скільки буде 2 + 2?',
  answers,
})

/**
 * Payload's top-level ValidationError message only names the offending field
 * ("Наступне поле невірне: …"); the message from the field's own `validate`
 * lives in `data.errors`.
 */
const expectNoCorrectAnswerError = async (operation: Promise<unknown>) => {
  const error = (await operation.then(
    () => undefined,
    (err) => err,
  )) as { data?: { errors?: { message: string; path: string }[] } } | undefined

  expect(error).toBeDefined()
  const messages = error?.data?.errors?.map((fieldError) => fieldError.message) ?? []
  expect(messages.join(' ')).toContain('Позначте щонайменше одну правильну відповідь')
  expect(error?.data?.errors?.[0]?.path).toContain('quiz.questions.0.answers')
}

describe('quiz answer validation', () => {
  beforeAll(async () => {
    payload = await getPayload({ config: await config })
  })

  it('rejects an enabled quiz whose question has no correct answer', async () => {
    await expectNoCorrectAnswerError(
      payload.create({
        collection: 'courses',
        data: {
          ...minimalCourseData('Quiz No Correct Answer'),
          quiz: {
            enabled: true,
            questions: [
              question([
                { isCorrect: false, text: '3' },
                { isCorrect: false, text: '5' },
              ]),
            ],
          },
        },
      }),
    )
  })

  it('accepts a question with one correct answer', async () => {
    const course = await payload.create({
      collection: 'courses',
      data: {
        ...minimalCourseData('Quiz One Correct Answer'),
        quiz: {
          enabled: true,
          questions: [
            question([
              { isCorrect: true, text: '4' },
              { isCorrect: false, text: '5' },
            ]),
          ],
        },
      },
    })

    expect(course.quiz?.questions?.[0]?.answers?.[0]?.isCorrect).toBe(true)

    await payload.delete({ collection: 'courses', id: course.id })
  })

  it('accepts a question with several correct answers', async () => {
    const course = await payload.create({
      collection: 'courses',
      data: {
        ...minimalCourseData('Quiz Multiple Correct Answers'),
        quiz: {
          enabled: true,
          questions: [
            question([
              { isCorrect: true, text: '4' },
              { isCorrect: true, text: 'чотири' },
              { isCorrect: false, text: '5' },
            ]),
          ],
        },
      },
    })

    expect(course.quiz?.questions?.[0]?.answers?.filter((a) => a.isCorrect)).toHaveLength(2)

    await payload.delete({ collection: 'courses', id: course.id })
  })

  it('rejects an update that unchecks the last correct answer', async () => {
    const course = await payload.create({
      collection: 'courses',
      data: {
        ...minimalCourseData('Quiz Uncheck Correct Answer'),
        quiz: {
          enabled: true,
          questions: [
            question([
              { isCorrect: true, text: '4' },
              { isCorrect: false, text: '5' },
            ]),
          ],
        },
      },
    })

    await expectNoCorrectAnswerError(
      payload.update({
        collection: 'courses',
        id: course.id,
        data: {
          quiz: {
            enabled: true,
            questions: [
              question([
                { isCorrect: false, text: '4' },
                { isCorrect: false, text: '5' },
              ]),
            ],
          },
        },
      }),
    )

    await payload.delete({ collection: 'courses', id: course.id })
  })

  // Turning the quiz off hides the questions in the admin UI but keeps the rows in the
  // document — they must not block saving a course that no longer has a test.
  it('ignores questions without a correct answer while the quiz is disabled', async () => {
    const course = await payload.create({
      collection: 'courses',
      data: {
        ...minimalCourseData('Quiz Disabled Stale Questions'),
        quiz: {
          enabled: false,
          questions: [
            question([
              { isCorrect: false, text: '3' },
              { isCorrect: false, text: '5' },
            ]),
          ],
        },
      },
    })

    expect(course.quiz?.enabled).toBe(false)

    await payload.delete({ collection: 'courses', id: course.id })
  })
})
