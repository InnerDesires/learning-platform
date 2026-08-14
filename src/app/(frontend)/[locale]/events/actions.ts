'use server'

import { APIError, getPayload } from 'payload'
import configPromise from '@payload-config'
import { revalidatePath } from 'next/cache'
import { getSession } from '@/lib/auth/getSession'
import type { Event, EventEnrollment } from '@/payload-types'

function revalidateEventPages(slug: string) {
  for (const prefix of ['', '/en']) {
    revalidatePath(`${prefix}/events/${slug}`)
    revalidatePath(`${prefix}/events`)
  }
}

export async function getMyEventEnrollments(): Promise<number[]> {
  const session = await getSession().catch(() => null)
  if (!session?.user) return []

  const payload = await getPayload({ config: configPromise })
  const { docs } = await payload.find({
    collection: 'event-enrollments',
    where: { user: { equals: Number(session.user.id) } },
    limit: 1000,
    depth: 0,
    select: { event: true },
  })

  return docs.map((enrollment) =>
    typeof enrollment.event === 'object' ? enrollment.event.id : enrollment.event,
  )
}

export async function getEventEnrollment(eventId: number): Promise<EventEnrollment | null> {
  const session = await getSession()
  if (!session?.user) return null

  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'event-enrollments',
    where: {
      and: [{ user: { equals: session.user.id } }, { event: { equals: eventId } }],
    },
    limit: 1,
    depth: 0,
  })

  return result.docs[0] ?? null
}

export async function enrollInEvent(
  eventId: number,
): Promise<{ success: boolean; enrollment?: EventEnrollment; error?: string }> {
  const session = await getSession()
  if (!session?.user) {
    return { success: false, error: 'Необхідно увійти в акаунт' }
  }

  const payload = await getPayload({ config: configPromise })

  const existing = await payload.find({
    collection: 'event-enrollments',
    where: {
      and: [{ user: { equals: session.user.id } }, { event: { equals: eventId } }],
    },
    limit: 1,
  })

  if (existing.totalDocs > 0) {
    return { success: true, enrollment: existing.docs[0] }
  }

  let enrollment: EventEnrollment
  try {
    // The collection's beforeValidate hook enforces the business rules
    // (published event, not finished, free seats, no duplicates).
    enrollment = await payload.create({
      collection: 'event-enrollments',
      data: {
        user: Number(session.user.id),
        event: eventId,
      },
    })
  } catch (err) {
    if (err instanceof APIError && err.status === 429) {
      return { success: false, error: 'Забагато запитів. Спробуйте пізніше.' }
    }
    if (err instanceof APIError && err.status < 500) {
      return { success: false, error: err.message }
    }
    throw err
  }

  const event = (await payload.findByID({
    collection: 'events',
    id: eventId,
    depth: 0,
  })) as Event
  revalidateEventPages(event.slug)

  return { success: true, enrollment }
}

export async function unenrollFromEvent(
  eventId: number,
): Promise<{ success: boolean; error?: string }> {
  const session = await getSession()
  if (!session?.user) {
    return { success: false, error: 'Необхідно увійти в акаунт' }
  }

  const payload = await getPayload({ config: configPromise })

  const existing = await payload.find({
    collection: 'event-enrollments',
    where: {
      and: [{ user: { equals: session.user.id } }, { event: { equals: eventId } }],
    },
    limit: 1,
    depth: 0,
  })

  // Already not registered — nothing to undo.
  if (existing.totalDocs === 0) {
    return { success: true }
  }

  await payload.delete({
    collection: 'event-enrollments',
    id: existing.docs[0].id,
  })

  const event = (await payload.findByID({
    collection: 'events',
    id: eventId,
    depth: 0,
    disableErrors: true,
  })) as Event | null
  if (event) revalidateEventPages(event.slug)

  return { success: true }
}

export type EventJoinInfo = {
  meetingLink: string | null
  enrolled: boolean
}

/**
 * The meeting link is stripped from public reads (field access) and never
 * rendered into the shared ISR page — enrolled users fetch it here after
 * hydration.
 */
export async function getEventJoinInfo(eventId: number): Promise<EventJoinInfo> {
  const session = await getSession()
  if (!session?.user) return { meetingLink: null, enrolled: false }

  const payload = await getPayload({ config: configPromise })

  const enrollment = await payload.find({
    collection: 'event-enrollments',
    where: {
      and: [{ user: { equals: session.user.id } }, { event: { equals: eventId } }],
    },
    limit: 1,
    depth: 0,
  })
  if (enrollment.totalDocs === 0) return { meetingLink: null, enrolled: false }

  const event = (await payload.findByID({
    collection: 'events',
    id: eventId,
    depth: 0,
    disableErrors: true,
  })) as Event | null

  if (!event || event._status !== 'published' || event.locationType !== 'virtual') {
    return { meetingLink: null, enrolled: true }
  }

  return { meetingLink: event.meetingLink ?? null, enrolled: true }
}
