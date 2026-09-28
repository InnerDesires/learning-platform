import { getPayload, Payload } from 'payload'
import config from '@/payload.config'
import { describe, it, beforeAll, afterAll, expect } from 'vitest'
import { minimalEventData } from '../helpers/factories'
import type { User } from '@/payload-types'
import { formatEventRange, formatEventTime, isSameEventDay } from '@/utilities/eventTime'

let payload: Payload
let regularUser: User
let adminUser: User
const createdEventIds: number[] = []

async function createEvent(data: Record<string, unknown>) {
  const event = await payload.create({
    collection: 'events',
    data: data as never,
  })
  createdEventIds.push(event.id)
  return event
}

describe('Events', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })

    regularUser = (await payload.create({
      collection: 'users',
      data: {
        name: 'Events Test User',
        email: `events-test-${Date.now()}@test.local`,
        emailVerified: true,
        role: ['learner'],
      },
    })) as User

    adminUser = (await payload.create({
      collection: 'users',
      data: {
        name: 'Events Test Admin',
        email: `events-test-admin-${Date.now()}@test.local`,
        emailVerified: true,
        role: ['admin'],
      },
    })) as User
  })

  afterAll(async () => {
    for (const id of createdEventIds) {
      await payload
        .delete({ collection: 'events', id, context: { disableRevalidate: true } })
        .catch(() => {})
    }
    await payload.delete({ collection: 'users', id: regularUser.id }).catch(() => {})
    await payload.delete({ collection: 'users', id: adminUser.id }).catch(() => {})
  })

  it('creates a published local event', async () => {
    const event = await createEvent(minimalEventData('Local Event'))
    expect(event._status).toBe('published')
    expect(event.locationType).toBe('local')
    expect(event.address).toBeTruthy()
  })

  it('formats UTC timestamps consistently in Kyiv time across day boundaries', () => {
    const start = new Date('2026-09-28T21:30:00.000Z')
    const end = new Date('2026-09-29T00:30:00.000Z')
    expect(formatEventTime(start, 'uk')).toBe('00:30')
    expect(isSameEventDay(start, end)).toBe(true)
    expect(formatEventRange({ startDate: start.toISOString(), endDate: end.toISOString() }, 'uk'))
      .toContain('00:30 – 03:30')
  })

  it('stores event comments and likes and removes them when the event is deleted', async () => {
    const event = await createEvent(minimalEventData('Interactive Event'))
    const comment = await payload.create({
      collection: 'comments',
      data: {
        body: 'Looking forward to this event',
        author: regularUser.id,
        targetCollection: 'events',
        targetId: event.id,
      },
    })
    await payload.create({
      collection: 'likes',
      data: { user: regularUser.id, targetCollection: 'events', targetId: event.id },
    })
    await payload.create({
      collection: 'likes',
      data: { user: regularUser.id, targetCollection: 'comments', targetId: comment.id },
    })

    const comments = await payload.find({
      collection: 'comments',
      where: { and: [{ targetCollection: { equals: 'events' } }, { targetId: { equals: event.id } }] },
    })
    expect(comments.docs.map((doc) => doc.id)).toContain(comment.id)

    await payload.delete({ collection: 'events', id: event.id, context: { disableRevalidate: true } })
    createdEventIds.splice(createdEventIds.indexOf(event.id), 1)

    const [remainingComments, remainingEventLikes, remainingCommentLikes] = await Promise.all([
      payload.count({ collection: 'comments', where: { targetId: { equals: event.id } } }),
      payload.count({ collection: 'likes', where: { and: [{ targetCollection: { equals: 'events' } }, { targetId: { equals: event.id } }] } }),
      payload.count({ collection: 'likes', where: { and: [{ targetCollection: { equals: 'comments' } }, { targetId: { equals: comment.id } }] } }),
    ])
    expect(remainingComments.totalDocs).toBe(0)
    expect(remainingEventLikes.totalDocs).toBe(0)
    expect(remainingCommentLikes.totalDocs).toBe(0)
  })

  it('rejects publishing a virtual event without a meeting link', async () => {
    await expect(
      payload.create({
        collection: 'events',
        data: minimalEventData('Virtual No Link', {
          locationType: 'virtual',
          address: undefined,
        }) as never,
      }),
    ).rejects.toThrow()
  })

  it('rejects publishing a local event without an address', async () => {
    await expect(
      payload.create({
        collection: 'events',
        data: minimalEventData('Local No Address', { address: undefined }) as never,
      }),
    ).rejects.toThrow()
  })

  it('rejects an endDate that is not after startDate', async () => {
    const start = new Date(Date.now() + 24 * 60 * 60 * 1000)
    await expect(
      payload.create({
        collection: 'events',
        data: minimalEventData('Bad Dates', {
          startDate: start.toISOString(),
          endDate: new Date(start.getTime() - 60 * 60 * 1000).toISOString(),
        }) as never,
      }),
    ).rejects.toThrow()
  })

  it('hides draft events from anonymous reads', async () => {
    const draft = await createEvent(minimalEventData('Draft Event', { _status: 'draft' }))

    const anonResult = await payload.find({
      collection: 'events',
      where: { id: { equals: draft.id } },
      overrideAccess: false,
    })
    expect(anonResult.totalDocs).toBe(0)
  })

  it('strips meetingLink from anonymous and non-admin reads but keeps it for admins', async () => {
    const event = await createEvent(
      minimalEventData('Virtual Event', {
        locationType: 'virtual',
        address: undefined,
        meetingLink: 'https://us02web.zoom.us/j/1234567890',
      }),
    )

    const anonResult = await payload.find({
      collection: 'events',
      where: { id: { equals: event.id } },
      overrideAccess: false,
    })
    expect(anonResult.totalDocs).toBe(1)
    expect(anonResult.docs[0].meetingLink ?? null).toBeNull()

    const learnerResult = await payload.find({
      collection: 'events',
      where: { id: { equals: event.id } },
      user: regularUser,
      overrideAccess: false,
    })
    expect(learnerResult.docs[0].meetingLink ?? null).toBeNull()

    const adminResult = await payload.find({
      collection: 'events',
      where: { id: { equals: event.id } },
      user: adminUser,
      overrideAccess: false,
    })
    expect(adminResult.docs[0].meetingLink).toBe('https://us02web.zoom.us/j/1234567890')
  })

  it('rejects create/update from non-admin users', async () => {
    await expect(
      payload.create({
        collection: 'events',
        data: minimalEventData('Forged Event') as never,
        user: regularUser,
        overrideAccess: false,
      }),
    ).rejects.toThrow()

    const event = await createEvent(minimalEventData('Untouchable Event'))
    await expect(
      payload.update({
        collection: 'events',
        id: event.id,
        data: { title: 'Hacked' },
        user: regularUser,
        overrideAccess: false,
      }),
    ).rejects.toThrow()
  })

  it('deleting an event cascades its enrollments', async () => {
    const event = await createEvent(minimalEventData('Cascade Event'))
    await payload.create({
      collection: 'event-enrollments',
      data: { user: regularUser.id, event: event.id },
    })

    await payload.delete({
      collection: 'events',
      id: event.id,
      context: { disableRevalidate: true },
    })
    createdEventIds.splice(createdEventIds.indexOf(event.id), 1)

    const orphans = await payload.find({
      collection: 'event-enrollments',
      where: { user: { equals: regularUser.id } },
    })
    expect(orphans.totalDocs).toBe(0)
  })
})
