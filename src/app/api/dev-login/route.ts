import { NextResponse } from 'next/server'
import { getPayload } from '@/lib/payload'
import { DEV_ADMIN } from '@/lib/auth/dev-credentials'

/**
 * Dev-only auto-login: signs in as the seeded dev admin (pnpm seed:dev-admin)
 * and sets the Better Auth session cookies, then redirects. One request logs
 * a browser in — `open http://localhost:3000/api/dev-login`.
 *
 * Never available on Vercel. Local production builds (pnpm dev:prod) must
 * opt in with ALLOW_DEV_LOGIN=1. See docs/dev-admin-login.md.
 */
function devLoginEnabled(): boolean {
  if (process.env.VERCEL) return false
  return process.env.NODE_ENV !== 'production' || process.env.ALLOW_DEV_LOGIN === '1'
}

export async function GET(request: Request) {
  if (!devLoginEnabled()) return new Response('Not found', { status: 404 })

  const payload = await getPayload()
  const authResponse = await payload.betterAuth.api.signInEmail({
    body: { email: DEV_ADMIN.email, password: DEV_ADMIN.password },
    asResponse: true,
  })

  if (!authResponse.ok) {
    return new Response(
      `Dev admin sign-in failed (HTTP ${authResponse.status}). ` +
        'Seed the account first: pnpm seed:dev-admin',
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
