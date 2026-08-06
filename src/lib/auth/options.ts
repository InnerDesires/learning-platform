import type { BetterAuthOptions, PayloadAuthOptions } from 'payload-auth/better-auth'
import { nextCookies } from 'better-auth/next-js'
import { emailOTP } from 'better-auth/plugins/email-otp'
import { Resend } from 'resend'
import { buildOtpEmailHtml } from '@/lib/email/verification-otp'
import { buildInviteEmailHtml } from '@/lib/email/admin-invite'
import { consumePreVerified } from '@/lib/auth/pre-verified'
import { isRateLimitEnabled } from '@/lib/rate-limit'

function resolveBaseURL(): string {
  // Explicit override wins: VERCEL_PROJECT_PRODUCTION_URL is the *shortest*
  // production custom domain, which during a domain migration is the old one.
  // Set this in Vercel for the production environment only, or previews break.
  if (process.env.NEXT_PUBLIC_BETTER_AUTH_URL) return process.env.NEXT_PUBLIC_BETTER_AUTH_URL
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL && process.env.VERCEL_ENV === 'production')
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
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
  rateLimit: {
    // Shared policy switch (see src/lib/rate-limit.ts): production-on,
    // RATE_LIMIT=true opts dev in, RATE_LIMIT=false opts E2E's prod build out.
    enabled: isRateLimitEnabled(),
    window: 60,
    max: 60,
    // Vercel functions don't share memory, so counters must live in Postgres.
    // payload-auth builds the matching `rateLimit` collection automatically
    // (hidden, admin-only); the same table backs src/lib/rate-limit.ts.
    storage: 'database',
    customRules: {
      '/sign-in/email': { window: 60, max: 10 },
      '/sign-up/email': { window: 60, max: 5 },
      // Every OTP request sends a Resend email — strictest limits.
      '/email-otp/send-verification-otp': { window: 60, max: 3 },
      '/forget-password/email-otp': { window: 60, max: 3 },
      '/sign-in/email-otp': { window: 60, max: 10 },
      '/email-otp/verify-email': { window: 60, max: 10 },
      '/email-otp/reset-password': { window: 60, max: 10 },
      // Session polling is read-only and frequent (admin panel, client
      // components) — a rate-limit row write per check would be pure overhead.
      '/get-session': false,
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user, ctx) => {
          if (user.emailVerified) return
          // Admin-invite signups (/admin/signup?token=…) never go through the
          // public OTP flow — a valid invite token authorizes creation instead.
          // Token sources mirror payload-auth's own invite middleware.
          const inviteToken =
            ctx?.headers?.get('x-admin-invite-token') ??
            (ctx?.query as { adminInviteToken?: string } | undefined)?.adminInviteToken ??
            (ctx?.body as { adminInviteToken?: string } | undefined)?.adminInviteToken ??
            (ctx?.body as { additionalData?: { adminInviteToken?: string } } | undefined)
              ?.additionalData?.adminInviteToken
          if (typeof inviteToken === 'string' && inviteToken && ctx) {
            const invitations = await ctx.context.adapter.count({
              model: 'admin-invitations',
              where: [{ field: 'token', operator: 'eq', value: inviteToken }],
            })
            if (invitations > 0) return
          }
          if (!consumePreVerified(user.email)) return false
          return { data: { ...user, emailVerified: true } }
        },
      },
    },
  },
  plugins: [
    nextCookies(),
    emailOTP({
      otpLength: 6,
      expiresIn: 300,
      allowedAttempts: 3,
      sendVerificationOnSignUp: false,
      async sendVerificationOTP({ email, otp, type }) {
        if (type !== 'email-verification' && type !== 'forget-password') return
        if (!process.env.RESEND_API_KEY) return
        const resend = new Resend(process.env.RESEND_API_KEY)
        const subject =
          type === 'forget-password'
            ? `Код для скидання пароля: ${otp}`
            : `Код підтвердження: ${otp}`
        await resend.emails.send({
          from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
          to: email,
          subject,
          html: buildOtpEmailHtml(otp, type),
        })
      },
    }),
  ],
} satisfies BetterAuthOptions

export const betterAuthPluginOptions = {
  disabled: false,
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
  adminInvitations: {
    // Required by the "Send Email" button in the admin invite modal — without
    // it the send-invite endpoint 500s. Goes through payload.sendEmail, i.e.
    // the Resend adapter in production and the console fallback in dev/CI.
    sendInviteEmail: async ({ payload, email, url }) => {
      try {
        await payload.sendEmail({
          to: email,
          subject: 'Запрошення до панелі адміністратора — Залізна Зміна',
          html: buildInviteEmailHtml(url),
        })
        return { success: true }
      } catch (error) {
        payload.logger.error({ err: error, msg: 'Failed to send admin invite email' })
        return { success: false, message: 'Не вдалося надіслати лист із запрошенням' }
      }
    },
  },
  betterAuthOptions,
} satisfies PayloadAuthOptions

export type ConstructedBetterAuthPluginOptions = typeof betterAuthPluginOptions
