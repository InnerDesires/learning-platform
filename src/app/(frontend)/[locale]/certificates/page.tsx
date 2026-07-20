import type { Metadata } from 'next'
import Link from 'next/link'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { requireSession } from '@/lib/auth/requireSession'
import { getFrontendMessages } from '@/utilities/i18n'
import { defaultLocale, type SiteLocale } from '@/utilities/locales'
import { Button } from '@/components/ui/button'
import { PageHead } from '@/components/brand'
import { Award, Download } from 'lucide-react'
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

  const prefix = locale === defaultLocale ? '' : `/${locale}`

  return (
    <div className="pb-16">
      <PageHead title={t.certificatesPageTitle} className="max-w-5xl !pb-8" />
      <div className="container max-w-5xl">

      {enrollments.docs.length === 0 ? (
        <div className="rounded-2xl border border-line bg-card p-12 text-center">
          <Award className="mx-auto mb-4 h-16 w-16 text-steel-dim" strokeWidth={1.2} />
          <p className="text-fog">{t.certificateNoCertificates}</p>
          <Link href={`${prefix}/courses`} className="mt-5 inline-block">
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
                className="flex flex-col gap-4 rounded-2xl border border-line bg-card p-6 transition-colors hover:border-orange/55 sm:flex-row sm:items-center"
              >
                <span className="grid h-11 w-11 flex-none place-items-center rounded-full bg-orange/14">
                  <Award className="h-5 w-5 text-orange" />
                </span>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`${prefix}/courses/${course.slug}`}
                    className="text-lg font-bold transition-colors hover:text-amber"
                  >
                    {course.title}
                  </Link>
                  <p className="num mt-1 text-sm text-fog">
                    {t.certificateCompletedOn} {formattedDate}
                  </p>
                </div>
                <a href={`/courses/${course.slug}/certificate`} download>
                  <Button variant="outline" className="shrink-0">
                    <Download className="mr-2 h-4 w-4" />
                    {t.certificateDownload}
                  </Button>
                </a>
              </div>
            )
          })}
        </div>
      )}
      </div>
    </div>
  )
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { locale } = await params
  return {
    title: getFrontendMessages(locale).certificatesMetaTitle,
  }
}
