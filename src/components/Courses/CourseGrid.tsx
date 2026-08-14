'use client'

import React from 'react'
import { CourseCard, type CourseCardData, type CourseStats } from './CourseCard'
import type { SiteLocale } from '@/utilities/locales'
import { useMyCourseStatuses } from './useMyCourseStatuses'

type Props = {
  courses: CourseCardData[]
  courseStats: Record<number, CourseStats>
  locale: SiteLocale
  className?: string
}

export const CourseGrid: React.FC<Props> = ({ courses, courseStats, locale, className }) => {
  const myStatuses = useMyCourseStatuses()

  return (
    <div
      className={
        className ?? 'grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
      }
    >
      {courses.map((course, index) => (
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
  )
}
