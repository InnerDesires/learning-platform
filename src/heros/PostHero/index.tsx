import { formatDateTime } from 'src/utilities/formatDateTime'
import React from 'react'
import { Heart } from 'lucide-react'
import type { SiteLocale } from '@/utilities/locales'

import type { Post } from '@/payload-types'

import { Media } from '@/components/Media'
import { formatAuthors } from '@/utilities/formatAuthors'
import { getFrontendMessages } from '@/utilities/i18n'
import { Rails } from '@/components/brand'

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
    <div className="relative overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(720px 440px at 85% 0%, rgb(4 40 113 / 0.5), transparent 60%), linear-gradient(180deg, var(--navy-2) 0%, var(--void) 100%)',
        }}
        aria-hidden="true"
      />
      <div className="container relative py-14">
        <div className="mx-auto max-w-4xl">
          {categories && categories.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-1.5">
              {categories.map((category, index) => {
                if (typeof category === 'object' && category !== null) {
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

          <h1 className="heading-display mb-5 max-w-[24ch] text-[clamp(30px,4.4vw,52px)] font-bold leading-[1.04]">
            {title}
          </h1>
          <Rails />

          <div className="mb-8 mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-[12.5px] font-semibold text-fog">
            {hasAuthors && <span className="text-cloud">{formatAuthors(populatedAuthors)}</span>}
            {publishedAt && (
              <time className="num text-steel" dateTime={publishedAt}>
                {formatDateTime(publishedAt, locale)}
              </time>
            )}
            {likesCount != null && likesCount > 0 && (
              <span className="num flex items-center gap-1.5">
                <Heart className="h-3.5 w-3.5 text-orange" fill="currentColor" strokeWidth={0} />
                {likesCount}
              </span>
            )}
          </div>

          {heroImage && typeof heroImage !== 'string' && (
            <div className="overflow-hidden rounded-2xl border border-line-2">
              <Media priority resource={heroImage} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
