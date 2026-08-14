import type { CollectionAfterChangeHook } from 'payload'

import type { Course } from '@/payload-types'
import { getStepIds, isCourseComplete } from '@/utilities/courseCompletion'

const completionSignature = (course: Course) =>
  `${course.quiz?.enabled === true}|${getStepIds(course).join(',')}`

// Dropping the quiz or a step lowers the bar for finishing a course, so promote
// enrollments that now qualify. Never demote — certificates already earned survive a
// later edit.
export const syncCourseCompletions: CollectionAfterChangeHook<Course> = async ({
  doc,
  previousDoc,
  req,
}) => {
  if (doc._status !== 'published') return doc
  if (previousDoc && completionSignature(previousDoc) === completionSignature(doc)) return doc

  const { docs } = await req.payload.find({
    collection: 'enrollments',
    where: {
      and: [{ course: { equals: doc.id } }, { status: { not_equals: 'completed' } }],
    },
    depth: 0,
    pagination: false,
    req,
  })

  const completedAt = new Date().toISOString()

  for (const enrollment of docs) {
    const completedSteps: string[] = Array.isArray(enrollment.completedSteps)
      ? (enrollment.completedSteps as string[])
      : []

    if (!isCourseComplete({ course: doc, completedSteps, quizPassed: enrollment.quizPassed })) {
      continue
    }

    await req.payload.update({
      collection: 'enrollments',
      id: enrollment.id,
      data: { status: 'completed', completedAt },
      req,
    })
  }

  return doc
}
