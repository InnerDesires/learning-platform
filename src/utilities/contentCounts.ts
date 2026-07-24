import configPromise from '@payload-config'
import { sql } from '@payloadcms/db-postgres'
import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'

/**
 * Site-wide aggregate counters (likes, comments, enrollments) computed with
 * grouped SQL instead of fetching rows and counting in JS. Each aggregate is
 * one GROUP BY over a small table and is shared across requests via
 * unstable_cache, so per-request cost is a cache read, not a table scan.
 *
 * Counts here are display-only and may lag by up to the revalidate window;
 * live per-user state (liked/not liked) is fetched client-side.
 */

type SqlQuery = ReturnType<typeof sql>
type CountsByTarget = Record<number, number>

export type CourseEnrollmentStats = { enrolledCount: number; completedCount: number }

export async function runRows<T>(query: SqlQuery): Promise<T[]> {
  const payload = await getPayload({ config: configPromise })
  const db = payload.db.drizzle as unknown as {
    execute: (q: SqlQuery) => Promise<T[] | { rows?: T[] }>
  }
  const result = await db.execute(query)
  return Array.isArray(result) ? result : (result.rows ?? [])
}

const toCountsMap = (rows: { target_id: string | number; count: string | number }[]): CountsByTarget => {
  const counts: CountsByTarget = {}
  for (const row of rows) {
    counts[Number(row.target_id)] = Number(row.count)
  }
  return counts
}

const likesCountsCache = (targetCollection: 'posts' | 'courses') =>
  unstable_cache(
    async (): Promise<CountsByTarget> =>
      toCountsMap(
        await runRows<{ target_id: string; count: string }>(sql`
          SELECT target_id, COUNT(*) AS count
          FROM likes
          WHERE target_collection::text = ${targetCollection}
          GROUP BY target_id
        `),
      ),
    [`likes-counts-${targetCollection}`],
    { revalidate: 120, tags: [`likes-counts-${targetCollection}`] },
  )

const commentsCountsCache = (targetCollection: 'posts' | 'courses') =>
  unstable_cache(
    async (): Promise<CountsByTarget> =>
      toCountsMap(
        await runRows<{ target_id: string; count: string }>(sql`
          SELECT target_id, COUNT(*) AS count
          FROM comments
          WHERE target_collection::text = ${targetCollection}
          GROUP BY target_id
        `),
      ),
    [`comments-counts-${targetCollection}`],
    { revalidate: 120, tags: [`comments-counts-${targetCollection}`] },
  )

const enrollmentStatsCache = unstable_cache(
  async (): Promise<Record<number, CourseEnrollmentStats>> => {
    const rows = await runRows<{ course_id: string; enrolled: string; completed: string }>(sql`
      SELECT
        course_id,
        COUNT(*) AS enrolled,
        COUNT(*) FILTER (WHERE status::text = 'completed') AS completed
      FROM enrollments
      GROUP BY course_id
    `)
    const stats: Record<number, CourseEnrollmentStats> = {}
    for (const row of rows) {
      stats[Number(row.course_id)] = {
        enrolledCount: Number(row.enrolled),
        completedCount: Number(row.completed),
      }
    }
    return stats
  },
  ['course-enrollment-stats'],
  { revalidate: 60, tags: ['course-enrollment-stats'] },
)

/** Likes per document for a whole collection, cached across requests. */
export const getCachedLikesCounts = (targetCollection: 'posts' | 'courses') =>
  likesCountsCache(targetCollection)()

/** Comments per document for a whole collection, cached across requests. */
export const getCachedCommentsCounts = (targetCollection: 'posts' | 'courses') =>
  commentsCountsCache(targetCollection)()

/** Enrolled/completed totals per course, cached across requests. */
export const getCachedEnrollmentStats = () => enrollmentStatsCache()
