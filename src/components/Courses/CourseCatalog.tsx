'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { CourseCard, type CourseCardData, type CourseStats } from './CourseCard'
import { CategoryFilter } from './CategoryFilter'
import type { SiteLocale } from '@/utilities/locales'
import { getFrontendMessages } from '@/utilities/i18n'
import { useSession } from '@/lib/auth/client'
import { getMyCourseStatuses, type MyCourseStatuses } from '@/app/(frontend)/[locale]/courses/actions'

type Category = {
  id: number
  title: string
}

type Props = {
  courses: CourseCardData[]
  categories: Category[]
  courseStats: Record<number, CourseStats>
  locale: SiteLocale
}

const NO_STATUSES: MyCourseStatuses = { completed: [], inProgress: [] }

export const CourseCatalog: React.FC<Props> = ({ courses, categories, courseStats, locale }) => {
  const t = getFrontendMessages(locale)
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Per-user progress badges load after hydration so the page itself can be
  // served from the shared ISR cache. Guests never trigger the request.
  const { data: session } = useSession()
  const [myStatuses, setMyStatuses] = useState<MyCourseStatuses>(NO_STATUSES)
  useEffect(() => {
    if (!session?.user) {
      setMyStatuses(NO_STATUSES)
      return
    }
    let cancelled = false
    getMyCourseStatuses()
      .then((statuses) => {
        if (!cancelled) setMyStatuses(statuses)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [session?.user])

  // The active filter lives in ?category= so filtered views can be shared,
  // bookmarked, and deep-linked from search results.
  const categoryParam = Number(searchParams.get('category'))
  const initialCategory =
    Number.isInteger(categoryParam) && categories.some((c) => c.id === categoryParam)
      ? categoryParam
      : null
  const [selectedCategory, setSelectedCategory] = useState<number | null>(initialCategory)

  const handleSelect = useCallback(
    (categoryId: number | null) => {
      setSelectedCategory(categoryId)
      const params = new URLSearchParams(searchParams.toString())
      if (categoryId === null) {
        params.delete('category')
      } else {
        params.set('category', String(categoryId))
      }
      const qs = params.toString()
      router.replace(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false })
    },
    [router, pathname, searchParams],
  )

  const filteredCourses = useMemo(() => {
    if (selectedCategory === null) return courses
    return courses.filter((course) => {
      const catId = typeof course.category === 'object' && course.category ? course.category.id : course.category
      return catId === selectedCategory
    })
  }, [courses, selectedCategory])

  return (
    <div>
      {categories.length > 0 && (
        <div className="mb-6">
          <CategoryFilter
            categories={categories}
            selectedCategory={selectedCategory}
            onSelect={handleSelect}
            allLabel={t.coursesAllCategories}
          />
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filteredCourses.map((course, index) => (
          <CourseCard
            key={course.slug || index}
            course={course}
            locale={locale}
            isCompleted={myStatuses.completed.includes(course.id)}
            isInProgress={myStatuses.inProgress.includes(course.id)}
            stats={courseStats[course.id]}
            className="h-full"
          />
        ))}
      </div>
      {filteredCourses.length === 0 && (
        <div className="py-12 text-center">
          <p className="text-muted-foreground">{t.searchNoResults}</p>
          <button
            type="button"
            onClick={() => handleSelect(null)}
            className="mt-4 inline-flex items-center rounded-full border-[1.5px] border-line-2 px-5 py-2 font-display text-xs font-semibold uppercase tracking-[0.1em] text-cloud transition-colors hover:border-orange hover:text-orange"
          >
            {t.coursesResetFilter}
          </button>
        </div>
      )}
    </div>
  )
}
