import { getSession } from '@/lib/auth/getSession'
import { getSearchIndex } from '@/lib/admin-docs/loader'

/** Search index for the admin docs viewer. Requires an authenticated user. */
export const GET = async (): Promise<Response> => {
  const session = await getSession()

  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return Response.json(getSearchIndex(), {
    headers: { 'Cache-Control': 'private, max-age=300' },
  })
}
