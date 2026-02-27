# Authentication & Authorization

## Overview

This application uses [payload-auth](https://www.payloadauth.com) (v1.8.4), a Payload CMS plugin that replaces Payload's built-in authentication with [Better Auth](https://www.better-auth.com). Better Auth provides database-backed sessions, email/password login, and social OAuth — all managed through a single plugin integration.

Payload's default auth (`auth: true` on the Users collection, JWT tokens, `payload-token` cookie) is **fully disabled**. All authentication flows go through Better Auth.

### Key design decisions

- **Database sessions** over JWTs — sessions are stored in a `sessions` table and can be revoked server-side.
- **HTTP-only cookies** — the session token is never exposed to client-side JavaScript.
- **Cookie caching** — a 5-minute signed cookie cache reduces database lookups on every request.
- **Breaking migration** — switching from Payload auth to Better Auth is destructive (password hashes are incompatible). The migration deletes all existing users and posts, requiring a fresh admin setup via `/admin`.

## Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                          │
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐   │
│  │  Login Page   │  │ Register Page│  │ Client Components        │   │
│  │  /[locale]/   │  │ /[locale]/   │  │ (UserMenu, AdminBar)     │   │
│  │  login        │  │ register     │  │                          │   │
│  └──────┬───────┘  └──────┬───────┘  └────────────┬─────────────┘   │
│         │                  │                       │                  │
│         └──────────┬───────┘            useSession() hook            │
│                    │                               │                  │
│         authClient.signIn/signUp          Better Auth React client   │
│                    │                               │                  │
│                    ▼                               │                  │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │           src/app/api/auth/[...all]/route.ts                 │    │
│  │           Next.js Route Handler (GET + POST)                 │    │
│  └──────────────────────┬───────────────────────────────────────┘    │
│                         │                                            │
├─────────────────────────┼────────────────────────────────────────────┤
│                         │       Payload CMS + Better Auth            │
│                         ▼                                            │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │              payload.betterAuth                               │    │
│  │  (exposed by payload-auth plugin on the Payload instance)     │    │
│  └──────────────────────┬───────────────────────────────────────┘    │
│                         │                                            │
│              ┌──────────┼──────────┐                                 │
│              ▼          ▼          ▼                                  │
│        ┌─────────┐ ┌─────────┐ ┌──────────────┐ ┌───────────────┐   │
│        │ users   │ │sessions │ │  accounts    │ │ verifications │   │
│        │         │ │         │ │              │ │               │   │
│        │ id      │ │ token   │ │ provider_id  │ │ identifier    │   │
│        │ name    │ │ user_id │ │ user_id      │ │ value         │   │
│        │ email   │ │ expires │ │ password     │ │ expires_at    │   │
│        │ role    │ │ ip/ua   │ │ access_token │ │               │   │
│        └─────────┘ └─────────┘ └──────────────┘ └───────────────┘   │
│                                                                      │
│        ┌──────────────┐  ┌──────────────────┐                        │
│        │ users_role   │  │admin_invitations │                        │
│        │ (enum array) │  │ (admin setup)    │                        │
│        └──────────────┘  └──────────────────┘                        │
└──────────────────────────────────────────────────────────────────────┘
```

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `payload-auth` | 1.8.4 | Payload CMS plugin wrapping Better Auth |
| `better-auth` | 1.4.19 | Core auth library (sessions, providers, API) |

Peer dependencies: `payload >= 3.69.0`, `@payloadcms/next >= 3.69.0` (satisfied by the project).

## Environment variables

| Variable | Example | Description |
|----------|---------|-------------|
| `BETTER_AUTH_SECRET` | `openssl rand -hex 32` | Signs session cookies |
| `NEXT_PUBLIC_BETTER_AUTH_URL` | `http://localhost:3000` | Base URL for auth API calls |
| `GOOGLE_CLIENT_ID` | `xxx.apps.googleusercontent.com` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | `GOCSPX-xxx` | Google OAuth client secret |

Google OAuth redirect URI: `{NEXT_PUBLIC_BETTER_AUTH_URL}/api/auth/callback/google`

## File structure

```
src/
├── lib/auth/
│   ├── options.ts          # Central Better Auth + plugin config
│   ├── client.ts           # Frontend auth client (signIn, signUp, signOut, useSession)
│   ├── getSession.ts       # Server-side session helper
│   └── requireSession.ts   # Locale-aware redirect for protected pages
├── lib/payload.ts          # getPayloadAuth wrapper (exposes payload.betterAuth)
├── app/api/auth/[...all]/route.ts  # Better Auth API route handler
├── middleware.ts           # i18n routing + optimistic auth check
├── access/
│   ├── admin.ts            # Checks user.role includes 'admin'
│   ├── authenticated.ts    # Checks user exists
│   └── authenticatedOrPublished.ts  # Authenticated or _status='published'
├── components/
│   ├── Auth/
│   │   ├── LoginForm.tsx   # Email/password + Google sign-in form
│   │   └── RegisterForm.tsx # Email/password + Google sign-up form
│   ├── UserMenu/index.tsx  # Header avatar/dropdown (profile link, sign out)
│   └── AdminBar/index.tsx  # Payload admin bar (admin-only, session-reactive)
├── app/(frontend)/[locale]/
│   ├── login/page.tsx      # Login page (Server Component)
│   ├── register/page.tsx   # Register page (Server Component)
│   └── profile/
│       ├── page.tsx        # Protected profile page
│       └── SignOutButton.tsx
└── collections/Users/index.ts  # Users collection (no auth: true)
```

## Configuration

### Better Auth options (`src/lib/auth/options.ts`)

```
betterAuthOptions
├── emailAndPassword: enabled, no email verification required
├── socialProviders: Google OAuth
├── session:
│   ├── expiresIn: 7 days
│   ├── updateAge: 1 day (auto-extends on activity)
│   └── cookieCache: 5 min (signed cookie avoids DB lookups)
├── account.accountLinking: enabled for Google + email-password
└── plugins: [nextCookies()]

betterAuthPluginOptions
├── disableDefaultPayloadAuth: true
├── hidePluginCollections: true
├── users:
│   ├── slug: 'users'
│   ├── roles: ['learner', 'admin']
│   ├── defaultRole: 'learner'
│   ├── adminRoles: ['admin']
│   └── defaultAdminRole: 'admin'
├── accounts.slug: 'accounts'
├── sessions.slug: 'sessions'
└── verifications.slug: 'verifications'
```

### Payload instance (`src/lib/payload.ts`)

All server-side code uses `getPayload()` from `src/lib/payload.ts`, which wraps `getPayloadAuth`. This returns the standard Payload instance extended with `payload.betterAuth` — the Better Auth API for session management, sign-up, etc.

### Route handler (`src/app/api/auth/[...all]/route.ts`)

Mounts Better Auth's API endpoints under `/api/auth/*`. All auth operations (sign in, sign up, sign out, OAuth callbacks, session checks) go through this handler.

## Session management

### How sessions work

1. **Sign in/up** creates a row in the `sessions` table with a random token, user reference, expiry, IP, and user-agent.
2. The token is set as an **HTTP-only cookie** (`better-auth.session_token`).
3. A **signed cookie cache** (`better-auth.session_data`) stores session + user data for 5 minutes to avoid a DB query on every request.
4. When `updateAge` (1 day) has elapsed since the session was created, the `expiresAt` is automatically extended on the next request.
5. Sessions expire after 7 days of inactivity.

### Token refresh

**No manual token refresh is needed.** Better Auth handles this automatically:
- Sessions auto-extend when `updateAge` is reached
- The cookie cache re-signs automatically
- No token rotation, no refresh tokens, no client-side refresh logic required

### Sign out

`signOut()` from the auth client deletes the session row and clears cookies. Components that call `signOut` also call `router.refresh()` to force server components to re-render with the new (unauthenticated) state.

## Authentication methods

### Email + Password

- Sign up: `authClient.signUp.email({ email, password, name })`
- Sign in: `authClient.signIn.email({ email, password, callbackURL })`
- Password is stored as a scrypt hash in the `accounts` table (`provider_id = 'credential'`), not in the `users` table
- Minimum 8 characters by default

### Google OAuth

- Sign in: `authClient.signIn.social({ provider: 'google', callbackURL })`
- OAuth flow redirects to Google, then back to `/api/auth/callback/google`
- Better Auth handles the callback and redirects to `callbackURL`
- Account linking: if a user signs up with email/password and later signs in with Google (same email), the accounts are linked

## Protected pages

Protection uses two layers. Both respect the i18n locale routing.

### Layer 1 — Middleware (optimistic, fast)

`src/middleware.ts` checks for the existence of the Better Auth session cookie using `getSessionCookie(request)`. This is a fast, optimistic check — it only verifies the cookie exists, not that it's valid.

Protected route prefixes: `/courses/`, `/profile`, `/certificates`

If no cookie is found, the user is redirected to the login page with a `redirect` query parameter preserving their original URL (including locale prefix).

```
User visits /en/courses/intro
  → Middleware: no session cookie
  → Redirect to /en/login?redirect=%2Fen%2Fcourses%2Fintro
```

### Layer 2 — Server Component (secure, authoritative)

Each protected page calls `requireSession(locale, currentPath)` which:
1. Calls `getSession()` — verifies the session against the database
2. If null, redirects to `/<locale>/login?redirect=<currentPath>`
3. If valid, returns the session

This is the real security check. Even if middleware is bypassed (e.g. direct server-side navigation), the page-level check catches it.

### "Login to continue" flow

```
User visits /en/courses/intro (unauthenticated)
  → requireSession() redirects to /en/login?redirect=%2Fen%2Fcourses%2Fintro
  → Login page shows "Log in to continue"
  → User signs in with callbackURL = /en/courses/intro
  → Better Auth creates session, redirects to /en/courses/intro
```

The `redirect` param is passed between login ↔ register pages so users don't lose their destination.

### 404 handling for protected pages

For fully protected dynamic routes, the check order is:
1. Check session → if missing, redirect to login
2. Fetch content → if not found, `notFound()`
3. Render page

This means unauthenticated users always see the login page, never a 404 — no information leaks about what content exists.

## i18n considerations

The app supports two locales: `uk` (default, no URL prefix) and `en` (prefixed as `/en/...`).

- Middleware strips the default locale prefix: `/uk/anything` → `/anything`
- Protected route matching uses `cleanPath` (locale stripped) so `/en/profile` and `/profile` both match `/profile`
- Login redirects use the user's current locale: `/en/profile` redirects to `/en/login`, not `/login`
- The `redirect` param stores the full user-visible URL including locale prefix
- Google OAuth `callbackURL` preserves the locale prefix — after OAuth the user lands on the correct locale version

## Roles & access control

### Roles

| Role | Default | Admin panel | Content CRUD |
|------|---------|-------------|--------------|
| `learner` | Yes (new users) | No access | Read only (published) |
| `admin` | No (first user via `/admin`, or promoted) | Full access | Full CRUD |

Roles are stored in the `users_role` table as an array (Payload select field with `hasMany`).

### Access control functions

| Function | Location | Logic |
|----------|----------|-------|
| `admin` | `src/access/admin.ts` | `user.role.includes('admin')` — boolean only |
| `authenticated` | `src/access/authenticated.ts` | `Boolean(user)` |
| `authenticatedOrPublished` | `src/access/authenticatedOrPublished.ts` | Authenticated → all; anonymous → `_status = 'published'` |

### Collection access matrix

| Collection | `admin` (panel) | `create` | `read` | `update` | `delete` |
|------------|-----------------|----------|--------|----------|----------|
| Users | `admin` | `admin` | `authenticated` | `authenticated` | `admin` |
| Posts | — | `admin` | `authenticatedOrPublished` | `admin` | `admin` |
| Pages | — | `admin` | `authenticatedOrPublished` | `admin` | `admin` |
| Media | — | `admin` | `anyone` | `admin` | `admin` |
| Categories | — | `admin` | `anyone` | `admin` | `admin` |

The `Users.access.admin` property specifically controls who can access the Payload admin panel — only users with the `admin` role.

### Admin Bar

The `AdminBar` component (`src/components/AdminBar/index.tsx`) is visible only to admin users. It:
1. Uses Payload's `PayloadAdminBar` component which calls `/api/users/me`
2. Checks `user.role.includes('admin')` in the `onAuthChange` callback
3. Additionally watches Better Auth's `useSession()` hook — if the session disappears (sign out), the bar hides immediately without waiting for a Payload re-check

## Frontend components

### UserMenu (`src/components/UserMenu/index.tsx`)

Displays in the header navigation:
- **Loading**: skeleton circle (pulse animation)
- **Unauthenticated**: user icon linking to login page
- **Authenticated**: avatar circle (user image or initials) with dropdown containing:
  - User name and email
  - Profile link (neutral hover)
  - Sign out button (red/destructive hover)

Supports controlled state (`open`/`onToggle` props) so `HeaderNav` can coordinate it with the mobile hamburger menu — opening one closes the other.

### LoginForm / RegisterForm (`src/components/Auth/`)

Client components with:
- Email/password form fields
- Google OAuth button
- Bilingual labels (uk/en)
- `callbackURL` from `redirect` query param for "login to continue" flow
- Links between login ↔ register preserving the `redirect` param

## Database migration

### Migration: `20260227_181154_better_auth`

This is a **destructive** migration. Payload's old auth schema (password hash in `users` table) is incompatible with Better Auth (credentials in `accounts` table with different hashing). The migration:

1. Creates enums: `enum_users_role`, `enum_admin_invitations_role`
2. **Deletes all posts** (they reference users as authors)
3. **Deletes all users** (password hashes can't be migrated)
4. Alters `users` table: drops `hash`, `salt`, `reset_password_token`, `reset_password_expiration`, `login_attempts`, `lock_until`; adds `email_verified`, `image`; makes `name` NOT NULL
5. Creates tables: `users_role`, `sessions`, `accounts`, `verifications`, `admin_invitations`
6. Adds foreign keys and indexes
7. Extends `payload_locked_documents_rels` with references to new tables
8. Drops old `users_sessions` table

After migration, the first visit to `/admin` triggers the "create first admin" flow.

### Why users must be deleted

Better Auth stores credentials in the `accounts` table, not the `users` table. Specifically:
- Email/password → `accounts` row with `provider_id = 'credential'`, password hashed with scrypt
- Google OAuth → `accounts` row with `provider_id = 'google'`

Payload's old auth stored `hash` and `salt` directly on the `users` table using a different algorithm. There is no way to automatically convert old hashes to Better Auth's format. Users without an `accounts` entry cannot log in at all — they appear to exist but have no credentials.

## Seeding

### Seed endpoint (`src/endpoints/seed/index.ts`)

Creates demo content including a demo author user. The author is created via `payload.create({ collection: 'users' })` (Local API, which bypasses access control). This user does **not** get an `accounts` entry and cannot log in — it exists only as an author reference on posts.

### Seed route (`src/app/(frontend)/next/seed/route.ts`)

The POST route authenticates using Better Auth's `getSession()` instead of the old `payload.auth()`. It requires an active session to run the seed.

### Test helpers (`tests/helpers/seedUser.ts`)

Creates test users via `payload.betterAuth.api.signUpEmail()`, which creates both the `users` record and the `accounts` record (with hashed password). The test user is promoted to admin role for admin panel E2E tests.

## Troubleshooting

### "Create first admin" loop on `/admin`

If `/admin` redirects to the first-admin setup screen but rejects your email as "already exists", the user exists in the `users` table but has no entry in the `accounts` table. This is the scenario the destructive migration prevents — delete the orphaned user or clear the database.

### Session cookie not set after sign in

Check that `NEXT_PUBLIC_BETTER_AUTH_URL` matches the origin you're accessing the app from. The `trustedOrigins` config must include this URL.

### Google OAuth callback fails

Verify that the redirect URI in Google Cloud Console matches exactly: `{NEXT_PUBLIC_BETTER_AUTH_URL}/api/auth/callback/google`. The path is case-sensitive and must include the protocol.

### Admin bar stays visible after sign out

The `AdminBar` watches Better Auth's `useSession()` hook. If sign out doesn't trigger `router.refresh()`, the session data may be stale. All sign-out flows should call `router.refresh()` after `signOut()`.
