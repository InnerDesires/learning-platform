import { getPayload, Payload } from 'payload'
import config from '@/payload.config'
import { describe, it, beforeAll, afterAll, expect } from 'vitest'
import type { User } from '@/payload-types'

let payload: Payload
const createdUserIds: number[] = []

/**
 * Guards the shape of the `role` default. payload-auth passes its `defaultRole`
 * option through as a bare string, and `@payloadcms/drizzle` silently skips the
 * write for a hasMany select whose value is not an array — so a string default
 * produces `role: []` with no error anywhere. src/lib/auth/options.ts corrects
 * the default to `['learner']`; these tests fail if that override is dropped.
 */
describe('Users default role', () => {
  beforeAll(async () => {
    payload = await getPayload({ config: await config })
  })

  afterAll(async () => {
    for (const id of createdUserIds) {
      await payload.delete({ collection: 'users', id })
    }
  })

  it('declares the role default as an array, not a bare string', async () => {
    const usersConfig = (await config).collections.find((c) => c.slug === 'users')
    const roleField = usersConfig?.fields.find((f) => 'name' in f && f.name === 'role')

    expect(roleField).toBeDefined()
    expect(roleField && 'defaultValue' in roleField && roleField.defaultValue).toEqual(['learner'])
  })

  it('assigns learner to a user created without an explicit role', async () => {
    const user: User = await payload.create({
      collection: 'users',
      data: {
        name: 'Default Role User',
        email: `default-role-${Date.now()}@test.local`,
        emailVerified: true,
      },
    })
    createdUserIds.push(user.id)

    expect(user.role).toEqual(['learner'])

    // The default is applied before the write, so it has to survive a round trip
    // to the database — that is exactly where the string default was being lost.
    const reloaded = await payload.findByID({ collection: 'users', id: user.id })
    expect(reloaded.role).toEqual(['learner'])
  })

  it('leaves an explicitly provided role untouched', async () => {
    const user: User = await payload.create({
      collection: 'users',
      data: {
        name: 'Explicit Role User',
        email: `explicit-role-${Date.now()}@test.local`,
        emailVerified: true,
        role: ['admin'],
      },
    })
    createdUserIds.push(user.id)

    expect(user.role).toEqual(['admin'])
  })
})
