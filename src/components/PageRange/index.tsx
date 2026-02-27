import React from 'react'
import type { SiteLocale } from '@/utilities/locales'
import { getFrontendMessages } from '@/utilities/i18n'

const defaultLabels = {
  plural: 'Docs',
  singular: 'Doc',
}

const defaultCollectionLabels = {
  posts: {
    plural: 'Posts',
    singular: 'Post',
  },
}

export const PageRange: React.FC<{
  className?: string
  collection?: keyof typeof defaultCollectionLabels
  collectionLabels?: {
    plural?: string
    singular?: string
  }
  currentPage?: number
  limit?: number
  locale?: SiteLocale
  totalDocs?: number
}> = (props) => {
  const {
    className,
    collection,
    collectionLabels: collectionLabelsFromProps,
    currentPage,
    limit,
    locale = 'uk',
    totalDocs,
  } = props
  const t = getFrontendMessages(locale)

  let indexStart = (currentPage ? currentPage - 1 : 1) * (limit || 1) + 1
  if (totalDocs && indexStart > totalDocs) indexStart = 0

  let indexEnd = (currentPage || 1) * (limit || 1)
  if (totalDocs && indexEnd > totalDocs) indexEnd = totalDocs

  const { plural, singular } =
    collectionLabelsFromProps ||
    (collection ? defaultCollectionLabels[collection] : undefined) ||
    defaultLabels ||
    {}
  const localizedPlural =
    collection === 'posts' ? t.postsPlural : plural === 'Docs' ? t.docsPlural : plural
  const localizedSingular =
    collection === 'posts' ? t.postsSingular : singular === 'Doc' ? t.docsSingular : singular

  return (
    <div className={[className, 'font-semibold'].filter(Boolean).join(' ')}>
      {(typeof totalDocs === 'undefined' || totalDocs === 0) && t.pageRangeNoResults}
      {typeof totalDocs !== 'undefined' &&
        totalDocs > 0 &&
        `${t.pageRangeShowing} ${indexStart}${indexStart > 0 ? ` - ${indexEnd}` : ''} / ${totalDocs} ${
          totalDocs > 1 ? localizedPlural : localizedSingular
        }`}
    </div>
  )
}
