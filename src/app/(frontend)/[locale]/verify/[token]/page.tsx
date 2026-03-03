import type { Metadata } from 'next'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { verifyCertificateToken } from '@/utilities/certificateToken'
import { getFrontendMessages } from '@/utilities/i18n'
import type { SiteLocale } from '@/utilities/locales'
import type { Course, User } from '@/payload-types'

type Args = {
  params: Promise<{ locale: SiteLocale; token: string }>
}

export default async function VerifyPage({ params }: Args) {
  const { locale, token } = await params
  const t = getFrontendMessages(locale)

  const result = verifyCertificateToken(token)

  if (!result.valid) {
    return (
      <div className="container max-w-xl py-24 text-center">
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-12">
          <svg
            className="w-16 h-16 mx-auto text-destructive mb-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M15 9l-6 6" />
            <path d="M9 9l6 6" />
          </svg>
          <h1 className="text-2xl font-bold tracking-tight mb-3">{t.verifyInvalid}</h1>
          <p className="text-muted-foreground">{t.verifyInvalidDescription}</p>
        </div>
      </div>
    )
  }

  const payload = await getPayload({ config: configPromise })

  let enrollment
  try {
    enrollment = await payload.findByID({
      collection: 'enrollments',
      id: result.enrollmentId,
      depth: 0,
    })
  } catch {
    enrollment = null
  }

  if (!enrollment || enrollment.status !== 'completed') {
    return (
      <div className="container max-w-xl py-24 text-center">
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-12">
          <svg
            className="w-16 h-16 mx-auto text-destructive mb-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M15 9l-6 6" />
            <path d="M9 9l6 6" />
          </svg>
          <h1 className="text-2xl font-bold tracking-tight mb-3">{t.verifyInvalid}</h1>
          <p className="text-muted-foreground">{t.verifyInvalidDescription}</p>
        </div>
      </div>
    )
  }

  const courseId = typeof enrollment.course === 'number' ? enrollment.course : enrollment.course?.id
  const userId = typeof enrollment.user === 'number' ? enrollment.user : enrollment.user?.id

  let course: Course | null = null
  let user: User | null = null

  try {
    if (courseId) {
      course = (await payload.findByID({
        collection: 'courses',
        id: courseId,
        locale,
        depth: 0,
      })) as Course
    }
  } catch {
    course = null
  }

  try {
    if (userId) {
      user = (await payload.findByID({
        collection: 'users',
        id: userId,
        depth: 0,
      })) as User
    }
  } catch {
    user = null
  }

  const userName = user?.name || user?.email || 'Unknown'
  const courseTitle = course?.title || 'Unknown Course'
  const completedAt = enrollment.completedAt
    ? new Date(enrollment.completedAt)
    : new Date(enrollment.updatedAt)

  const formattedDate = completedAt.toLocaleDateString(locale === 'uk' ? 'uk-UA' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const certIdDisplay = token.slice(0, token.indexOf('.')).replace(/[^a-zA-Z0-9]/g, '').slice(0, 12).toUpperCase()

  return (
    <div className="container max-w-xl py-24">
      <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-12 text-center">
        <svg
          className="w-16 h-16 mx-auto text-green-600 mb-6"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M9 12l2 2 4-4" />
        </svg>
        <h1 className="text-2xl font-bold tracking-tight mb-2">{t.verifyValid}</h1>
        <p className="text-muted-foreground mb-8">{t.verifyValidDescription}</p>

        <div className="text-left space-y-4 bg-background rounded-lg border p-6">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">{t.verifyRecipient}</p>
            <p className="text-lg font-semibold">{userName}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">{t.verifyCourse}</p>
            <p className="text-lg font-semibold">{courseTitle}</p>
          </div>
          <div className="flex gap-8">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">{t.verifyDate}</p>
              <p className="font-medium">{formattedDate}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">{t.verifyCertId}</p>
              <p className="font-medium font-mono">CERT-{certIdDisplay}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { locale } = await params
  return {
    title: getFrontendMessages(locale).verifyMetaTitle,
  }
}
