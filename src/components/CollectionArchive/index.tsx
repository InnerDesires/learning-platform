import { cn } from '@/utilities/ui'
import React from 'react'
import type { SiteLocale } from '@/utilities/locales'

import { Card, CardPostData, CardRelationTo } from '@/components/Card'

export type Props = {
  locale?: SiteLocale
  posts: CardPostData[]
  likesCountMap?: Record<number, number>
  /** Optional label per collection type, shown as a chip on each card (used on search results). */
  typeLabels?: Partial<Record<CardRelationTo, string>>
}

export const CollectionArchive: React.FC<Props> = (props) => {
  const { locale, posts, likesCountMap, typeLabels } = props

  return (
    <div className={cn('container')}>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {posts?.map((result, index) => {
          if (typeof result === 'object' && result !== null) {
            const relationTo = (result.collectionType as CardRelationTo) || 'posts'
            return (
              <Card
                className="h-full"
                doc={result}
                key={index}
                locale={locale}
                relationTo={relationTo}
                showCategories
                likesCount={likesCountMap?.[result.id]}
                typeLabel={typeLabels?.[relationTo]}
              />
            )
          }

          return null
        })}
      </div>
    </div>
  )
}
