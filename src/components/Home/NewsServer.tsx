import configPromise from '@payload-config'
import { getPayload } from 'payload'
import type { SiteLocale } from '@/utilities/locales'
import { getHomeContent } from './content'
import { NewsSection } from './News'
import { getCachedCommentsCounts, getCachedLikesCounts } from '@/utilities/contentCounts'

type Props = {
  locale: SiteLocale
}

export async function NewsSectionServer({ locale }: Props) {
  const payload = await getPayload({ config: configPromise })
  const { docs } = await payload.find({
    collection: 'posts',
    locale,
    limit: 3,
    sort: '-publishedAt',
    where: { _status: { equals: 'published' } },
    select: {
      title: true,
      slug: true,
      publishedAt: true,
      meta: true,
    },
  })

  const [likesCounts, commentsCounts] = await Promise.all([
    getCachedLikesCounts('posts').catch(() => ({}) as Record<number, number>),
    getCachedCommentsCounts('posts').catch(() => ({}) as Record<number, number>),
  ])

  const items = docs.map((post) => {
    const image = post.meta?.image
    return {
      title: post.title,
      slug: post.slug ?? '',
      date: post.publishedAt ?? '',
      excerpt: post.meta?.description ?? '',
      image: typeof image === 'object' ? image : null,
      likes: likesCounts[post.id] ?? 0,
      comments: commentsCounts[post.id] ?? 0,
    }
  })

  const c = getHomeContent(locale)

  return <NewsSection {...c.news} items={items} locale={locale} />
}

export function NewsSectionSkeleton({ locale }: Props) {
  const c = getHomeContent(locale)

  return (
    <>
      <div className="mb-9">
        <span className="eyebrow">{c.news.tag}</span>
        <h2 className="heading-display mt-2.5 text-[clamp(26px,3.4vw,38px)] text-ink">
          {c.news.title}
        </h2>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="animate-pulse overflow-hidden rounded-[14px] border border-[#E4DFD2] bg-white"
          >
            <div className="aspect-[16/9] bg-[#EBE6D9]" />
            <div className="space-y-2.5 p-5">
              <div className="h-4 w-24 rounded bg-[#EBE6D9]" />
              <div className="h-5 w-3/4 rounded bg-[#EBE6D9]" />
              <div className="h-4 w-full rounded bg-[#EBE6D9]" />
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
