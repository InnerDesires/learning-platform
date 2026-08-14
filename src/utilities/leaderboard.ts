import { sql } from '@payloadcms/db-postgres'
import { unstable_cache } from 'next/cache'

import { runRows } from '@/utilities/contentCounts'
import { STEP_XP, QUIZ_XP } from '@/utilities/xp'

// All-time XP is derived from enrollments (the source of truth for XP); period XP comes
// from the xp_events log, which only spans since the log was introduced.

export type LeaderboardEntry = {
  userId: number
  name: string
  image: string | null
  xp: number
}

export type LeaderboardPeriod = 'day' | 'week' | 'month'

const PERIOD_DAYS: Record<LeaderboardPeriod, number> = { day: 1, week: 7, month: 30 }

const TOP_N = 50

type LeaderboardRow = { user_id: string | number; name: string | null; image: string | null; xp: string | number }

const toEntries = (rows: LeaderboardRow[]): LeaderboardEntry[] =>
  rows.map((row) => ({
    userId: Number(row.user_id),
    name: row.name ?? '',
    image: row.image,
    xp: Number(row.xp),
  }))

const allTimeLeaderboardCache = unstable_cache(
  async (): Promise<LeaderboardEntry[]> =>
    toEntries(
      await runRows<LeaderboardRow>(sql`
        SELECT
          e.user_id,
          u.name,
          u.image,
          SUM(
            CASE WHEN jsonb_typeof(e.completed_steps) = 'array'
              THEN jsonb_array_length(e.completed_steps) ELSE 0 END * ${STEP_XP}
            + CASE WHEN e.quiz_passed THEN ${QUIZ_XP} ELSE 0 END
          ) AS xp
        FROM enrollments e
        JOIN users u ON u.id = e.user_id
        GROUP BY e.user_id, u.name, u.image
        HAVING SUM(
          CASE WHEN jsonb_typeof(e.completed_steps) = 'array'
            THEN jsonb_array_length(e.completed_steps) ELSE 0 END * ${STEP_XP}
          + CASE WHEN e.quiz_passed THEN ${QUIZ_XP} ELSE 0 END
        ) > 0
        ORDER BY xp DESC, e.user_id ASC
        LIMIT ${TOP_N}
      `),
    ),
  ['xp-leaderboard-all'],
  { revalidate: 300, tags: ['xp-leaderboard'] },
)

const periodLeaderboardCache = (period: LeaderboardPeriod) =>
  unstable_cache(
    async (): Promise<LeaderboardEntry[]> =>
      toEntries(
        await runRows<LeaderboardRow>(sql`
          SELECT x.user_id, u.name, u.image, SUM(x.amount) AS xp
          FROM xp_events x
          JOIN users u ON u.id = x.user_id
          WHERE x.created_at >= NOW() - make_interval(days => ${PERIOD_DAYS[period]})
          GROUP BY x.user_id, u.name, u.image
          ORDER BY xp DESC, x.user_id ASC
          LIMIT ${TOP_N}
        `),
      ),
    [`xp-leaderboard-${period}`],
    { revalidate: 300, tags: ['xp-leaderboard'] },
  )

export const getCachedAllTimeLeaderboard = () => allTimeLeaderboardCache()

export const getCachedPeriodLeaderboard = (period: LeaderboardPeriod) =>
  periodLeaderboardCache(period)()

export type CourseCompletion = {
  userId: number
  name: string
  image: string | null
  completedAt: string | null
}

const courseCompletionsCache = (courseId: number) =>
  unstable_cache(
    async (): Promise<CourseCompletion[]> => {
      const rows = await runRows<{
        user_id: string | number
        name: string | null
        image: string | null
        completed_at: string | null
      }>(sql`
        SELECT e.user_id, u.name, u.image, e.completed_at
        FROM enrollments e
        JOIN users u ON u.id = e.user_id
        WHERE e.course_id = ${courseId} AND e.status::text = 'completed'
        ORDER BY e.completed_at DESC NULLS LAST
        LIMIT 24
      `)
      return rows.map((row) => ({
        userId: Number(row.user_id),
        name: row.name ?? '',
        image: row.image,
        completedAt: row.completed_at,
      }))
    },
    [`course-completions-${courseId}`],
    { revalidate: 60, tags: ['course-enrollment-stats'] },
  )

export const getCachedCourseCompletions = (courseId: number) =>
  courseCompletionsCache(courseId)()
