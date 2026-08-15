import { getPayload, Payload } from 'payload'
import config from '@/payload.config'
import { describe, it, beforeAll, afterAll, expect } from 'vitest'
import { minimalEventData } from '../helpers/factories'
import type { User } from '@/payload-types'

let payload: Payload
let regularUser: User
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
  })

  afterAll(async () => {
    for (const id of createdEventIds) {
      await payload
        .delete({ collection: 'events', id, context: { disableRevalidate: true } })
        .catch(() => {})
    }
    await payload.delete({ collection: 'users', id: regularUser.id }).catch(() => {})
  })

  it('creates a published local event', async () => {
    const event = await createEvent(minimalEventData('Local Event'))
    expect(event._status).toBe('published')
    expect(event.locationType).toBe('local')
    expect(event.address).toBeTruthy()
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

  it('strips meetingLink from anonymous reads but keeps it for authenticated users', async () => {
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

    const authedResult = await payload.find({
      collection: 'events',
      where: { id: { equals: event.id } },
      user: regularUser,
      overrideAccess: false,
    })
    expect(authedResult.docs[0].meetingLink).toBe('https://us02web.zoom.us/j/1234567890')
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
