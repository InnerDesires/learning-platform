import type { Metadata } from 'next/types'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import React from 'react'
import type { SiteLocale } from '@/utilities/locales'
import { getFrontendMessages } from '@/utilities/i18n'
import { CourseCatalog } from '@/components/Courses/CourseCatalog'
import { getSession } from '@/lib/auth/getSession'

export const revalidate = 600

type Args = {
  params: Promise<{ locale: SiteLocale }>
}

export default async function CoursesPage({ params: paramsPromise }: Args) {
  const { locale } = await paramsPromise
  const t = getFrontendMessages(locale)
  const payload = await getPayload({ config: configPromise })

  const [coursesResult, categoriesResult] = await Promise.all([
    payload.find({
      collection: 'courses',
      locale,
      depth: 1,
      limit: 100,
      sort: '-createdAt',
      where: {
        _status: { equals: 'published' },
      },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        heroImage: true,
        category: true,
        steps: true,
      },
    }),
    payload.find({
      collection: 'course-categories',
      locale,
      limit: 50,
      sort: 'title',
      select: {
        id: true,
        title: true,
      },
    }),
  ])

  let completedCourseIds: number[] = []
  try {
    const session = await getSession()
    if (session?.user) {
      const enrollments = await payload.find({
        collection: 'enrollments',
        where: {
          and: [
            { user: { equals: session.user.id } },
            { status: { equals: 'completed' } },
          ],
        },
        limit: 1000,
        depth: 0,
      })
      completedCourseIds = enrollments.docs.map((e) =>
        typeof e.course === 'object' ? e.course.id : e.course,
      )
    }
  } catch {
    // Session may fail for anonymous users
  }

  const categories = categoriesResult.docs.map((c) => ({
    id: c.id,
    title: c.title,
  }))

  return (
    <div className="pt-24 pb-24">
      <div className="container mb-8">
        <div className="prose max-w-none">
          <h1>{t.coursesTitle}</h1>
        </div>
      </div>
      <div className="container">
        <CourseCatalog
          courses={coursesResult.docs}
          categories={categories}
          completedCourseIds={completedCourseIds}
          locale={locale}
        />
      </div>
    </div>
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { locale } = await paramsPromise
  const t = getFrontendMessages(locale)
  return {
    title: t.coursesMetaTitle,
  }
}
