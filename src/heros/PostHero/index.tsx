import { formatDateTime } from 'src/utilities/formatDateTime'
import React from 'react'

import type { Post } from '@/payload-types'

import { Media } from '@/components/Media'
import { formatAuthors } from '@/utilities/formatAuthors'

export const PostHero: React.FC<{
  post: Post
}> = ({ post }) => {
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
                    {categoryTitle || 'Untitled category'}
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
