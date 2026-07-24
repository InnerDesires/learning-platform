/**
 * CLI wrapper around the dev-admin seed (src/lib/auth/seed-dev-admin.ts).
 *
 * Normally you don't need this: dev branches inherit the account from the
 * seeded dev parent, and GET /api/dev-login auto-seeds when it's missing.
 * Run it explicitly to RESET the admin's data after destructive testing, or
 * to seed a database without booting the dev server.
 *
 * Run against the branch in .env:      pnpm seed:dev-admin
 * Run against another Neon branch:     DATABASE_URL=<url> pnpm seed:dev-admin
 *
 * See docs/dev-admin-login.md for the full flow.
 */
import { config as loadEnv } from 'dotenv'

// Env must be in place (.env + .env.local — BETTER_AUTH_SECRET lives in the
// latter) before payload.config.ts is evaluated, hence dynamic imports below.
// dotenv never overrides keys that are already set, so loading .env.local
// first gives Next's precedence: real env > .env.local > .env.
loadEnv({ path: '.env.local' })
loadEnv({ path: '.env' })

const { getPayloadAuth } = await import('payload-auth/better-auth')
const { default: config } = await import('../src/payload.config.js')
const { seedDevAdmin } = await import('../src/lib/auth/seed-dev-admin.js')
const { DEV_ADMIN } = await import('../src/lib/auth/dev-credentials.js')

const dbHost = process.env.DATABASE_URL?.match(/@([^/]+)\//)?.[1] ?? 'unknown'
console.log(`Seeding dev admin on ${dbHost}`)

const payload = await getPayloadAuth<
  import('../src/lib/auth/options.js').ConstructedBetterAuthPluginOptions
>(config)
const summary = await seedDevAdmin(payload)

console.log(`
Dev admin ready (user id ${summary.userId})
  email:       ${DEV_ADMIN.email}
  password:    ${DEV_ADMIN.password}
  completed:   «${summary.completedCourse}» (certificate available${summary.completedCourseHasQuiz ? ', quiz passed' : ''})
  in progress: «${summary.inProgressCourse}»
  comments:    ${summary.comments}

Browser login: http://localhost:3000/api/dev-login (see docs/dev-admin-login.md)`)
process.exit(0)
