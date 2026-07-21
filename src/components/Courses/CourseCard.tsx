import Link from 'next/link'
import React from 'react'
import { Check, Heart, MessageCircle, Rows3, Users } from 'lucide-react'

import type { Course } from '@/payload-types'
import { Media } from '@/components/Media'
import { cn } from '@/utilities/ui'
import type { SiteLocale } from '@/utilities/locales'
import { getFrontendMessages } from '@/utilities/i18n'
import { XpChip } from '@/components/brand'
import { courseXp } from '@/utilities/xp'
import { plural } from '@/utilities/plural'

export type CourseCardData = Pick<
  Course,
  'id' | 'slug' | 'title' | 'description' | 'heroImage' | 'category' | 'steps'
> &
  Partial<Pick<Course, 'quiz'>>

export type CourseStats = {
  enrolledCount: number
  completedCount: number
  likesCount?: number
  commentsCount?: number
}

type Props = {
  course: CourseCardData
  locale: SiteLocale
  isCompleted?: boolean
  isInProgress?: boolean
  stats?: CourseStats
  className?: string
}

// Fallback covers extracted from the approved design prototype.
const FALLBACK_COVERS = [
  '/illustrations/course-leadership.svg',
  '/illustrations/course-first-aid.svg',
  '/illustrations/course-media-literacy.svg',
  '/illustrations/course-railway-safety.svg',
  '/illustrations/course-photo-video.svg',
  '/illustrations/course-public-speaking.svg',
]

export const CourseCard: React.FC<Props> = ({
  course,
  locale,
  isCompleted,
  isInProgress,
  stats,
  className,
}) => {
  const t = getFrontendMessages(locale)
  const { id, slug, title, description, heroImage, category, steps } = course
  const categoryTitle = typeof category === 'object' && category ? category.title : null
  const stepsCount = steps?.length ?? 0
  const prefix = locale === 'en' ? '/en' : ''
  const href = `${prefix}/courses/${slug}`
  const fallbackCover = FALLBACK_COVERS[Math.abs(Number(id) || 0) % FALLBACK_COVERS.length]

  return (
    <article
      className={cn(
        'group flex flex-col overflow-hidden rounded-[14px] border border-line bg-card transition-all duration-200 hover:-translate-y-1 hover:border-orange/60 hover:shadow-[0_18px_40px_-22px_rgba(0,0,0,0.8)]',
        className,
      )}
    >
      <Link href={href} className="flex flex-1 flex-col">
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-ink">
          {heroImage && typeof heroImage === 'object' ? (
            <Media
              resource={heroImage}
              size="33vw"
              imgClassName="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.045]"
            />
          ) : (
            <img
              src={fallbackCover}
              alt=""
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.045]"
              loading="lazy"
            />
          )}
          {isCompleted && (
            <span className="absolute right-3 top-3 z-[2] flex items-center gap-1 rounded-full bg-success px-2.5 py-1 font-display text-[10px] font-semibold uppercase tracking-[0.12em] text-[#08130C]">
              <Check className="h-2.5 w-2.5" strokeWidth={4} />
              {t.courseCompleted}
            </span>
          )}
          {!isCompleted && isInProgress && (
            <span className="absolute right-3 top-3 z-[2] rounded-full bg-orange px-2.5 py-1 font-display text-[10px] font-semibold uppercase tracking-[0.12em] text-[#1B1204]">
              {t.courseInProgress}
            </span>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-2 p-5">
          {categoryTitle && (
            <span className="chip self-start">{categoryTitle}</span>
          )}
          <h3 className="text-[15.5px] font-bold leading-[1.35] transition-colors group-hover:text-amber">
            {title}
          </h3>
          {description && (
            <p className="line-clamp-2 text-[12.5px] leading-relaxed text-fog">{description}</p>
          )}
          {/* single line always: lower-priority chips hide as the card narrows */}
          <div className="@container mt-auto flex flex-nowrap items-center gap-3.5 overflow-hidden whitespace-nowrap border-t border-line pt-3 text-[11.5px] font-semibold text-fog">
            <span className="num flex flex-none items-center gap-1.5">
              <Rows3 className="h-3.5 w-3.5 flex-none" />
              {stepsCount} {plural(locale, stepsCount, t.courseStepsPlural)}
            </span>
            {stats && stats.enrolledCount > 0 && (
              <span className="num flex flex-none items-center gap-1.5 @max-[240px]:hidden">
                <Users className="h-3.5 w-3.5 flex-none" />
                {stats.enrolledCount}
              </span>
            )}
            {stats && stats.likesCount != null && stats.likesCount > 0 && (
              <span className="num flex flex-none items-center gap-1.5 @max-[290px]:hidden">
                <Heart className="h-3.5 w-3.5 flex-none" fill="currentColor" strokeWidth={0} />
                {stats.likesCount}
              </span>
            )}
            {stats && stats.commentsCount != null && stats.commentsCount > 0 && (
              <span className="num flex flex-none items-center gap-1.5 @max-[340px]:hidden">
                <MessageCircle className="h-3.5 w-3.5 flex-none" />
                {stats.commentsCount}
              </span>
            )}
            <XpChip xp={courseXp(stepsCount, !!course.quiz?.enabled)} className="ml-auto flex-none" />
          </div>
        </div>
      </Link>
    </article>
  )
}
