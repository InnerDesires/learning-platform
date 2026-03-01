import { NextRequest } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { getSession } from '@/lib/auth/getSession'
import { getFrontendMessages } from '@/utilities/i18n'
import type { SiteLocale } from '@/utilities/locales'
import type { Course, User } from '@/payload-types'
import { renderCertificatePdf } from './pdf'

export async function GET(
  _request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ locale: SiteLocale; slug: string }> },
) {
  const { locale, slug } = await paramsPromise
  const t = getFrontendMessages(locale)

  const session = await getSession().catch(() => null)
  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const payload = await getPayload({ config: configPromise })

  const courseResult = await payload.find({
    collection: 'courses',
    locale,
    where: {
      slug: { equals: slug },
      _status: { equals: 'published' },
    },
    limit: 1,
    depth: 0,
  })

  const course = courseResult.docs[0] as Course | undefined
  if (!course) {
    return new Response('Course not found', { status: 404 })
  }

  const enrollmentResult = await payload.find({
    collection: 'enrollments',
    where: {
      and: [
        { user: { equals: session.user.id } },
        { course: { equals: course.id } },
        { status: { equals: 'completed' } },
      ],
    },
    limit: 1,
    depth: 0,
  })

  const enrollment = enrollmentResult.docs[0]
  if (!enrollment) {
    return new Response('No completed enrollment found', { status: 403 })
  }

  const userRecord = await payload.findByID({
    collection: 'users',
    id: Number(session.user.id),
    depth: 0,
  }) as User

  const userName = userRecord.name || session.user.name || session.user.email || 'Unknown'
  const completedAt = enrollment.completedAt
    ? new Date(enrollment.completedAt)
    : new Date(enrollment.updatedAt)

  const formattedDate = completedAt.toLocaleDateString(locale === 'uk' ? 'uk-UA' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const certId = `CERT-${enrollment.id}`

  const pdfBuffer = await renderCertificatePdf({
    platformName: t.certificatePlatformName,
    title: t.certificateTitle,
    presented: t.certificatePresented,
    userName,
    forText: t.certificateFor,
    courseTitle: course.title,
    dateLabel: t.certificateDateLabel,
    formattedDate,
    certIdLabel: t.certificateCertId,
    certId,
  })

  return new Response(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="certificate-${slug}.pdf"`,
      'Cache-Control': 'no-store',
    },
  })
}
