'use client'
import { cn } from '@/utilities/ui'
import useClickableCard from '@/utilities/useClickableCard'
import Link from 'next/link'
import React from 'react'
import { Heart } from 'lucide-react'

import type { Post } from '@/payload-types'
import type { SiteLocale } from '@/utilities/locales'

import { Media } from '@/components/Media'
import { getFrontendMessages, getLocaleFromPathname } from '@/utilities/i18n'
import { usePathname } from 'next/navigation'

export type CardRelationTo = 'posts' | 'courses' | 'course-categories'

export type CardPostData = Pick<Post, 'id' | 'slug' | 'categories' | 'meta' | 'title'> & {
  collectionType?: string | null
}

// Fallback covers extracted from the approved design prototype.
const FALLBACK_COVERS = [
  '/illustrations/post-shift-recap.svg',
  '/illustrations/post-enrollment.svg',
  '/illustrations/post-achievement.svg',
  '/illustrations/post-first-aid-training.svg',
  '/illustrations/post-depot-excursion.svg',
  '/illustrations/post-story.svg',
]

export const Card: React.FC<{
  alignItems?: 'center'
  className?: string
  doc?: CardPostData
  locale?: SiteLocale
  relationTo?: CardRelationTo
  showCategories?: boolean
  title?: string
  likesCount?: number
}> = (props) => {
  const { card, link } = useClickableCard({})
  const pathname = usePathname()
  const localeFromPath = getLocaleFromPathname(pathname)
  const { className, doc, locale, relationTo, showCategories, title: titleFromProps, likesCount } = props
  const t = getFrontendMessages(locale || localeFromPath)

  const { id, slug, categories, meta, title } = doc || {}
  const { description, image: metaImage } = meta || {}

  const hasCategories = categories && Array.isArray(categories) && categories.length > 0
  const titleToUse = titleFromProps || title
  const sanitizedDescription = description?.replace(/\s/g, ' ')
  const effectiveRelationTo = (doc?.collectionType as CardRelationTo) || relationTo
  const prefix = (locale || localeFromPath) === 'en' ? '/en' : ''
  const href =
    effectiveRelationTo === 'course-categories'
      ? `${prefix}/courses`
      : `${prefix}/${effectiveRelationTo}/${slug}`
  const fallbackCover = FALLBACK_COVERS[Math.abs(Number(id) || 0) % FALLBACK_COVERS.length]

  return (
    <article
      className={cn(
        'group flex cursor-pointer flex-col overflow-hidden rounded-[14px] border border-line bg-card transition-all duration-200 hover:-translate-y-1 hover:border-orange/60 hover:shadow-[0_18px_40px_-22px_rgba(0,0,0,0.8)]',
        className,
      )}
      ref={card.ref}
    >
      <div className="relative aspect-video w-full overflow-hidden bg-ink">
        {metaImage && typeof metaImage !== 'string' ? (
          <Media
            resource={metaImage}
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
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        {showCategories && hasCategories && (
          <div className="flex flex-wrap gap-1.5">
            {categories?.map((category, index) => {
              if (typeof category === 'object') {
                return (
                  <span key={index} className="chip">
                    {category.title || t.untitledCategory}
                  </span>
                )
              }
              return null
            })}
          </div>
        )}
        {titleToUse && (
          <h3 className="text-[15.5px] font-bold leading-[1.35]">
            <Link
              className="transition-colors group-hover:text-amber"
              href={href}
              ref={link.ref}
            >
              {titleToUse}
            </Link>
          </h3>
        )}
        {description && (
          <p className="line-clamp-2 text-[12.5px] leading-relaxed text-fog">
            {sanitizedDescription}
          </p>
        )}
        {likesCount != null && likesCount > 0 && (
          <div className="mt-auto flex items-center gap-3.5 border-t border-line pt-3 text-[11.5px] font-semibold text-fog">
            <span className="num flex items-center gap-1.5">
              <Heart className="h-3.5 w-3.5" fill="currentColor" strokeWidth={0} />
              {likesCount}
            </span>
          </div>
        )}
      </div>
    </article>
  )
}
