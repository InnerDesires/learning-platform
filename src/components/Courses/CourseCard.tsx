import Link from 'next/link'
import React from 'react'

import type { Course } from '@/payload-types'
import { Media } from '@/components/Media'
import { cn } from '@/utilities/ui'
import type { SiteLocale } from '@/utilities/locales'
import { getFrontendMessages } from '@/utilities/i18n'

export type CourseCardData = Pick<Course, 'id' | 'slug' | 'title' | 'description' | 'heroImage' | 'category' | 'steps'>

export type CourseStats = {
  enrolledCount: number
  completedCount: number
  likesCount?: number
}

type Props = {
  course: CourseCardData
  locale: SiteLocale
  isCompleted?: boolean
  stats?: CourseStats
  className?: string
}

export const CourseCard: React.FC<Props> = ({ course, locale, isCompleted, stats, className }) => {
  const t = getFrontendMessages(locale)
  const { slug, title, description, heroImage, category, steps } = course
  const categoryTitle = typeof category === 'object' && category ? category.title : null
  const stepsCount = steps?.length ?? 0
  const href = `/courses/${slug}`

  return (
    <article
      className={cn(
        'group rounded-2xl overflow-hidden bg-card border border-border/50 hover:border-border hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5',
        className,
      )}
    >
      <Link href={href} className="block">
        <div className="relative w-full overflow-hidden">
          {heroImage && typeof heroImage === 'object' ? (
            <div className="overflow-hidden aspect-[16/9]">
              <Media
                resource={heroImage}
                size="33vw"
                imgClassName="transition-transform duration-300 group-hover:scale-105 object-cover w-full h-full"
              />
            </div>
          ) : (
            <div className="aspect-[16/9] bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center text-muted-foreground/50 text-sm">
              <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
              </svg>
            </div>
          )}
          {isCompleted && (
            <div className="absolute top-3 right-3 bg-green-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              {t.courseCompleted}
            </div>
          )}
        </div>
        <div className="p-4">
          {categoryTitle && (
            <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded-md bg-primary/10 text-primary mb-2">
              {categoryTitle}
            </span>
          )}
          <h3 className="text-base font-semibold leading-snug group-hover:text-primary transition-colors line-clamp-2">
            {title}
          </h3>
          {description && (
            <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2">{description}</p>
          )}
          <div className="mt-3 pt-3 border-t border-border/50 flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <line x1="9" y1="3" x2="9" y2="21" />
              </svg>
              {stepsCount} {t.courseStepsCount}
            </span>
            {stats && stats.enrolledCount > 0 && (
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                {stats.enrolledCount} {t.courseEnrolledCount}
              </span>
            )}
            {stats && stats.likesCount != null && stats.likesCount > 0 && (
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
                {stats.likesCount} {t.likesCount}
              </span>
            )}
          </div>
        </div>
      </Link>
    </article>
  )
}
