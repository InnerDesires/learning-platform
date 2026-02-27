import type { BetterAuthOptions, PayloadAuthOptions } from 'payload-auth/better-auth'
import { nextCookies } from 'better-auth/next-js'

const baseURL =
  process.env.NEXT_PUBLIC_BETTER_AUTH_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

const trustedOrigins = [baseURL]
if (process.env.VERCEL_URL) {
  trustedOrigins.push(`https://${process.env.VERCEL_URL}`)
}

export const betterAuthOptions = {
  appName: 'learning-platform',
  baseURL,
  trustedOrigins,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ['google', 'email-password'],
    },
  },
  plugins: [nextCookies()],
} satisfies BetterAuthOptions

export const betterAuthPluginOptions = {
  disabled: false,
  disableDefaultPayloadAuth: true,
  hidePluginCollections: true,
  users: {
    slug: 'users',
    hidden: false,
    adminRoles: ['admin'],
    defaultRole: 'learner',
    defaultAdminRole: 'admin',
    roles: ['learner', 'admin'],
    allowedFields: ['name'],
  },
  accounts: {
    slug: 'accounts',
  },
  sessions: {
    slug: 'sessions',
  },
  verifications: {
    slug: 'verifications',
  },
  betterAuthOptions,
} satisfies PayloadAuthOptions

export type ConstructedBetterAuthPluginOptions = typeof betterAuthPluginOptions
