'use server'

import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { getSession } from '@/lib/auth/getSession'
import type { Course, Enrollment } from '@/payload-types'

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
