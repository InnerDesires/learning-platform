import { NextResponse } from 'next/server'
import { getPayload } from '@/lib/payload'
import { DEV_ADMIN } from '@/lib/auth/dev-credentials'
import { seedDevAdmin } from '@/lib/auth/seed-dev-admin'

/**
 * Dev-only auto-login: signs in as the dev admin and sets the Better Auth
 * session cookies, then redirects. One request logs a browser in —
 * `open http://localhost:3000/api/dev-login`.
 *
 * Self-healing: when sign-in fails (fresh/wiped database without the account),
 * it runs the dev-admin seed and retries — so the first login on any dev
 * branch works without a manual seeding step. The account normally pre-exists
 * via the seeded dev parent Neon branch, making the fast path seed-free.
 *
 * Never available on Vercel. Local production builds (pnpm dev:prod) must
 * opt in with ALLOW_DEV_LOGIN=1. See docs/dev-admin-login.md.
 */
function devLoginEnabled(): boolean {
  if (process.env.VERCEL) return false
  return process.env.NODE_ENV !== 'production' || process.env.ALLOW_DEV_LOGIN === '1'
}

// Collapses concurrent auto-seed attempts (e.g. two tabs hitting a fresh DB).
let pendingSeed: Promise<unknown> | null = null

async function signIn(payload: Awaited<ReturnType<typeof getPayload>>): Promise<Response> {
  return payload.betterAuth.api.signInEmail({
    body: { email: DEV_ADMIN.email, password: DEV_ADMIN.password },
    asResponse: true,
  })
}

export async function GET(request: Request) {
  if (!devLoginEnabled()) return new Response('Not found', { status: 404 })

  const payload = await getPayload()
  let authResponse = await signIn(payload)

  if (!authResponse.ok) {
    // Account missing (or stale password) — seed it, then retry once.
    payload.logger.info('dev-login: sign-in failed, running dev-admin seed')
    try {
      pendingSeed ??= seedDevAdmin(payload).finally(() => {
        pendingSeed = null
      })
      await pendingSeed
    } catch (error) {
      payload.logger.error({ err: error, msg: 'dev-login: dev-admin seed failed' })
      return new Response(
        'Dev admin auto-seed failed — see server logs. Manual fallback: pnpm seed:dev-admin',
        { status: 500 },
      )
    }
    authResponse = await signIn(payload)
  }

  if (!authResponse.ok) {
    return new Response(
      `Dev admin sign-in failed (HTTP ${authResponse.status}) even after seeding — see server logs.`,
      { status: 500 },
    )
  }

  const url = new URL(request.url)
  const redirectParam = url.searchParams.get('redirect')
  const redirectTo = redirectParam?.startsWith('/') ? redirectParam : '/'

  const response = NextResponse.redirect(new URL(redirectTo, url.origin), 303)
  for (const cookie of authResponse.headers.getSetCookie()) {
    response.headers.append('set-cookie', cookie)
  }
  return response
}
