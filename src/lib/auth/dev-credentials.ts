/**
 * Fixed credentials for the seeded dev-admin account (dev/test databases only).
 *
 * Shared between `scripts/seed-dev-admin.ts` (creates the account) and
 * `GET /api/dev-login` (signs in with it) so the two can never drift apart.
 * Both entry points are disabled in production. See docs/dev-admin-login.md.
 */
export const DEV_ADMIN = {
  email: 'dev-admin@example.com',
  password: 'dev-admin-password',
  name: 'Дев Адмін',
} as const
