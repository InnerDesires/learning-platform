import type { BetterAuthOptions, PayloadAuthOptions } from 'payload-auth/better-auth'
import { nextCookies } from 'better-auth/next-js'

function resolveBaseURL(): string {
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  if (process.env.NEXT_PUBLIC_BETTER_AUTH_URL) return process.env.NEXT_PUBLIC_BETTER_AUTH_URL
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL)
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  return 'http://localhost:3000'
}

const baseURL = resolveBaseURL()

const trustedOrigins = new Set([baseURL])
if (process.env.VERCEL_URL) trustedOrigins.add(`https://${process.env.VERCEL_URL}`)
if (process.env.VERCEL_PROJECT_PRODUCTION_URL)
  trustedOrigins.add(`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`)
if (process.env.NEXT_PUBLIC_BETTER_AUTH_URL)
  trustedOrigins.add(process.env.NEXT_PUBLIC_BETTER_AUTH_URL)

const socialProviders: BetterAuthOptions['socialProviders'] =
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ? {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        },
      }
    : undefined

export const betterAuthOptions = {
  appName: 'Залізна Зміна',
  baseURL,
  trustedOrigins: [...trustedOrigins],
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  ...(socialProviders && { socialProviders }),
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
