// Runs Payload migrations during the Vercel PRODUCTION build only.
//
// Wired via the `vercel-build` script in package.json. Preview builds (and
// any other VERCEL_ENV) skip migrations entirely: previews point at a
// long-lived branch in the dev Neon project and must never mutate schema.
// See docs/database-workflow.md, Flow 4.
//
// Deliberately NOT using the adapter's `prodMigrations`: Payload initializes
// during `next build` prerendering, so startup-managed migrations would run
// inside every build — including previews — against whatever database that
// environment sees.

import { spawnSync } from 'node:child_process'

const env = process.env.VERCEL_ENV ?? '(unset)'

if (env !== 'production') {
  console.log(`[migrate-on-vercel] VERCEL_ENV=${env} — skipping migrations.`)
  process.exit(0)
}

if (!process.env.DATABASE_URL) {
  console.error('[migrate-on-vercel] VERCEL_ENV=production but DATABASE_URL is not set — refusing to build.')
  process.exit(1)
}

console.log('[migrate-on-vercel] VERCEL_ENV=production — running payload migrate…')

const result = spawnSync('pnpm', ['payload', 'migrate'], { stdio: 'inherit' })

if (result.status !== 0) {
  console.error('[migrate-on-vercel] migration failed — aborting build so the previous deployment keeps serving.')
  process.exit(result.status ?? 1)
}

console.log('[migrate-on-vercel] migrations applied.')
