import type { Metadata } from 'next'

import { RelatedPosts } from '@/blocks/RelatedPosts/Component'
import { PayloadRedirects } from '@/components/PayloadRedirects'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { draftMode } from 'next/headers'
import React, { cache } from 'react'
import RichTextWithArchive from '@/components/RichText/WithArchive'

import type { Post } from '@/payload-types'

import { PostHero } from '@/heros/PostHero'
import { generateMeta } from '@/utilities/generateMeta'
import type { SiteLocale } from '@/utilities/locales'
import PageClient from './page.client'
import { LivePreviewListener } from '@/components/LivePreviewListener'
import { InteractionSection } from '@/components/CommentsAndLikes/InteractionSection'
import { getCachedLikesCounts } from '@/utilities/contentCounts'
import { ShareButtons } from '@/components/ShareButtons'
import { getServerSideURL } from '@/utilities/getURL'
import { getFrontendMessages } from '@/utilities/i18n'

export const revalidate = 600

export async function generateStaticParams() {
  const payload = await getPayload({ config: configPromise })
  const posts = await payload.find({
    collection: 'posts',
    draft: false,
    limit: 1000,
    overrideAccess: false,
    pagination: false,
    select: {
      slug: true,
    },
  })

  const params = posts.docs.flatMap(({ slug }) => [
    { locale: 'uk', slug },
    { locale: 'en', slug },
  ])

  return params
}

type Args = {
  params: Promise<{
    locale: SiteLocale
    slug?: string
  }>
}

export default async function Post({ params: paramsPromise }: Args) {
  const { isEnabled: draft } = await draftMode()
  const { slug = '', locale } = await paramsPromise
  const decodedSlug = decodeURIComponent(slug)
  const url = '/posts/' + decodedSlug
  const post = await queryPostBySlug({ slug: decodedSlug, locale })

  if (!post) return <PayloadRedirects url={url} />

  const postLikesCounts = await getCachedLikesCounts('posts')
  const likesCount = postLikesCounts[post.id] ?? 0
  const t = getFrontendMessages(locale)
  const shareUrl = `${getServerSideURL()}${locale === 'en' ? '/en' : ''}/posts/${decodedSlug}`

  return (
    <article className="pb-16">
      <PageClient />

      <PayloadRedirects disableNotFound url={url} />

      {draft && <LivePreviewListener />}

      <PostHero locale={locale} post={post} likesCount={likesCount} />

      <div className="flex flex-col items-center gap-4 pt-8">
        <div className="container">
          <RichTextWithArchive
            className="max-w-4xl mx-auto"
            data={post.content}
            enableGutter={false}
            locale={locale}
          />
          {post.relatedPosts && post.relatedPosts.length > 0 && (
            <RelatedPosts
              className="mt-12 max-w-[52rem] lg:grid lg:grid-cols-subgrid col-start-1 col-span-3 grid-rows-[2fr]"
              docs={post.relatedPosts.filter((post) => typeof post === 'object')}
              locale={locale}
            />
          )}
          <div className="max-w-4xl mx-auto">
            <div className="mt-10 border-t border-line pt-6">
              <ShareButtons
                url={shareUrl}
                title={post.title}
                label={t.shareLabel}
                copyLabel={t.shareCopyLink}
                copiedLabel={t.copied}
              />
            </div>
            <InteractionSection
              targetCollection="posts"
              targetId={post.id}
              locale={locale}
              redirectPath={`${locale === 'en' ? '/en' : ''}/posts/${decodedSlug}`}
            />
          </div>
        </div>
      </div>
    </article>
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { slug = '', locale } = await paramsPromise
  const decodedSlug = decodeURIComponent(slug)
  const post = await queryPostBySlug({ slug: decodedSlug, locale })

  return generateMeta({ doc: post })
}

const queryPostBySlug = cache(async ({ slug, locale }: { slug: string; locale: SiteLocale }) => {
  const { isEnabled: draft } = await draftMode()

  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'posts',
    draft,
    locale,
    limit: 1,
    overrideAccess: draft,
    pagination: false,
    where: {
      slug: {
        equals: slug,
      },
    },
  })

  return result.docs?.[0] || null
})
