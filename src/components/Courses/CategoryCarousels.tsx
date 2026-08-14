import configPromise from '@payload-config'
import { getPayload } from 'payload'
import Link from 'next/link'
import React from 'react'
import { ArrowRight } from 'lucide-react'
import { CourseCard, type CourseCardData } from './CourseCard'
import { Eyebrow } from '@/components/brand'
import type { SiteLocale } from '@/utilities/locales'
import { getFrontendMessages } from '@/utilities/i18n'

const COURSES_PER_CAROUSEL = 5

type CategoryGroup = {
  id: number
  title: string
  slug: string
  courses: CourseCardData[]
}

export async function CategoryCarousels({
  locale,
  count = 3,
  heading,
  className,
}: {
  locale: SiteLocale
  count?: number
  heading?: string
  className?: string
}) {
  const payload = await getPayload({ config: configPromise })
  const { docs } = await payload.find({
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
  })

  const groups = new Map<number, CategoryGroup>()
  for (const course of docs) {
    if (!course.category || typeof course.category !== 'object') continue
    const { id, title, slug } = course.category
    if (!slug) continue
    if (!groups.has(id)) groups.set(id, { id, title, slug, courses: [] })
    groups.get(id)!.courses.push(course)
  }

  const shuffled = [...groups.values()]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!]
  }
  const picked = shuffled.slice(0, count)
  if (picked.length === 0) return null

  const t = getFrontendMessages(locale)
  const prefix = locale === 'en' ? '/en' : ''

  return (
    <div className={className}>
      {heading && <Eyebrow className="mb-6 block">{heading}</Eyebrow>}
      <div className="space-y-10">
        {picked.map((cat) => {
          const categoryHref = `${prefix}/courses/category/${cat.slug}`
          const visibleCourses = cat.courses.slice(0, COURSES_PER_CAROUSEL)
          const hasMore = cat.courses.length > COURSES_PER_CAROUSEL
          return (
            <section key={cat.id}>
              <Link
                href={categoryHref}
                className="group mb-4 inline-flex items-center gap-2.5 transition-colors hover:text-amber"
              >
                <h3 className="heading-display text-[clamp(17px,2.2vw,22px)]">{cat.title}</h3>
                <ArrowRight className="h-4 w-4 flex-none text-orange transition-transform group-hover:translate-x-1" />
              </Link>
              <div className="no-scrollbar -mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-1 md:-mx-8 md:px-8">
                {visibleCourses.map((course) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    locale={locale}
                    className="w-[248px] flex-none snap-start sm:w-[276px]"
                  />
                ))}
                {hasMore && (
                  <Link
                    href={categoryHref}
                    className="flex w-[170px] flex-none snap-start flex-col items-center justify-center gap-2.5 rounded-[14px] border-[1.5px] border-dashed border-line-2 px-4 text-center font-display text-xs font-semibold uppercase tracking-[0.1em] text-fog transition-colors hover:border-orange hover:text-orange"
                  >
                    {t.categorySeeAll}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
