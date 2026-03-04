'use client'

import React, { useState, useMemo } from 'react'
import { CourseCard, type CourseCardData, type CourseStats } from './CourseCard'
import { CategoryFilter } from './CategoryFilter'
import type { SiteLocale } from '@/utilities/locales'
import { getFrontendMessages } from '@/utilities/i18n'

type Category = {
  id: number
  title: string
}

type Props = {
  courses: CourseCardData[]
  categories: Category[]
  completedCourseIds: number[]
  inProgressCourseIds: number[]
  courseStats: Record<number, CourseStats>
  locale: SiteLocale
}

export const CourseCatalog: React.FC<Props> = ({ courses, categories, completedCourseIds, inProgressCourseIds, courseStats, locale }) => {
  const t = getFrontendMessages(locale)
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)

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
            onSelect={setSelectedCategory}
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
            isCompleted={completedCourseIds.includes(course.id)}
            isInProgress={inProgressCourseIds.includes(course.id)}
            stats={courseStats[course.id]}
            className="h-full"
          />
        ))}
      </div>
      {filteredCourses.length === 0 && (
        <p className="text-center text-muted-foreground py-12">
          {t.searchNoResults}
        </p>
      )}
    </div>
  )
}
