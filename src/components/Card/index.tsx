'use client'
import { cn } from '@/utilities/ui'
import useClickableCard from '@/utilities/useClickableCard'
import Link from 'next/link'
import React, { Fragment } from 'react'

import type { Post } from '@/payload-types'
import type { SiteLocale } from '@/utilities/locales'

import { Media } from '@/components/Media'
import { getFrontendMessages, getLocaleFromPathname } from '@/utilities/i18n'
import { usePathname } from 'next/navigation'

export type CardRelationTo = 'posts' | 'courses' | 'course-categories'

export type CardPostData = Pick<Post, 'slug' | 'categories' | 'meta' | 'title'> & {
  collectionType?: string | null
}
export type CardPostData = Pick<Post, 'id' | 'slug' | 'categories' | 'meta' | 'title'>

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

  const { slug, categories, meta, title } = doc || {}
  const { description, image: metaImage } = meta || {}

  const hasCategories = categories && Array.isArray(categories) && categories.length > 0
  const titleToUse = titleFromProps || title
  const sanitizedDescription = description?.replace(/\s/g, ' ')
  const effectiveRelationTo = (doc?.collectionType as CardRelationTo) || relationTo
  const href =
    effectiveRelationTo === 'course-categories' ? '/courses' : `/${effectiveRelationTo}/${slug}`

  return (
    <article
      className={cn(
        'group rounded-2xl overflow-hidden bg-card shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 cursor-pointer',
        className,
      )}
      ref={card.ref}
    >
      <div className="relative w-full overflow-hidden">
        {!metaImage && (
          <div className="aspect-video bg-secondary flex items-center justify-center text-muted-foreground text-sm">
            {t.cardNoImage}
          </div>
        )}
        {metaImage && typeof metaImage !== 'string' && (
          <div className="overflow-hidden">
            <Media
              resource={metaImage}
              size="33vw"
              imgClassName="transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        )}
      </div>
      <div className="p-5">
        {showCategories && hasCategories && (
          <div className="mb-3">
            <div className="flex flex-wrap gap-2">
              {categories?.map((category, index) => {
                if (typeof category === 'object') {
                  const { title: titleFromCategory } = category
                  const categoryTitle = titleFromCategory || t.untitledCategory
                  return (
                    <span
                      key={index}
                      className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary"
                    >
                      {categoryTitle}
                    </span>
                  )
                }
                return null
              })}
            </div>
          </div>
        )}
        {titleToUse && (
          <h3 className="text-lg font-semibold leading-snug">
            <Link className="hover:text-primary transition-colors" href={href} ref={link.ref}>
              {titleToUse}
            </Link>
          </h3>
        )}
        {description && (
          <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{sanitizedDescription}</p>
        )}
        {likesCount != null && likesCount > 0 && (
          <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor" stroke="none">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            {likesCount} {t.likesCount}
          </div>
        )}
      </div>
    </article>
  )
}
