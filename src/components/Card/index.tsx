'use client'
import { cn } from '@/utilities/ui'
import useClickableCard from '@/utilities/useClickableCard'
import Link from 'next/link'
import React, { Fragment } from 'react'

import type { Post } from '@/payload-types'

import { Media } from '@/components/Media'

export type CardPostData = Pick<Post, 'slug' | 'categories' | 'meta' | 'title'>

export const Card: React.FC<{
  alignItems?: 'center'
  className?: string
  doc?: CardPostData
  relationTo?: 'posts'
  showCategories?: boolean
  title?: string
}> = (props) => {
  const { card, link } = useClickableCard({})
  const { className, doc, relationTo, showCategories, title: titleFromProps } = props

  const { slug, categories, meta, title } = doc || {}
  const { description, image: metaImage } = meta || {}

  const hasCategories = categories && Array.isArray(categories) && categories.length > 0
  const titleToUse = titleFromProps || title
  const sanitizedDescription = description?.replace(/\s/g, ' ')
  const href = `/${relationTo}/${slug}`

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
            No image
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
                  const categoryTitle = titleFromCategory || 'Untitled category'
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
      </div>
    </article>
  )
}
