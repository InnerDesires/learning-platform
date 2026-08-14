import type { Course } from '@/payload-types'

type CourseShape = Pick<Course, 'steps' | 'quiz'>

export const getStepIds = (course: Pick<Course, 'steps'>): string[] =>
  (course.steps ?? []).map((step) => step.id).filter((id): id is string => Boolean(id))

// Finished means every current step is done and, when a quiz is enabled, it has been
// passed. Compare step ids rather than counts so stale ids of deleted steps can't complete
// a course early.
export function isCourseComplete({
  course,
  completedSteps,
  quizPassed,
}: {
  course: CourseShape
  completedSteps: string[]
  quizPassed?: boolean | null
}): boolean {
  const stepIds = getStepIds(course)
  const quizEnabled = course.quiz?.enabled === true

  if (stepIds.length === 0 && !quizEnabled) return false
  if (!stepIds.every((id) => completedSteps.includes(id))) return false

  return !quizEnabled || quizPassed === true
}
