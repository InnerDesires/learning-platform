'use server'

import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { getSession } from '@/lib/auth/getSession'
import type { Course, Enrollment, QuizAttempt } from '@/payload-types'

export async function enrollInCourse(courseId: number): Promise<{ success: boolean; enrollment?: Enrollment; error?: string }> {
  const session = await getSession()
  if (!session?.user) {
    return { success: false, error: 'Необхідно увійти в акаунт' }
  }

  const payload = await getPayload({ config: configPromise })

  const existing = await payload.find({
    collection: 'enrollments',
    where: {
      and: [
        { user: { equals: session.user.id } },
        { course: { equals: courseId } },
      ],
    },
    limit: 1,
  })

  if (existing.totalDocs > 0) {
    return { success: true, enrollment: existing.docs[0] }
  }

  const enrollment = await payload.create({
    collection: 'enrollments',
    data: {
      user: Number(session.user.id),
      course: courseId,
    },
  })

  return { success: true, enrollment }
}

export async function completeStep(
  enrollmentId: number,
  stepBlockId: string,
  courseId: number,
): Promise<{ success: boolean; enrollment?: Enrollment; error?: string }> {
  const session = await getSession()
  if (!session?.user) {
    return { success: false, error: 'Необхідно увійти в акаунт' }
  }

  const payload = await getPayload({ config: configPromise })

  const enrollment = await payload.findByID({
    collection: 'enrollments',
    id: enrollmentId,
  })

  if (!enrollment) {
    return { success: false, error: 'Запис не знайдено' }
  }

  const enrollmentUserId = typeof enrollment.user === 'object' ? enrollment.user.id : enrollment.user
  if (String(enrollmentUserId) !== String(session.user.id)) {
    return { success: false, error: 'Немає доступу' }
  }

  if (enrollment.status === 'completed') {
    return { success: true, enrollment }
  }

  const completedSteps: string[] = Array.isArray(enrollment.completedSteps)
    ? (enrollment.completedSteps as string[])
    : []

  if (completedSteps.includes(stepBlockId)) {
    return { success: true, enrollment }
  }

  const newCompletedSteps = [...completedSteps, stepBlockId]

  const course = await payload.findByID({
    collection: 'courses',
    id: courseId,
    depth: 0,
  }) as Course

  const totalSteps = course.steps?.length ?? 0
  const allComplete = newCompletedSteps.length >= totalSteps

  const updated = await payload.update({
    collection: 'enrollments',
    id: enrollmentId,
    data: {
      completedSteps: newCompletedSteps,
      status: allComplete ? 'completed' : 'in_progress',
      ...(allComplete ? { completedAt: new Date().toISOString() } : {}),
    },
  })

  return { success: true, enrollment: updated }
}

export async function getEnrollment(
  courseId: number,
): Promise<Enrollment | null> {
  const session = await getSession()
  if (!session?.user) return null

  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'enrollments',
    where: {
      and: [
        { user: { equals: session.user.id } },
        { course: { equals: courseId } },
      ],
    },
    limit: 1,
  })

  return result.docs[0] ?? null
}

export async function getQuizAttempts(
  courseId: number,
): Promise<QuizAttempt[]> {
  const session = await getSession()
  if (!session?.user) return []

  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'quiz-attempts',
    where: {
      and: [
        { user: { equals: session.user.id } },
        { course: { equals: courseId } },
      ],
    },
    sort: '-createdAt',
    limit: 100,
  })

  return result.docs
}

export async function submitQuizAttempt(
  courseId: number,
  answers: Array<{ questionId: string; selectedAnswerIds: string[] }>,
): Promise<{
  success: boolean
  attempt?: {
    score: number
    passed: boolean
    correctAnswers: number
    totalQuestions: number
    attemptNumber: number
  }
  error?: string
}> {
  const session = await getSession()
  if (!session?.user) {
    return { success: false, error: 'Необхідно увійти в акаунт' }
  }

  const payload = await getPayload({ config: configPromise })

  const enrollment = await payload.find({
    collection: 'enrollments',
    where: {
      and: [
        { user: { equals: session.user.id } },
        { course: { equals: courseId } },
      ],
    },
    limit: 1,
  })

  if (enrollment.totalDocs === 0) {
    return { success: false, error: 'Ви не записані на цей курс' }
  }

  const course = await payload.findByID({
    collection: 'courses',
    id: courseId,
    depth: 0,
  }) as Course

  if (!course.quiz?.enabled) {
    return { success: false, error: 'Тест не активовано для цього курсу' }
  }

  const questions = course.quiz.questions ?? []
  const totalQuestions = questions.length
  const passingScore = course.quiz.passingScore ?? 70

  let correctCount = 0
  const gradedAnswers: Array<{
    questionIndex: number
    selectedAnswerIndices: number[]
    correct: boolean
  }> = []

  for (const submittedAnswer of answers) {
    const questionIndex = questions.findIndex(
      (q) => q.id === submittedAnswer.questionId,
    )
    if (questionIndex === -1) continue

    const question = questions[questionIndex]
    const questionAnswers = question?.answers ?? []

    const correctAnswerIds = questionAnswers
      .filter((a) => a.isCorrect)
      .map((a) => a.id)

    const selectedSet = new Set(submittedAnswer.selectedAnswerIds)
    const correctSet = new Set(correctAnswerIds)

    const isCorrect =
      selectedSet.size === correctSet.size &&
      [...selectedSet].every((id) => correctSet.has(id))

    if (isCorrect) correctCount++

    const selectedIndices = submittedAnswer.selectedAnswerIds
      .map((id) => questionAnswers.findIndex((a) => a.id === id))
      .filter((i) => i !== -1)

    gradedAnswers.push({
      questionIndex,
      selectedAnswerIndices: selectedIndices,
      correct: isCorrect,
    })
  }

  const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0
  const passed = score >= passingScore

  const existingAttempts = await payload.find({
    collection: 'quiz-attempts',
    where: {
      and: [
        { user: { equals: session.user.id } },
        { course: { equals: courseId } },
      ],
    },
    limit: 0,
  })
  const attemptNumber = existingAttempts.totalDocs + 1

  await payload.create({
    collection: 'quiz-attempts',
    data: {
      user: Number(session.user.id),
      course: courseId,
      score,
      passed,
      totalQuestions,
      correctAnswers: correctCount,
      answers: gradedAnswers,
      attemptNumber,
    },
  })

  const enrollmentDoc = enrollment.docs[0]
  const currentBest = enrollmentDoc.bestQuizScore ?? 0
  const currentAttempts = enrollmentDoc.quizAttempts ?? 0

  await payload.update({
    collection: 'enrollments',
    id: enrollmentDoc.id,
    data: {
      quizAttempts: currentAttempts + 1,
      ...(score > currentBest ? { bestQuizScore: score } : {}),
      ...(passed ? { quizPassed: true } : {}),
    },
  })

  return {
    success: true,
    attempt: {
      score,
      passed,
      correctAnswers: correctCount,
      totalQuestions,
      attemptNumber,
    },
  }
}
