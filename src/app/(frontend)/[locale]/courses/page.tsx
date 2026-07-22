import type { Metadata } from 'next/types'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import React, { Suspense } from 'react'
import { locales, type SiteLocale } from '@/utilities/locales'
import { getFrontendMessages } from '@/utilities/i18n'
import { CourseCatalog } from '@/components/Courses/CourseCatalog'
import { PageHead } from '@/components/brand'
import type { CourseStats } from '@/components/Courses/CourseCard'
import {
  getCachedCommentsCounts,
  getCachedEnrollmentStats,
  getCachedLikesCounts,
} from '@/utilities/contentCounts'

// The catalog is the same for everyone — per-user progress badges are fetched
// client-side (getMyCourseStatuses), so this page can be served from the ISR cache.
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

  const [coursesResult, categoriesResult, enrollmentStats, courseLikesCounts, courseCommentsCounts] =
    await Promise.all([
      payload.find({
        collection: 'courses',
        locale,
        depth: 1,
        limit: 100,
        sort: '-createdAt',
        where: { _status: { equals: 'published' } },
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          heroImage: true,
          category: true,
          steps: true,
          quiz: true,
        },
      }),
      payload.find({
        collection: 'course-categories',
        locale,
        limit: 50,
        sort: 'title',
        select: { id: true, title: true },
      }),
      getCachedEnrollmentStats(),
      getCachedLikesCounts('courses'),
      getCachedCommentsCounts('courses'),
    ])

  const courseStats: Record<number, CourseStats> = {}
  const statFor = (cid: number): CourseStats => {
    if (!courseStats[cid]) courseStats[cid] = { enrolledCount: 0, completedCount: 0 }
    return courseStats[cid]
  }

  for (const [cidStr, stats] of Object.entries(enrollmentStats)) {
    const stat = statFor(Number(cidStr))
    stat.enrolledCount = stats.enrolledCount
    stat.completedCount = stats.completedCount
  }

  for (const [cidStr, count] of Object.entries(courseLikesCounts)) {
    statFor(Number(cidStr)).likesCount = count
  }

  for (const [cidStr, count] of Object.entries(courseCommentsCounts)) {
    statFor(Number(cidStr)).commentsCount = count
  }

  const categories = categoriesResult.docs.map((c) => ({
    id: c.id,
    title: c.title,
  }))

  return (
    <div className="pb-16">
      <PageHead eyebrow={t.coursesEyebrow} title={t.coursesTitle} sub={t.coursesSub} />
      <div className="container">
        {/* Suspense: CourseCatalog reads ?category= via useSearchParams, which
            must not block static prerendering of the rest of the page. */}
        <Suspense>
          <CourseCatalog
            courses={coursesResult.docs}
            categories={categories}
            courseStats={courseStats}
            locale={locale}
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
