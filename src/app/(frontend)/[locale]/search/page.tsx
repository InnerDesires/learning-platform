import type { Metadata } from 'next/types'

import { CollectionArchive } from '@/components/CollectionArchive'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'
import type { SiteLocale } from '@/utilities/locales'
import { Search } from '@/search/Component'
import PageClient from './page.client'
import { CardPostData } from '@/components/Card'
import { getFrontendMessages } from '@/utilities/i18n'
import { getLikesCountsBatch } from '@/actions/commentsAndLikes'

type Args = {
  params: Promise<{
    locale: SiteLocale
  }>
  searchParams: Promise<{
    q: string
  }>
}
export default async function Page({ params: paramsPromise, searchParams: searchParamsPromise }: Args) {
  const { locale } = await paramsPromise
  const t = getFrontendMessages(locale)
  const { q: query } = await searchParamsPromise
  const payload = await getPayload({ config: configPromise })

  const posts = await payload.find({
    collection: 'search',
    locale,
    depth: 1,
    limit: 12,
    select: {
      title: true,
      slug: true,
      categories: true,
      meta: true,
      collectionType: true,
      doc: true,
    },
    pagination: false,
    ...(query
      ? {
          where: {
            or: [
              {
                title: {
                  like: query,
                },
              },
              {
                'meta.description': {
                  like: query,
                },
              },
              {
                'meta.title': {
                  like: query,
                },
              },
              {
                slug: {
                  like: query,
                },
              },
            ],
          },
        }
      : {}),
  })

  const searchDocToPostId: Array<{ searchId: number; postId: number }> = []
  for (const result of posts.docs) {
    const docValue = result.doc?.value
    const postId = typeof docValue === 'object' && docValue !== null ? docValue.id : (docValue as number)
    if (postId) searchDocToPostId.push({ searchId: result.id, postId })
  }

  const postIds = searchDocToPostId.map((e) => e.postId)
  const postLikesCounts = await getLikesCountsBatch('posts', postIds)

  const likesCountMap: Record<number, number> = {}
  for (const { searchId, postId } of searchDocToPostId) {
    if (postLikesCounts[postId] != null) likesCountMap[searchId] = postLikesCounts[postId]!
  }

  return (
    <div className="pt-24 pb-24">
      <PageClient />
      <div data-testid="search-page-content" className="container mb-16">
        <div className="prose max-w-none text-center">
          <h1 data-testid="search-page-title" className="mb-8 lg:mb-16">
            {t.searchTitle}
          </h1>

          <div className="max-w-[50rem] mx-auto">
            <Search />
          </div>
        </div>
      </div>

      {posts.totalDocs > 0 ? (
        <CollectionArchive posts={posts.docs as CardPostData[]} likesCountMap={likesCountMap} />
      ) : (
        <div className="container">{t.searchNoResults}</div>
      )}
    </div>
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { locale } = await paramsPromise
  const t = getFrontendMessages(locale)
  return {
    title: t.metadataSearchTitle,
  }
}
