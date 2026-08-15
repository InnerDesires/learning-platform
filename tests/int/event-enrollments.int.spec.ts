import { getPayload, Payload } from 'payload'
import config from '@/payload.config'
import { describe, it, beforeAll, afterAll, afterEach, expect } from 'vitest'
import { minimalEventData } from '../helpers/factories'
import type { Event, User } from '@/payload-types'

let payload: Payload
let user: User
let otherUser: User
let adminUser: User
let event: Event
const createdEventIds: number[] = []

async function createEvent(data: Record<string, unknown>) {
  const doc = await payload.create({ collection: 'events', data: data as never })
  createdEventIds.push(doc.id)
  return doc
}

describe('EventEnrollments', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })

    const uid = Date.now()
    user = (await payload.create({
      collection: 'users',
      data: {
        name: 'Event Enroll User',
        email: `event-enroll-${uid}@test.local`,
        emailVerified: true,
        role: ['learner'],
      },
    })) as User
    otherUser = (await payload.create({
      collection: 'users',
      data: {
        name: 'Event Enroll Other',
        email: `event-enroll-other-${uid}@test.local`,
        emailVerified: true,
        role: ['learner'],
      },
    })) as User
    adminUser = (await payload.create({
      collection: 'users',
      data: {
        name: 'Event Enroll Admin',
        email: `event-enroll-admin-${uid}@test.local`,
        emailVerified: true,
        role: ['admin'],
      },
    })) as User

    event = (await createEvent(minimalEventData('Enrollable Event'))) as Event
  })

  afterEach(async () => {
    await payload.delete({
      collection: 'event-enrollments',
      where: { user: { in: [user.id, otherUser.id] } },
    })
  })

  afterAll(async () => {
    for (const id of createdEventIds) {
      await payload
        .delete({ collection: 'events', id, context: { disableRevalidate: true } })
        .catch(() => {})
    }
    for (const u of [user, otherUser, adminUser]) {
      await payload.delete({ collection: 'users', id: u.id }).catch(() => {})
    }
  })

  it('stamps enrolledAt on create', async () => {
    const enrollment = await payload.create({
      collection: 'event-enrollments',
      data: { user: user.id, event: event.id },
    })
    expect(enrollment.enrolledAt).toBeTruthy()
  })

  it('rejects duplicate registration for the same user+event', async () => {
    await payload.create({
      collection: 'event-enrollments',
      data: { user: user.id, event: event.id },
    })
    await expect(
      payload.create({
        collection: 'event-enrollments',
        data: { user: user.id, event: event.id },
      }),
    ).rejects.toMatchObject({ status: 409 })
  })

  it('rejects registration for a draft event', async () => {
    const draft = await createEvent(minimalEventData('Draft Only Event', { _status: 'draft' }))
    await expect(
      payload.create({
        collection: 'event-enrollments',
        data: { user: user.id, event: draft.id },
      }),
    ).rejects.toMatchObject({ status: 404 })
  })

  it('rejects registration for a finished event', async () => {
    const past = await createEvent(
      minimalEventData('Past Event', {
        startDate: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      }),
    )
    await expect(
      payload.create({
        collection: 'event-enrollments',
        data: { user: user.id, event: past.id },
      }),
    ).rejects.toMatchObject({ status: 400 })
  })

  it('allows registration while an event is in progress', async () => {
    const ongoing = await createEvent(
      minimalEventData('Ongoing Event', {
        startDate: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      }),
    )
    const enrollment = await payload.create({
      collection: 'event-enrollments',
      data: { user: user.id, event: ongoing.id },
    })
    expect(enrollment.id).toBeDefined()
  })

  it('rejects registration once capacity is reached, but admins may override', async () => {
    const small = await createEvent(minimalEventData('Tiny Event', { capacity: 1 }))

    await payload.create({
      collection: 'event-enrollments',
      data: { user: user.id, event: small.id },
    })
    await expect(
      payload.create({
        collection: 'event-enrollments',
        data: { user: otherUser.id, event: small.id },
      }),
    ).rejects.toMatchObject({ status: 409 })

    // Admin panel sign-ups (e.g. offline registrations) bypass the capacity rule.
    const adminCreated = await payload.create({
      collection: 'event-enrollments',
      data: { user: otherUser.id, event: small.id },
      user: adminUser,
      overrideAccess: false,
    })
    expect(adminCreated.id).toBeDefined()
  })

  it('binds non-admin API registrations to the requesting user', async () => {
    const enrollment = await payload.create({
      collection: 'event-enrollments',
      // A forged user id must not let one user register another.
      data: { user: otherUser.id, event: event.id },
      user,
      overrideAccess: false,
    })
    const boundUserId =
      typeof enrollment.user === 'object' ? enrollment.user.id : enrollment.user
    expect(boundUserId).toBe(user.id)
  })

  it('read access: own rows only for non-admins, everything for admins, nothing for anon', async () => {
    await payload.create({
      collection: 'event-enrollments',
      data: { user: user.id, event: event.id },
    })

    const own = await payload.find({
      collection: 'event-enrollments',
      where: { event: { equals: event.id } },
      user,
      overrideAccess: false,
    })
    expect(own.totalDocs).toBe(1)

    const foreign = await payload.find({
      collection: 'event-enrollments',
      where: { event: { equals: event.id } },
      user: otherUser,
      overrideAccess: false,
    })
    expect(foreign.totalDocs).toBe(0)

    const admin = await payload.find({
      collection: 'event-enrollments',
      where: { event: { equals: event.id } },
      user: adminUser,
      overrideAccess: false,
    })
    expect(admin.totalDocs).toBe(1)

    await expect(
      payload.find({
        collection: 'event-enrollments',
        where: { event: { equals: event.id } },
        overrideAccess: false,
      }),
    ).rejects.toThrow()
  })

  it('owners can cancel their own registration; others cannot', async () => {
    const enrollment = await payload.create({
      collection: 'event-enrollments',
      data: { user: user.id, event: event.id },
    })

    await expect(
      payload.delete({
        collection: 'event-enrollments',
        id: enrollment.id,
        user: otherUser,
        overrideAccess: false,
      }),
    ).rejects.toThrow()

    const deleted = await payload.delete({
      collection: 'event-enrollments',
      id: enrollment.id,
      user,
      overrideAccess: false,
    })
    expect(deleted.id).toBe(enrollment.id)

    const remaining = await payload.find({
      collection: 'event-enrollments',
      where: { id: { equals: enrollment.id } },
    })
    expect(remaining.totalDocs).toBe(0)
  })

  it('progress-free rows are not owner-updatable', async () => {
    const enrollment = await payload.create({
      collection: 'event-enrollments',
      data: { user: user.id, event: event.id },
    })

    await expect(
      payload.update({
        collection: 'event-enrollments',
        id: enrollment.id,
        data: { enrolledAt: new Date(0).toISOString() },
        user,
        overrideAccess: false,
      }),
    ).rejects.toThrow()
  })
})
