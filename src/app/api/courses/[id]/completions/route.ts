import { getCachedCourseCompletions } from '@/utilities/leaderboard'

// Public projection of who completed a course (name/avatar only) — enrollment docs
// themselves stay admin-or-own.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const courseId = Number(id)
  if (!Number.isInteger(courseId) || courseId <= 0) {
    return Response.json({ items: [] }, { status: 400 })
  }

  const items = await getCachedCourseCompletions(courseId)
  return Response.json(
    { items },
    { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } },
  )
}
