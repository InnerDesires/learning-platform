import type { Metadata } from 'next/types'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import React from 'react'
import type { SiteLocale } from '@/utilities/locales'
import { getFrontendMessages } from '@/utilities/i18n'
import { CourseCatalog } from '@/components/Courses/CourseCatalog'
import { getSession } from '@/lib/auth/getSession'
import type { CourseStats } from '@/components/Courses/CourseCard'
import { getLikesCountsBatch } from '@/actions/commentsAndLikes'

type Args = {
  params: Promise<{ locale: SiteLocale }>
}

export default async function CoursesPage({ params: paramsPromise }: Args) {
  const { locale } = await paramsPromise
  const t = getFrontendMessages(locale)
  const payload = await getPayload({ config: configPromise })

  const [coursesResult, categoriesResult, session] = await Promise.all([
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
      },
    }),
    payload.find({
      collection: 'course-categories',
      locale,
      limit: 50,
      sort: 'title',
      select: { id: true, title: true },
    }),
    getSession().catch(() => null),
  ])

  const courseIds = coursesResult.docs.map((c) => c.id)
  const courseStats: Record<number, CourseStats> = {}

  const [allEnrollmentsResult, userCompletedResult, userInProgressResult, courseLikesCounts] = await Promise.all([
    courseIds.length > 0
      ? payload.find({
          collection: 'enrollments',
          where: { course: { in: courseIds } },
          limit: 10000,
          depth: 0,
          select: { course: true, status: true },
        })
      : Promise.resolve({ docs: [] }),
    session?.user
      ? payload.find({
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
      : Promise.resolve({ docs: [] }),
    session?.user
      ? payload.find({
          collection: 'enrollments',
          where: {
            and: [
              { user: { equals: session.user.id } },
              { status: { in: ['enrolled', 'in_progress'] } },
            ],
          },
          limit: 1000,
          depth: 0,
        })
      : Promise.resolve({ docs: [] }),
    getLikesCountsBatch('courses', courseIds),
  ])

  for (const enrollment of allEnrollmentsResult.docs) {
    const cid = typeof enrollment.course === 'object' ? enrollment.course.id : enrollment.course
    if (!courseStats[cid]) courseStats[cid] = { enrolledCount: 0, completedCount: 0 }
    courseStats[cid].enrolledCount++
    if (enrollment.status === 'completed') courseStats[cid].completedCount++
  }

  for (const [cidStr, count] of Object.entries(courseLikesCounts)) {
    const cid = Number(cidStr)
    if (!courseStats[cid]) courseStats[cid] = { enrolledCount: 0, completedCount: 0 }
    courseStats[cid].likesCount = count
  }

  const completedCourseIds = userCompletedResult.docs.map((e) =>
    typeof e.course === 'object' ? e.course.id : e.course,
  )

  const inProgressCourseIds = userInProgressResult.docs.map((e) =>
    typeof e.course === 'object' ? e.course.id : e.course,
  )

  const categories = categoriesResult.docs.map((c) => ({
    id: c.id,
    title: c.title,
  }))

  return (
    <div className="pt-16 pb-16">
      <div className="container mb-6">
        <h1 className="text-3xl font-bold tracking-tight">{t.coursesTitle}</h1>
      </div>
      <div className="container">
        <CourseCatalog
          courses={coursesResult.docs}
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
