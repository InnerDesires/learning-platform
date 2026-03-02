import { formatDateTime } from 'src/utilities/formatDateTime'
import React from 'react'
import type { SiteLocale } from '@/utilities/locales'

import type { Post } from '@/payload-types'

import { Media } from '@/components/Media'
import { formatAuthors } from '@/utilities/formatAuthors'
import { getFrontendMessages } from '@/utilities/i18n'

export const PostHero: React.FC<{
  locale: SiteLocale
  post: Post
  likesCount?: number
}> = ({ locale, post, likesCount }) => {
  const t = getFrontendMessages(locale)
  const { categories, heroImage, populatedAuthors, publishedAt, title } = post

  const hasAuthors =
    populatedAuthors && populatedAuthors.length > 0 && formatAuthors(populatedAuthors) !== ''

  return (
    <div className="container py-12">
      <div className="max-w-4xl mx-auto">
        {categories && categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {categories.map((category, index) => {
              if (typeof category === 'object' && category !== null) {
                const { title: categoryTitle } = category
                return (
                  <span
                    key={index}
                    className="inline-block text-xs font-semibold px-3 py-1 rounded-full bg-primary/10 text-primary"
                  >
                    {categoryTitle || t.untitledCategory}
                  </span>
                )
              }
              return null
            })}
          </div>
        )}

        <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-6 text-foreground">
          {title}
        </h1>

        <div className="flex flex-wrap gap-6 text-sm text-muted-foreground mb-8">
          {hasAuthors && (
            <div>
              <span className="font-medium text-foreground">{formatAuthors(populatedAuthors)}</span>
            </div>
          )}
          {publishedAt && (
            <time dateTime={publishedAt}>{formatDateTime(publishedAt)}</time>
          )}
          {likesCount != null && likesCount > 0 && (
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              {likesCount} {t.likesCount}
            </span>
          )}
        </div>

        {heroImage && typeof heroImage !== 'string' && (
          <div className="rounded-2xl overflow-hidden">
            <Media priority resource={heroImage} />
          </div>
        )}
      </div>
    </div>
  )
}
