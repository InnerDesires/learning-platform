import { getPayloadAuth } from 'payload-auth/better-auth'
import config from '../../src/payload.config.js'
import type { ConstructedBetterAuthPluginOptions } from '../../src/lib/auth/options.js'
import { markPreVerified } from '../../src/lib/auth/pre-verified.js'

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

  markPreVerified(testUser.email)
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

// CLI runner: pnpm exec cross-env NODE_OPTIONS=--no-deprecation tsx tests/helpers/seedUser.ts
const isMain = process.argv[1]?.endsWith('seedUser.ts') || process.argv[1]?.endsWith('seedUser.js')
if (isMain) {
  const cmd = process.argv[2]
  if (cmd === 'cleanup') {
    cleanupTestUser().then(() => { console.log('Cleaned up test user'); process.exit(0) }).catch(err => { console.error(err); process.exit(1) })
  } else {
    seedTestUser().then(() => { console.log('Seeded test user'); process.exit(0) }).catch(err => { console.error(err); process.exit(1) })
  }
}
