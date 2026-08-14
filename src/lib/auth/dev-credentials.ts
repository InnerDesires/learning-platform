// Dev/test databases only — shared by the seed script and /api/dev-login so the two can
// never drift apart. Both entry points are disabled in production.
export const DEV_ADMIN = {
  email: 'dev-admin@example.com',
  password: 'dev-admin-password',
  name: 'Дев Адмін',
} as const
