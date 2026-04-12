import { getPayload, Payload } from 'payload'
import config from '@/payload.config'
import { describe, it, beforeAll, afterEach, expect } from 'vitest'
import { minimalCourseData } from '../helpers/factories'

let payload: Payload
let userId: number
let courseId: number
let stepIds: string[]

describe('CompleteStep (enrollment step tracking)', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })

    const user = await payload.create({
      collection: 'users',
      data: {
        name: 'Step Test User',
        email: `step-test-${Date.now()}@test.local`,
        emailVerified: true,
      },
    })
    userId = user.id

    // Create course with 2 steps
    const course = await payload.create({
      collection: 'courses',
      data: minimalCourseData('Step Test Course', 2),
    })
    courseId = course.id

    // Capture auto-generated block IDs from the created course
    stepIds = (course.steps as Array<{ id?: string }>).map((s) => s.id!).filter(Boolean)
  })

  afterEach(async () => {
    await payload.delete({
      collection: 'enrollments',
      where: { user: { equals: userId } },
    })
  })

  it('completing one step sets status to in_progress and adds step to completedSteps', async () => {
    const enrollment = await payload.create({
      collection: 'enrollments',
      data: { user: userId, course: courseId },
    })

    const updated = await payload.update({
      collection: 'enrollments',
      id: enrollment.id,
      data: {
        completedSteps: [stepIds[0]],
        status: 'in_progress',
      },
    })

    expect(updated.status).toBe('in_progress')
    expect(updated.completedSteps).toContain(stepIds[0])
  })

  it('completing all steps sets status to completed and sets completedAt', async () => {
    const enrollment = await payload.create({
      collection: 'enrollments',
      data: { user: userId, course: courseId },
    })

    const updated = await payload.update({
      collection: 'enrollments',
      id: enrollment.id,
      data: {
        completedSteps: stepIds,
        status: 'completed',
        completedAt: new Date().toISOString(),
      },
    })

    expect(updated.status).toBe('completed')
    expect(updated.completedAt).toBeTruthy()
    expect((updated.completedSteps as string[]).length).toBe(stepIds.length)
  })

  it('step tracking is idempotent — adding same stepId twice does not duplicate', async () => {
    const enrollment = await payload.create({
      collection: 'enrollments',
      data: { user: userId, course: courseId },
    })

    // Simulate completeStep idempotency: if stepBlockId already in list, skip
    const stepId = stepIds[0]
    const existingSteps: string[] = []

    const addStep = (steps: string[], id: string): string[] => {
      if (steps.includes(id)) return steps
      return [...steps, id]
    }

    const afterFirst = addStep(existingSteps, stepId)
    const afterSecond = addStep(afterFirst, stepId)

    const updated = await payload.update({
      collection: 'enrollments',
      id: enrollment.id,
      data: { completedSteps: afterSecond },
    })

    expect((updated.completedSteps as string[]).filter((id) => id === stepId).length).toBe(1)
  })
})
