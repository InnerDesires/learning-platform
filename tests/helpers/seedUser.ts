import { getPayloadAuth } from 'payload-auth/better-auth'
import config from '../../src/payload.config.js'
import type { ConstructedBetterAuthPluginOptions } from '../../src/lib/auth/options.js'

export const testUser = {
  email: 'dev@payloadcms.com',
  password: 'test-password-123',
  name: 'Test User',
}

async function getPayload() {
  return getPayloadAuth<ConstructedBetterAuthPluginOptions>(config)
}

export async function seedTestUser(): Promise<void> {
  const payload = await getPayload()

  await payload.delete({
    collection: 'users',
    where: {
      email: {
        equals: testUser.email,
      },
    },
  })

  await payload.betterAuth.api.signUpEmail({
    body: {
      email: testUser.email,
      password: testUser.password,
      name: testUser.name,
    },
  })

  const users = await payload.find({
    collection: 'users',
    where: { email: { equals: testUser.email } },
    limit: 1,
  })

  if (users.docs[0]) {
    await payload.update({
      collection: 'users',
      id: users.docs[0].id,
      data: { role: ['admin'] } as Record<string, unknown>,
    })
  }
}

export async function cleanupTestUser(): Promise<void> {
  const payload = await getPayload()

  await payload.delete({
    collection: 'users',
    where: {
      email: {
        equals: testUser.email,
      },
    },
  })
}
