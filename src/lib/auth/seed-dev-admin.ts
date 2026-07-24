import type { getPayloadAuth } from 'payload-auth/better-auth'
import type { Course, User } from '@/payload-types'
import type { ConstructedBetterAuthPluginOptions } from './options'
import { markPreVerified } from './pre-verified'
import { DEV_ADMIN } from './dev-credentials'

/**
 * Core of the dev-admin seed, shared by `scripts/seed-dev-admin.ts` (explicit
 * reset via `pnpm seed:dev-admin`) and `GET /api/dev-login` (lazy auto-seed
 * when the account is missing). Dev/test databases only — both callers are
 * disabled in production. See docs/dev-admin-login.md.
 */
export type PayloadAuth = Awaited<
  ReturnType<typeof getPayloadAuth<ConstructedBetterAuthPluginOptions>>
>

export interface SeedDevAdminSummary {
  userId: number
  completedCourse: string
  completedCourseHasQuiz: boolean
  inProgressCourse: string
  comments: number
}

const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

function minimalRichText(text: string) {
  return {
    root: {
      children: [
        {
          children: [
            { detail: 0, format: 0, mode: 'normal', style: '', text, type: 'text', version: 1 },
          ],
          direction: 'ltr' as const,
          format: '' as const,
          indent: 0,
          type: 'paragraph',
          version: 1,
        },
      ],
      direction: 'ltr' as const,
      format: '' as const,
      indent: 0,
      type: 'root',
      version: 1,
    },
  }
}

async function findAdmin(payload: PayloadAuth): Promise<User | undefined> {
  const { docs } = await payload.find({
    collection: 'users',
    where: { email: { equals: DEV_ADMIN.email } },
    limit: 1,
  })
  return docs[0]
}

/** Remove every document the dev admin owns so reruns start from a clean slate. */
async function resetAdminActivity(payload: PayloadAuth, userId: number): Promise<void> {
  await payload.delete({ collection: 'enrollments', where: { user: { equals: userId } } })
  await payload.delete({ collection: 'quiz-attempts', where: { user: { equals: userId } } })
  await payload.delete({ collection: 'comments', where: { author: { equals: userId } } })
  await payload.delete({ collection: 'likes', where: { user: { equals: userId } } })
}

async function ensureAdminUser(payload: PayloadAuth): Promise<User> {
  let user = await findAdmin(payload)

  if (user) {
    const credentialsValid = await payload.betterAuth.api
      .signInEmail({ body: { email: DEV_ADMIN.email, password: DEV_ADMIN.password } })
      .then(() => true)
      .catch(() => false)
    if (!credentialsValid) {
      // An account exists under the dev-admin email but with a different
      // password (pre-dates this script, or someone changed it). Recreate it —
      // the fixed credentials are the whole point of the account.
      await resetAdminActivity(payload, user.id)
      await payload.delete({ collection: 'sessions', where: { user: { equals: user.id } } })
      await payload.delete({ collection: 'accounts', where: { user: { equals: user.id } } })
      await payload.delete({ collection: 'users', id: user.id })
      user = undefined
    }
  }

  if (!user) {
    markPreVerified(DEV_ADMIN.email)
    await payload.betterAuth.api.signUpEmail({
      body: { email: DEV_ADMIN.email, password: DEV_ADMIN.password, name: DEV_ADMIN.name },
    })
    user = await findAdmin(payload)
  }

  if (!user) throw new Error('Failed to create the dev admin user')

  await payload.update({
    collection: 'users',
    id: user.id,
    data: {
      name: DEV_ADMIN.name,
      role: ['admin'],
      emailVerified: true,
      hideProfileComments: false,
      about:
        'Тестовий адміністратор платформи. Обліковий запис створюється автоматично ' +
        'скриптом seed-dev-admin для розробки та тестування — див. docs/dev-admin-login.md.',
      socialLinks: [
        { platform: 'telegram', url: 'https://t.me/zalizna_zmina' },
        { platform: 'youtube', url: 'https://www.youtube.com/@zalizna-zmina' },
        { platform: 'website', url: 'https://platform.2cb.in.ua' },
      ],
    },
  })

  return user
}

async function createDemoCourse(payload: PayloadAuth, index: number): Promise<Course> {
  const uid = Date.now().toString(36)
  const withQuiz = index === 0
  const stepTitles = ['Вступ', 'Основи безпеки', 'Практичні навички']

  return (await payload.create({
    collection: 'courses',
    data: {
      title: withQuiz ? 'Демо-курс: перша допомога' : 'Демо-курс: тактична підготовка',
      slug: `demo-course-${index + 1}-${uid}`,
      description:
        'Демонстраційний курс, створений скриптом seed-dev-admin, бо в базі було замало опублікованих курсів.',
      steps: stepTitles.map((title, i) => ({
        blockType: 'richTextStep' as const,
        title,
        content: minimalRichText(`Навчальний матеріал кроку «${title}».`),
        duration: (i + 1) * 5,
      })),
      quiz: withQuiz
        ? {
            enabled: true,
            title: 'Фінальний тест',
            passingScore: 70,
            questions: [
              {
                question: 'Що потрібно зробити перед наданням допомоги?',
                answers: [
                  { text: 'Оцінити безпеку місця події', isCorrect: true },
                  { text: 'Одразу переміщувати постраждалого', isCorrect: false },
                ],
              },
              {
                question: 'Який номер екстреної служби в Україні?',
                answers: [
                  { text: '112', isCorrect: true },
                  { text: '404', isCorrect: false },
                ],
              },
            ],
          }
        : { enabled: false },
      _status: 'published',
    },
  })) as Course
}

/** Published courses with steps, oldest first; demo courses fill any shortfall. */
async function ensureCourses(payload: PayloadAuth): Promise<Course[]> {
  const { docs } = await payload.find({
    collection: 'courses',
    where: { _status: { equals: 'published' } },
    sort: 'createdAt',
    limit: 20,
    depth: 0,
  })
  const usable = (docs as Course[]).filter((c) => (c.steps?.length ?? 0) > 0)
  while (usable.length < 2) {
    usable.push(await createDemoCourse(payload, usable.length))
  }
  return usable
}

const stepIdsOf = (course: Course): string[] =>
  (course.steps ?? []).map((s) => s.id).filter((id): id is string => Boolean(id))

async function seedCompletedCourse(
  payload: PayloadAuth,
  userId: number,
  course: Course,
): Promise<void> {
  const enrollment = await payload.create({
    collection: 'enrollments',
    data: { user: userId, course: course.id },
  })

  const quizEnabled = course.quiz?.enabled === true
  await payload.update({
    collection: 'enrollments',
    id: enrollment.id,
    data: {
      completedSteps: stepIdsOf(course),
      status: 'completed',
      enrolledAt: daysAgo(14),
      completedAt: daysAgo(7),
      ...(quizEnabled ? { quizPassed: true, bestQuizScore: 100, quizAttempts: 1 } : {}),
    },
  })

  const questions = course.quiz?.questions ?? []
  if (quizEnabled && questions.length > 0) {
    // Mirrors the graded-answers shape submitQuizAttempt writes — all correct.
    await payload.create({
      collection: 'quiz-attempts',
      data: {
        user: userId,
        course: course.id,
        score: 100,
        passed: true,
        totalQuestions: questions.length,
        correctAnswers: questions.length,
        attemptNumber: 1,
        answers: questions.map((q, questionIndex) => ({
          questionIndex,
          selectedAnswerIndices: (q.answers ?? [])
            .map((a, i) => (a.isCorrect ? i : -1))
            .filter((i) => i >= 0),
          correct: true,
        })),
      },
    })
  }
}

async function seedInProgressCourse(
  payload: PayloadAuth,
  userId: number,
  course: Course,
): Promise<void> {
  const stepIds = stepIdsOf(course)
  // At least one step done, but never all of them — the course must stay unfinished.
  const doneCount = Math.min(Math.max(1, Math.floor(stepIds.length / 2)), stepIds.length - 1)

  const enrollment = await payload.create({
    collection: 'enrollments',
    data: { user: userId, course: course.id },
  })
  await payload.update({
    collection: 'enrollments',
    id: enrollment.id,
    data: {
      completedSteps: stepIds.slice(0, Math.max(doneCount, 0)),
      status: 'in_progress',
      enrolledAt: daysAgo(3),
    },
  })
}

async function seedComments(
  payload: PayloadAuth,
  userId: number,
  courses: Course[],
): Promise<number> {
  const courseComments = [
    'Дуже корисний курс, рекомендую всім колегам!',
    'Проходжу зараз — матеріал подано чітко і структуровано.',
  ]
  let created = 0
  for (const [i, course] of courses.slice(0, 2).entries()) {
    await payload.create({
      collection: 'comments',
      data: {
        body: courseComments[i],
        author: userId,
        targetCollection: 'courses',
        targetId: course.id,
      },
    })
    created++
  }

  const posts = await payload.find({
    collection: 'posts',
    where: { _status: { equals: 'published' } },
    limit: 1,
    depth: 0,
  })
  if (posts.docs[0]) {
    await payload.create({
      collection: 'comments',
      data: {
        body: 'Дякую за публікацію — чекаємо на продовження.',
        author: userId,
        targetCollection: 'posts',
        targetId: posts.docs[0].id,
      },
    })
    created++
  }
  return created
}

/**
 * Full seed: ensure the account with fixed credentials, reset its activity,
 * recreate enrollments (one completed, one in progress), quiz attempt, comments.
 */
export async function seedDevAdmin(payload: PayloadAuth): Promise<SeedDevAdminSummary> {
  const admin = await ensureAdminUser(payload)
  const courses = await ensureCourses(payload)

  await resetAdminActivity(payload, admin.id)
  await seedCompletedCourse(payload, admin.id, courses[0])
  await seedInProgressCourse(payload, admin.id, courses[1])
  const comments = await seedComments(payload, admin.id, courses)

  return {
    userId: admin.id,
    completedCourse: courses[0].title,
    completedCourseHasQuiz: courses[0].quiz?.enabled === true,
    inProgressCourse: courses[1].title,
    comments,
  }
}
