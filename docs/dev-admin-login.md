# Dev Admin Account & One-Command Login

Every dev database branch carries a ready-made admin account with realistic
data, and any locally running server can create a session for it with a single
request. Built for agent-driven browser testing (Claude browser pane,
Playwright, curl) — no signup flow, no OTP, no manual cookie juggling.

## The account

| | |
| --- | --- |
| Email | `dev-admin@example.com` |
| Password | `dev-admin-password` |
| Role | `admin` (full Payload admin panel access) |
| Name | Дев Адмін |

Credentials live in one place — [`src/lib/auth/dev-credentials.ts`](../src/lib/auth/dev-credentials.ts) —
shared by the seed script and the login route so they cannot drift.

The seeded account always has:

- **Filled profile** — name, «про мене», social links, XP (derived from progress)
- **One completed course** — all steps done, quiz passed (100%) when the course
  has a quiz, `completedAt` set → **certificate PDF downloads** from the profile page
- **One in-progress course** — partial step progress
- **Comments** — on both courses and on the latest published post
- **A quiz attempt record** — visible under «Останні спроби тестів»

## Logging in

### Browser (one navigation — for the Claude browser pane)

```
http://localhost:3000/api/dev-login
```

Navigating to that URL signs the browser in as the dev admin (Better Auth
session cookies are set server-side) and redirects to `/`. Optional redirect
target: `/api/dev-login?redirect=/admin`.

**Self-healing**: when sign-in fails because the account doesn't exist (a
branch created before the dev parent was seeded, a wiped database), the route
runs the seed automatically and retries — so the first login works on any dev
branch with no manual step. The fast path (account exists — the normal case,
since branches inherit it from the seeded `dev` parent) does no seeding and
takes ~0.5s; a cold auto-seed adds ~6s to that first request only.

### CLI / API testing (one command)

```bash
curl -si -c cookies.txt http://localhost:3000/api/dev-login   # creates session, saves cookie
curl -s -b cookies.txt http://localhost:3000/api/auth/get-session   # any authed request
```

The `set-cookie: better-auth.session_token=…` header from the first response is
the whole session — pass it back on subsequent requests.

### Availability guard

`GET /api/dev-login` ([src/app/api/dev-login/route.ts](../src/app/api/dev-login/route.ts)) is:

- **enabled** in `pnpm dev` (NODE_ENV=development)
- **disabled on Vercel** unconditionally (`process.env.VERCEL` check)
- **disabled in local production builds** (`pnpm dev:prod`) unless you export
  `ALLOW_DEV_LOGIN=1`

## Seeding

Seeding is normally **automatic**: dev branches inherit the account from the
seeded `dev` parent, and `/api/dev-login` seeds lazily when it's missing. Run
the seed explicitly only to **reset** the admin's data after destructive
testing, or to seed a database without booting the dev server:

```bash
pnpm seed:dev-admin                      # seeds/resets the branch in .env
DATABASE_URL=<url> pnpm seed:dev-admin   # seeds any other Neon branch
```

The core logic lives in [src/lib/auth/seed-dev-admin.ts](../src/lib/auth/seed-dev-admin.ts)
(shared by the CLI wrapper [scripts/seed-dev-admin.ts](../scripts/seed-dev-admin.ts)
and the login route):

- creates the user via Better Auth (`signUpEmail` + pre-verified email) if
  missing; if the email exists with a stale password it recreates the account
- reuses the two oldest published courses with steps; creates published demo
  courses only if the database has fewer than two
- is **idempotent** — reruns wipe only the dev admin's own enrollments, quiz
  attempts, comments and likes, then recreate them
- the CLI wrapper loads `.env.local` + `.env` itself (Next-style precedence),
  so a plain `DATABASE_URL=… pnpm seed:dev-admin` override works

## How this reaches every dev branch

The **`dev` parent Neon branch is seeded** (branch `br-steep-wind-agro4op0`,
project `ancient-cell-80589995`). Session branches are created with
`--parent dev` (see CLAUDE.md), so they inherit the account and its data
automatically — **no per-branch setup needed**.

Branches created **before** the parent was seeded (2026-07-24) lack the
account — there `/api/dev-login` auto-seeds on first hit, no manual step
needed. If you ever wipe or badly mutate the admin's data during testing,
`pnpm seed:dev-admin` resets it to the canonical state (auto-seed only fires
when sign-in fails, not when data is merely mangled).

## Typical agent workflow

```bash
pnpm dev                                   # dev server on :3000 (session branch DB)
# browser: open http://localhost:3000/api/dev-login  → logged in as admin
# …test authenticated flows, admin panel, certificates, comments…
pnpm seed:dev-admin                        # reset admin data if a test mangled it
```
