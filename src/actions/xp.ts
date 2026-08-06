'use server'

import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { getSession } from '@/lib/auth/getSession'
import { STEP_XP, QUIZ_XP, levelForXp } from '@/utilities/xp'

export type MyXp = {
  xp: number
  level: number
  intoLevel: number
  span: number
  image: string | null
}

export async function getMyXp(): Promise<MyXp | null> {
  const session = await getSession().catch(() => null)
  if (!session?.user) return null

  const payload = await getPayload({ config: configPromise })
  const [{ docs }, userDoc] = await Promise.all([
    payload.find({
      collection: 'enrollments',
      where: { user: { equals: Number(session.user.id) } },
      limit: 1000,
      depth: 0,
      select: { completedSteps: true, quizPassed: true },
    }),
    payload.findByID({
      collection: 'users',
      id: Number(session.user.id),
      depth: 0,
      select: { image: true },
      disableErrors: true,
    }),
  ])

  let steps = 0
  let quizzes = 0
  for (const enrollment of docs) {
    steps += Array.isArray(enrollment.completedSteps) ? enrollment.completedSteps.length : 0
    if (enrollment.quizPassed) quizzes += 1
  }

  const xp = steps * STEP_XP + quizzes * QUIZ_XP
  const { level, intoLevel, span } = levelForXp(xp)
  return { xp, level, intoLevel, span, image: userDoc?.image ?? null }
}
