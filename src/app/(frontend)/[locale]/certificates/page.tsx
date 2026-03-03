import type { Metadata } from 'next'
import Link from 'next/link'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { requireSession } from '@/lib/auth/requireSession'
import { getFrontendMessages } from '@/utilities/i18n'
import { defaultLocale, type SiteLocale } from '@/utilities/locales'
import { Button } from '@/components/ui/button'
import type { Course } from '@/payload-types'

type Args = {
  params: Promise<{ locale: SiteLocale }>
}

export default async function CertificatesPage({ params }: Args) {
  const { locale } = await params
  const certificatesPath = locale === defaultLocale ? '/certificates' : `/${locale}/certificates`
  const session = await requireSession(locale, certificatesPath)
  const t = getFrontendMessages(locale)

  const payload = await getPayload({ config: configPromise })

  const enrollments = await payload.find({
    collection: 'enrollments',
    where: {
      and: [
        { user: { equals: session.user.id } },
        { status: { equals: 'completed' } },
      ],
    },
    sort: '-completedAt',
    depth: 1,
    limit: 100,
  })

  return (
    <div className="container max-w-5xl py-16">
      <h1 className="text-3xl font-bold tracking-tight mb-8">{t.certificatesPageTitle}</h1>

      {enrollments.docs.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center">
          <svg
            className="w-16 h-16 mx-auto text-muted-foreground/40 mb-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <rect x="3" y="4" width="18" height="16" rx="2" />
            <path d="M7 8h10" />
            <path d="M7 12h6" />
            <circle cx="16" cy="16" r="3" />
            <path d="M16 14v4" />
            <path d="M14 16h4" />
          </svg>
          <p className="text-muted-foreground">{t.certificateNoCertificates}</p>
          <Link href="/courses" className="mt-4 inline-block">
            <Button variant="outline">{t.coursesTitle}</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {enrollments.docs.map((enrollment) => {
            const course = enrollment.course as Course
            if (!course || typeof course === 'number') return null

            const completedAt = enrollment.completedAt
              ? new Date(enrollment.completedAt)
              : new Date(enrollment.updatedAt)

            const formattedDate = completedAt.toLocaleDateString(
              locale === 'uk' ? 'uk-UA' : 'en-US',
              { year: 'numeric', month: 'long', day: 'numeric' },
            )

            return (
              <div
                key={enrollment.id}
                className="rounded-xl border bg-card p-6 flex flex-col sm:flex-row sm:items-center gap-4"
              >
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/courses/${course.slug}`}
                    className="text-lg font-semibold hover:underline"
                  >
                    {course.title}
                  </Link>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t.certificateCompletedOn} {formattedDate}
                  </p>
                </div>
                <a href={`/courses/${course.slug}/certificate`} download>
                  <Button variant="outline" className="shrink-0">
                    <svg
                      className="w-4 h-4 mr-2"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    {t.certificateDownload}
                  </Button>
                </a>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { locale } = await params
  return {
    title: getFrontendMessages(locale).certificatesMetaTitle,
  }
}
