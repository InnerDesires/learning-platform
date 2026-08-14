import type { Metadata } from 'next/types'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import React, { Suspense } from 'react'
import { locales, type SiteLocale } from '@/utilities/locales'
import { getFrontendMessages } from '@/utilities/i18n'
import { CourseCatalog } from '@/components/Courses/CourseCatalog'
import { CategoryCarousels } from '@/components/Courses/CategoryCarousels'
import { PageHead } from '@/components/brand'
import { getCatalogData } from '@/lib/courses/getCatalogData'

export const revalidate = 300

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

type Args = {
  params: Promise<{ locale: SiteLocale }>
}

export default async function CoursesPage({ params: paramsPromise }: Args) {
  const { locale } = await paramsPromise
  const t = getFrontendMessages(locale)
  const payload = await getPayload({ config: configPromise })

  const [{ courses, courseStats }, categoriesResult] = await Promise.all([
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
        {/* No Suspense here: the catalog must be part of the static ISR HTML.
            It reads ?category= from window.location after mount, NOT via
            useSearchParams(), which would bail the grid out of prerendering
            and reintroduce the layout shift on hydration. */}
        <CourseCatalog
          courses={courses}
          categories={categories}
          courseStats={courseStats}
          locale={locale}
        />
        <Suspense fallback={null}>
          <CategoryCarousels
            locale={locale}
            heading={t.courseCollectionsTitle}
            className="mt-16 border-t border-line pt-10"
          />
        </Suspense>
      </div>
    </div>
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { locale } = await paramsPromise
  const t = getFrontendMessages(locale)
  return { title: t.coursesMetaTitle }
}
