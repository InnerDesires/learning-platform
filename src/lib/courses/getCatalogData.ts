import type { Payload, Where } from 'payload'
import type { SiteLocale } from '@/utilities/locales'
import type { CourseCardData, CourseStats } from '@/components/Courses/CourseCard'
import {
  getCachedCommentsCounts,
  getCachedEnrollmentStats,
  getCachedLikesCounts,
} from '@/utilities/contentCounts'

export type CatalogData = {
  courses: CourseCardData[]
  courseStats: Record<number, CourseStats>
}

// Deliberately session-free — the viewer's own progress is fetched client-side
// (useMyCourseStatuses) — so pages built on this stay in the shared ISR cache.
export async function getCatalogData({
  payload,
  locale,
  where,
}: {
  payload: Payload
  locale: SiteLocale
  where?: Where
}): Promise<CatalogData> {
  const [coursesResult, enrollmentStats, courseLikesCounts, courseCommentsCounts] =
    await Promise.all([
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
      getCachedEnrollmentStats(),
      getCachedLikesCounts('courses'),
      getCachedCommentsCounts('courses'),
    ])

  const courseStats: Record<number, CourseStats> = {}
  const statFor = (cid: number): CourseStats => {
    if (!courseStats[cid]) courseStats[cid] = { enrolledCount: 0, completedCount: 0 }
    return courseStats[cid]
  }

  for (const [cidStr, stats] of Object.entries(enrollmentStats)) {
    const stat = statFor(Number(cidStr))
    stat.enrolledCount = stats.enrolledCount
    stat.completedCount = stats.completedCount
  }

  for (const [cidStr, count] of Object.entries(courseLikesCounts)) {
    statFor(Number(cidStr)).likesCount = count
  }

  for (const [cidStr, count] of Object.entries(courseCommentsCounts)) {
    statFor(Number(cidStr)).commentsCount = count
  }

  return {
    courses: coursesResult.docs,
    courseStats,
  }
}
