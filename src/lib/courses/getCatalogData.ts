import type { Payload, Where } from 'payload'
import type { SiteLocale } from '@/utilities/locales'
import type { CourseCardData, CourseStats } from '@/components/Courses/CourseCard'
import { getSession } from '@/lib/auth/getSession'
import { getCommentsCountsBatch, getLikesCountsBatch } from '@/actions/commentsAndLikes'

export type CatalogData = {
  courses: CourseCardData[]
  courseStats: Record<number, CourseStats>
  completedCourseIds: number[]
  inProgressCourseIds: number[]
}

/**
 * Published courses (optionally narrowed by `where`) together with the
 * per-course stats and the viewer's progress, as needed by course card grids.
 */
export async function getCatalogData({
  payload,
  locale,
  where,
}: {
  payload: Payload
  locale: SiteLocale
  where?: Where
}): Promise<CatalogData> {
  const [coursesResult, session] = await Promise.all([
    payload.find({
      collection: 'courses',
      locale,
      depth: 1,
      limit: 100,
      sort: '-createdAt',
      where: {
        and: [{ _status: { equals: 'published' } }, ...(where ? [where] : [])],
      },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        heroImage: true,
        category: true,
        steps: true,
        quiz: true,
      },
    }),
    getSession().catch(() => null),
  ])

  const courseIds = coursesResult.docs.map((c) => c.id)
  const courseStats: Record<number, CourseStats> = {}

  const [allEnrollmentsResult, userCompletedResult, userInProgressResult, courseLikesCounts, courseCommentsCounts] = await Promise.all([
    courseIds.length > 0
      ? payload.find({
          collection: 'enrollments',
          where: { course: { in: courseIds } },
          limit: 10000,
          depth: 0,
          select: { course: true, status: true },
        })
      : Promise.resolve({ docs: [] }),
    session?.user
      ? payload.find({
          collection: 'enrollments',
          where: {
            and: [
              { user: { equals: session.user.id } },
              { status: { equals: 'completed' } },
            ],
          },
          limit: 1000,
          depth: 0,
        })
      : Promise.resolve({ docs: [] }),
    session?.user
      ? payload.find({
          collection: 'enrollments',
          where: {
            and: [
              { user: { equals: session.user.id } },
              { status: { in: ['enrolled', 'in_progress'] } },
            ],
          },
          limit: 1000,
          depth: 0,
        })
      : Promise.resolve({ docs: [] }),
    getLikesCountsBatch('courses', courseIds),
    getCommentsCountsBatch('courses', courseIds),
  ])

  for (const enrollment of allEnrollmentsResult.docs) {
    const cid = typeof enrollment.course === 'object' ? enrollment.course.id : enrollment.course
    if (!courseStats[cid]) courseStats[cid] = { enrolledCount: 0, completedCount: 0 }
    courseStats[cid].enrolledCount++
    if (enrollment.status === 'completed') courseStats[cid].completedCount++
  }

  for (const [cidStr, count] of Object.entries(courseLikesCounts)) {
    const cid = Number(cidStr)
    if (!courseStats[cid]) courseStats[cid] = { enrolledCount: 0, completedCount: 0 }
    courseStats[cid].likesCount = count
  }

  for (const [cidStr, count] of Object.entries(courseCommentsCounts)) {
    const cid = Number(cidStr)
    if (!courseStats[cid]) courseStats[cid] = { enrolledCount: 0, completedCount: 0 }
    courseStats[cid].commentsCount = count
  }

  const completedCourseIds = userCompletedResult.docs.map((e) =>
    typeof e.course === 'object' ? e.course.id : e.course,
  )

  const inProgressCourseIds = userInProgressResult.docs.map((e) =>
    typeof e.course === 'object' ? e.course.id : e.course,
  )

  return {
    courses: coursesResult.docs,
    courseStats,
    completedCourseIds,
    inProgressCourseIds,
  }
}
