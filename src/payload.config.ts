import { postgresAdapter } from '@payloadcms/db-postgres'
import { resendAdapter } from '@payloadcms/email-resend'
import { uk } from '@payloadcms/translations/languages/uk'
import { en } from '@payloadcms/translations/languages/en'
import sharp from 'sharp'
import path from 'path'
import { buildConfig, PayloadRequest } from 'payload'
import { fileURLToPath } from 'url'

import { Categories } from './collections/Categories'
import { Comments } from './collections/Comments'
import { CourseCategories } from './collections/CourseCategories'
import { CourseFiles } from './collections/CourseFiles'
import { Courses } from './collections/Courses'
import { Enrollments } from './collections/Enrollments'
import { Likes } from './collections/Likes'
import { QuizAttempts } from './collections/QuizAttempts'
import { Media } from './collections/Media'
import { Pages } from './collections/Pages'
import { Posts } from './collections/Posts'
import { Users } from './collections/Users'
import { Footer } from './Footer/config'
import { Header } from './Header/config'
import { plugins } from './plugins'
import { defaultLexical } from '@/fields/defaultLexical'
import { getServerSideURL } from './utilities/getURL'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

/**
 * `pg-connection-string` currently treats sslmode `prefer`/`require`/`verify-ca`
 * as aliases for `verify-full`, but warns that this changes in pg v9. Make the
 * current (stronger) behavior explicit so we keep full verification and silence
 * the deprecation warning. Neon serves a publicly-trusted cert, so verify-full works.
 */
const normalizeDatabaseURL = (url: string): string =>
  url.replace(/([?&]sslmode=)(prefer|require|verify-ca)\b/i, '$1verify-full')

// Every Neon branch has its own endpoint host, so logging the host answers
// "which database am I actually connected to?" at a glance (multiple env
// files and per-session branches make this easy to get wrong silently).
try {
  const dbHost = new URL(process.env.DATABASE_URL || '').hostname
  console.log(`[payload] DATABASE_URL host: ${dbHost}`)
} catch {
  console.warn('[payload] DATABASE_URL is not set or not a valid URL')
}

export default buildConfig({
  serverURL: getServerSideURL(),
  admin: {
    components: {
      // The `BeforeLogin` component renders a message that you see while logging into your admin panel.
      // Feel free to delete this at any time. Simply remove the line below.
      beforeLogin: ['@/components/BeforeLogin'],
      // The `BeforeDashboard` component renders the 'welcome' block that you see after logging into your admin panel.
      // Feel free to delete this at any time. Simply remove the line below.
      beforeDashboard: ['@/components/BeforeDashboard'],
    },
    importMap: {
      baseDir: path.resolve(dirname),
    },
    user: Users.slug,
    livePreview: {
      breakpoints: [
        {
          label: 'Mobile',
          name: 'mobile',
          width: 375,
          height: 667,
        },
        {
          label: 'Tablet',
          name: 'tablet',
          width: 768,
          height: 1024,
        },
        {
          label: 'Desktop',
          name: 'desktop',
          width: 1440,
          height: 900,
        },
      ],
    },
  },
  // This config helps us configure global or default features that the other editors can inherit
  editor: defaultLexical,
  db: postgresAdapter({
    pool: {
      connectionString: normalizeDatabaseURL(process.env.DATABASE_URL || ''),
    },
    push: !process.env.CI,
  }),
  collections: [
    Pages,
    Posts,
    Media,
    Categories,
    Users,
    CourseCategories,
    CourseFiles,
    Courses,
    Enrollments,
    Comments,
    Likes,
    QuizAttempts,
  ],
  cors: [
    getServerSideURL(),
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '',
  ].filter(Boolean),
  globals: [Header, Footer],
  i18n: {
    fallbackLanguage: 'uk',
    supportedLanguages: { uk, en },
  },
  localization: {
    locales: [
      { label: { uk: 'Українська', en: 'Ukrainian' }, code: 'uk' },
      { label: { uk: 'Англійська', en: 'English' }, code: 'en' },
    ],
    defaultLocale: 'uk',
    fallback: true,
  },
  plugins,
  // Same Resend account Better Auth uses for OTP emails (src/lib/auth/options.ts).
  // Without the key (CI), Payload falls back to logging emails to console.
  email: process.env.RESEND_API_KEY
    ? resendAdapter({
        defaultFromAddress: process.env.EMAIL_FROM || 'onboarding@resend.dev',
        defaultFromName: 'Learning Platform',
        apiKey: process.env.RESEND_API_KEY,
      })
    : undefined,
  secret: process.env.PAYLOAD_SECRET,
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  jobs: {
    access: {
      run: ({ req }: { req: PayloadRequest }): boolean => {
        // Allow logged in users to execute this endpoint (default)
        if (req.user) return true

        const secret = process.env.CRON_SECRET
        if (!secret) return false

        // If there is no logged in user, then check
        // for the Vercel Cron secret to be present as an
        // Authorization header:
        const authHeader = req.headers.get('authorization')
        return authHeader === `Bearer ${secret}`
      },
    },
    tasks: [],
  },
})
