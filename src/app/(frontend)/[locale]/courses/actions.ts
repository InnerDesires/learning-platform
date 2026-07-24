'use server'

import { APIError, getPayload } from 'payload'
import configPromise from '@payload-config'
import { revalidatePath, revalidateTag } from 'next/cache'
import { getSession } from '@/lib/auth/getSession'
import { checkRateLimit } from '@/lib/rate-limit'
import { STEP_XP, QUIZ_XP } from '@/utilities/xp'
import type { Course, Enrollment, QuizAttempt } from '@/payload-types'
import type { Payload } from 'payload'

/**
 * Timestamped XP log for period leaderboards; total XP stays derived from
 * enrollments, so a failed log write must not fail the mutation that earned it.
 */
async function logXpEvent(
  payload: Payload,
  data: { user: number; course: number; kind: 'step' | 'quiz'; amount: number },
) {
  try {
    await payload.create({ collection: 'xp-events', data })
    revalidateTag('xp-leaderboard')
  } catch (err) {
    payload.logger.error({ err }, 'xp-events: failed to log XP award')
  }
}

/** Bust cached course pages (both locales) after an enrollment mutation. */
function revalidateCoursePages(slug: string) {
  for (const prefix of ['', '/en']) {
    revalidatePath(`${prefix}/courses/${slug}`)
    revalidatePath(`${prefix}/courses/${slug}/steps/[stepIndex]`, 'page')
    revalidatePath(`${prefix}/courses/${slug}/quiz`)
  }
  // Cached aggregate counters (src/utilities/contentCounts.ts)
  revalidateTag('course-enrollment-stats')
}

export type MyCourseStatuses = {
  completed: number[]
  inProgress: number[]
}

/**
 * Course ids the signed-in user has completed / started. Fetched client-side
 * so the catalog page itself can stay statically cached for everyone.
 */
export async function getMyCourseStatuses(): Promise<MyCourseStatuses> {
  const session = await getSession().catch(() => null)
  if (!session?.user) return { completed: [], inProgress: [] }

  const payload = await getPayload({ config: configPromise })
  const { docs } = await payload.find({
    collection: 'enrollments',
    where: { user: { equals: Number(session.user.id) } },
    limit: 1000,
    depth: 0,
    select: { course: true, status: true },
  })

  const completed: number[] = []
  const inProgress: number[] = []
  for (const enrollment of docs) {
    const courseId =
      typeof enrollment.course === 'object' ? enrollment.course.id : enrollment.course
    if (enrollment.status === 'completed') completed.push(courseId)
    else inProgress.push(courseId)
  }
  return { completed, inProgress }
}

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

  let enrollment: Enrollment
  try {
    enrollment = await payload.create({
      collection: 'enrollments',
      data: {
        user: Number(session.user.id),
        course: courseId,
      },
    })
  } catch (err) {
    if (err instanceof APIError && err.status === 429) {
      return { success: false, error: 'Забагато запитів. Спробуйте пізніше.' }
    }
    throw err
  }

  const course = (await payload.findByID({
    collection: 'courses',
    id: courseId,
    depth: 0,
  })) as Course
  revalidateCoursePages(course.slug)

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

  // The enrollment is the source of truth for which course is being completed —
  // trusting the client's courseId would let a user complete a short course's
  // steps against a different course's enrollment.
  const enrollmentCourseId =
    typeof enrollment.course === 'object' ? enrollment.course.id : enrollment.course
  if (Number(enrollmentCourseId) !== Number(courseId)) {
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

  const course = await payload.findByID({
    collection: 'courses',
    id: enrollmentCourseId,
    depth: 0,
  }) as Course

  // Compare against actual step ids (not counts) so stale ids of deleted
  // steps can never mark a course completed early.
  const stepIds = (course.steps ?? []).map((s) => s.id).filter((id): id is string => Boolean(id))
  if (!stepIds.includes(stepBlockId)) {
    return { success: false, error: 'Крок не знайдено' }
  }

  const newCompletedSteps = [...completedSteps, stepBlockId]
  const allComplete = stepIds.every((id) => newCompletedSteps.includes(id))

  const updated = await payload.update({
    collection: 'enrollments',
    id: enrollmentId,
    data: {
      completedSteps: newCompletedSteps,
      status: allComplete ? 'completed' : 'in_progress',
      ...(allComplete ? { completedAt: new Date().toISOString() } : {}),
    },
  })

  await logXpEvent(payload, {
    user: Number(session.user.id),
    course: Number(enrollmentCourseId),
    kind: 'step',
    amount: STEP_XP,
  })

  revalidateCoursePages(course.slug)

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
    // Consumed client-side (CourseUserState) — ids are enough, don't populate
    // the full user/course docs into the response.
    depth: 0,
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

  // Attempts are unbounded rows + server-side grading; quiz-attempts REST
  // create is admin-only, so this action is the sole user path to throttle.
  // 30/hour never touches a human retaking a quiz, only scripted floods.
  const quizLimit = await checkRateLimit(payload, {
    key: `quiz-submit:${session.user.id}`,
    windowSeconds: 3600,
    max: 30,
  })
  if (!quizLimit.ok) {
    return { success: false, error: 'Забагато спроб. Спробуйте пізніше.' }
  }

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

  const attemptDoc = await payload.create({
    collection: 'quiz-attempts',
    data: {
      user: Number(session.user.id),
      course: courseId,
      score,
      passed,
      totalQuestions,
      correctAnswers: correctCount,
      answers: gradedAnswers,
      // Overwritten by the collection's beforeValidate hook, which counts
      // prior attempts; the value here only satisfies the required field type.
      attemptNumber: 0,
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

  // Quiz XP is awarded once — on the first passing attempt.
  if (passed && !enrollmentDoc.quizPassed) {
    await logXpEvent(payload, {
      user: Number(session.user.id),
      course: courseId,
      kind: 'quiz',
      amount: QUIZ_XP,
    })
  }

  revalidateCoursePages(course.slug)

  return {
    success: true,
    attempt: {
      score,
      passed,
      correctAnswers: correctCount,
      totalQuestions,
      attemptNumber: attemptDoc.attemptNumber,
    },
  }
}
