import { cn } from '@/utilities/ui'
import React from 'react'
import type { SiteLocale } from '@/utilities/locales'

import { Card, CardPostData } from '@/components/Card'

export type Props = {
  locale?: SiteLocale
  posts: CardPostData[]
  likesCountMap?: Record<number, number>
}

export const CollectionArchive: React.FC<Props> = (props) => {
  const { locale, posts, likesCountMap } = props

  return (
    <div className={cn('container')}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts?.map((result, index) => {
          if (typeof result === 'object' && result !== null) {
            return (
              <Card
                className="h-full"
                doc={result}
                key={index}
                locale={locale}
                relationTo="posts"
                showCategories
                likesCount={likesCountMap?.[result.id]}
              />
            )
          }

          return null
        })}
      </div>
    </div>
  )
}
