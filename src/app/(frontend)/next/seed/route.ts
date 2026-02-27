import { createLocalReq } from 'payload'
import { seed } from '@/endpoints/seed'
import { getPayload } from '@/lib/payload'
import { headers } from 'next/headers'

export const maxDuration = 60

export async function POST(): Promise<Response> {
  const payload = await getPayload()
  const requestHeaders = await headers()

  const session = await payload.betterAuth.api.getSession({
    headers: requestHeaders,
  })

  if (!session?.user) {
    return new Response('Action forbidden.', { status: 403 })
  }

  try {
    const user = await payload.findByID({
      collection: 'users',
      id: Number(session.user.id),
    })
    const payloadReq = await createLocalReq({ user }, payload)

    await seed({ payload, req: payloadReq })

    return Response.json({ success: true })
  } catch (e) {
    payload.logger.error({ err: e, message: 'Error seeding data' })
    return new Response('Error seeding data.', { status: 500 })
  }
}
