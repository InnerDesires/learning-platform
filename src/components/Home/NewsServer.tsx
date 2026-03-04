import configPromise from '@payload-config'
import { getPayload } from 'payload'
import type { SiteLocale } from '@/utilities/locales'
import { getHomeContent } from './content'
import { NewsSection } from './News'

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

  const items = docs.map((post) => {
    const image = post.meta?.image
    return {
      title: post.title,
      slug: post.slug ?? '',
      date: post.publishedAt ?? '',
      excerpt: post.meta?.description ?? '',
      image: typeof image === 'object' ? image : null,
    }
  })

  const c = getHomeContent(locale)

  return <NewsSection {...c.news} items={items} locale={locale} />
}

export function NewsSectionSkeleton({ locale }: Props) {
  const c = getHomeContent(locale)

  return (
    <section className="py-32 bg-gradient-to-b from-secondary/30 to-background">
      <div className="container">
        <div className="mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-[#F99E2D]/10 text-[#F99E2D] text-sm font-semibold tracking-wider uppercase mb-6">
            {c.news.tag}
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
            {c.news.title}
          </h2>
          <p className="text-muted-foreground text-lg mt-3">{c.news.description}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[0, 1, 2].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-48 rounded-2xl bg-muted mb-5" />
              <div className="h-5 bg-muted rounded w-3/4 mb-2" />
              <div className="h-4 bg-muted rounded w-full" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
