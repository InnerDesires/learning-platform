import type { Metadata } from 'next/types'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import React from 'react'
import type { SiteLocale } from '@/utilities/locales'
import { getFrontendMessages } from '@/utilities/i18n'
import { CourseCatalog } from '@/components/Courses/CourseCatalog'
import { PageHead } from '@/components/brand'
import { getCatalogData } from '@/lib/courses/getCatalogData'

type Args = {
  params: Promise<{ locale: SiteLocale }>
}

export default async function CoursesPage({ params: paramsPromise }: Args) {
  const { locale } = await paramsPromise
  const t = getFrontendMessages(locale)
  const payload = await getPayload({ config: configPromise })

  const [{ courses, courseStats, completedCourseIds, inProgressCourseIds }, categoriesResult] =
    await Promise.all([
      getCatalogData({ payload, locale }),
      payload.find({
        collection: 'course-categories',
        locale,
        limit: 50,
        sort: 'title',
        select: { id: true, title: true },
      }),
    ])

  const categories = categoriesResult.docs.map((c) => ({
    id: c.id,
    title: c.title,
  }))

  return (
    <div className="pb-16">
      <PageHead eyebrow={t.coursesEyebrow} title={t.coursesTitle} sub={t.coursesSub} />
      <div className="container">
        <CourseCatalog
          courses={courses}
          categories={categories}
          completedCourseIds={completedCourseIds}
          inProgressCourseIds={inProgressCourseIds}
          courseStats={courseStats}
          locale={locale}
        />
      </div>
    </div>
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { locale } = await paramsPromise
  const t = getFrontendMessages(locale)
  return { title: t.coursesMetaTitle }
}
