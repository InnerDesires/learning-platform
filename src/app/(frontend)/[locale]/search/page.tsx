import type { Metadata } from 'next/types'

import { CollectionArchive } from '@/components/CollectionArchive'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'
import type { SiteLocale } from '@/utilities/locales'
import { Search } from '@/search/Component'
import PageClient from './page.client'
import { CardPostData } from '@/components/Card'
import { Rails } from '@/components/brand'
import { getFrontendMessages } from '@/utilities/i18n'
import { getCachedCommentsCounts, getCachedLikesCounts } from '@/utilities/contentCounts'

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

  // Dedupe by underlying document (stale index rows can point at the same doc)
  // and carry the original doc id for category deep links.
  const seenDocs = new Set<string>()
  const docs: Array<(typeof posts.docs)[number] & { docId?: number | null }> = []
  for (const result of posts.docs) {
    const docValue = result.doc?.value
    const originalId =
      typeof docValue === 'object' && docValue !== null ? docValue.id : (docValue as number)
    const dedupeKey = `${result.collectionType ?? 'unknown'}:${originalId ?? result.id}`
    if (seenDocs.has(dedupeKey)) continue
    seenDocs.add(dedupeKey)
    docs.push({ ...result, docId: originalId ?? null })
  }

  const searchDocToPostId: Array<{ searchId: number; postId: number }> = []
  for (const result of docs) {
    if (result.collectionType !== 'posts') continue
    if (result.docId) searchDocToPostId.push({ searchId: result.id, postId: result.docId })
  }

  const [postLikesCounts, postCommentsCounts] = await Promise.all([
    getCachedLikesCounts('posts'),
    getCachedCommentsCounts('posts'),
  ])

  const likesCountMap: Record<number, number> = {}
  const commentsCountMap: Record<number, number> = {}
  for (const { searchId, postId } of searchDocToPostId) {
    if (postLikesCounts[postId] != null) likesCountMap[searchId] = postLikesCounts[postId]!
    if (postCommentsCounts[postId] != null) commentsCountMap[searchId] = postCommentsCounts[postId]!
  }

  return (
    <div className="pb-24 pt-14 md:pt-16">
      <PageClient />
      <div data-testid="search-page-content" className="container mb-12">
        <div className="flex flex-col items-center text-center">
          <h1
            data-testid="search-page-title"
            className="heading-display mt-2 text-[clamp(38px,5vw,60px)] font-bold leading-none"
          >
            {t.searchTitle}
          </h1>
          <Rails className="mx-auto mt-4" />
          <div className="mt-8 w-full max-w-[50rem]">
            <Search />
          </div>
        </div>
      </div>

      {docs.length > 0 ? (
        <CollectionArchive
          posts={docs as CardPostData[]}
          likesCountMap={likesCountMap}
          commentsCountMap={commentsCountMap}
          typeLabels={{
            posts: t.searchTypePost,
            courses: t.searchTypeCourse,
            'course-categories': t.searchTypeCategory,
            pages: t.searchTypePage,
          }}
        />
      ) : (
        <div className="container text-center text-fog">{t.searchNoResults}</div>
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
