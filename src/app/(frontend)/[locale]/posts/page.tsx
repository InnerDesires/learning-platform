import type { Metadata } from 'next/types'

import { CollectionArchive } from '@/components/CollectionArchive'
import { PageRange } from '@/components/PageRange'
import { Pagination } from '@/components/Pagination'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'
import type { SiteLocale } from '@/utilities/locales'
import PageClient from './page.client'
import { getFrontendMessages } from '@/utilities/i18n'
import { getLikesCountsBatch } from '@/actions/commentsAndLikes'

export const revalidate = 600

type Args = {
  params: Promise<{
    locale: SiteLocale
  }>
}

export default async function Page({ params: paramsPromise }: Args) {
  const { locale } = await paramsPromise
  const t = getFrontendMessages(locale)
  const payload = await getPayload({ config: configPromise })

  const posts = await payload.find({
    collection: 'posts',
    locale,
    depth: 1,
    limit: 12,
    overrideAccess: false,
    select: {
      id: true,
      title: true,
      slug: true,
      categories: true,
      meta: true,
    },
  })

  const postIds = posts.docs.map((p) => p.id)
  const likesCountMap = await getLikesCountsBatch('posts', postIds)

  return (
    <div className="pt-24 pb-24">
      <PageClient />
      <div data-testid="posts-page-content" className="container mb-16">
        <div className="prose max-w-none">
          <h1 data-testid="posts-page-title">{t.postsTitle}</h1>
        </div>
      </div>

      <div className="container mb-8">
        <PageRange
          collection="posts"
          locale={locale}
          currentPage={posts.page}
          limit={12}
          totalDocs={posts.totalDocs}
        />
      </div>

      <CollectionArchive locale={locale} posts={posts.docs} likesCountMap={likesCountMap} />

      <div className="container">
        {posts.totalPages > 1 && posts.page && (
          <Pagination locale={locale} page={posts.page} totalPages={posts.totalPages} />
        )}
      </div>
    </div>
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { locale } = await paramsPromise
  const t = getFrontendMessages(locale)
  return {
    title: t.metadataPostsTitle,
  }
}
