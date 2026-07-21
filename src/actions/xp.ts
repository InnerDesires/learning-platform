'use server'

import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { getSession } from '@/lib/auth/getSession'
import { STEP_XP, QUIZ_XP, levelForXp } from '@/utilities/xp'

export type MyXp = { xp: number; level: number; intoLevel: number; span: number }

/** Total XP and level for the signed-in user (30 XP/step, 100 XP/passed quiz). */
export async function getMyXp(): Promise<MyXp | null> {
  const session = await getSession().catch(() => null)
  if (!session?.user) return null

  const payload = await getPayload({ config: configPromise })
  const { docs } = await payload.find({
    collection: 'enrollments',
    where: { user: { equals: Number(session.user.id) } },
    limit: 1000,
    depth: 0,
    select: { completedSteps: true, quizPassed: true },
  })

  let steps = 0
  let quizzes = 0
  for (const enrollment of docs) {
    steps += Array.isArray(enrollment.completedSteps) ? enrollment.completedSteps.length : 0
    if (enrollment.quizPassed) quizzes += 1
  }

  const xp = steps * STEP_XP + quizzes * QUIZ_XP
  const { level, intoLevel, span } = levelForXp(xp)
  return { xp, level, intoLevel, span }
}
