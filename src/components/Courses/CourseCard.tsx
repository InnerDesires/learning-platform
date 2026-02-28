import Link from 'next/link'
import React from 'react'

import type { Course } from '@/payload-types'
import { Media } from '@/components/Media'
import { cn } from '@/utilities/ui'
import type { SiteLocale } from '@/utilities/locales'
import { getFrontendMessages } from '@/utilities/i18n'

export type CourseCardData = Pick<Course, 'id' | 'slug' | 'title' | 'description' | 'heroImage' | 'category' | 'steps'>

type Props = {
  course: CourseCardData
  locale: SiteLocale
  isCompleted?: boolean
  className?: string
}

export const CourseCard: React.FC<Props> = ({ course, locale, isCompleted, className }) => {
  const t = getFrontendMessages(locale)
  const { slug, title, description, heroImage, category, steps } = course
  const categoryTitle = typeof category === 'object' && category ? category.title : null
  const stepsCount = steps?.length ?? 0
  const href = `/courses/${slug}`

  return (
    <article
      className={cn(
        'group rounded-2xl overflow-hidden bg-card shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1',
        className,
      )}
    >
      <Link href={href} className="block">
        <div className="relative w-full overflow-hidden">
          {heroImage && typeof heroImage === 'object' ? (
            <div className="overflow-hidden">
              <Media
                resource={heroImage}
                size="33vw"
                imgClassName="transition-transform duration-300 group-hover:scale-105"
              />
            </div>
          ) : (
            <div className="aspect-video bg-secondary flex items-center justify-center text-muted-foreground text-sm">
              {t.cardNoImage}
            </div>
          )}
          {isCompleted && (
            <div className="absolute top-3 right-3 bg-green-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
              {t.courseCompleted}
            </div>
          )}
        </div>
        <div className="p-5">
          {categoryTitle && (
            <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary mb-3">
              {categoryTitle}
            </span>
          )}
          <h3 className="text-lg font-semibold leading-snug hover:text-primary transition-colors">
            {title}
          </h3>
          {description && (
            <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{description}</p>
          )}
          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <span>{stepsCount} {t.courseStepsCount}</span>
          </div>
        </div>
      </Link>
    </article>
  )
}
