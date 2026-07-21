'use client'

import { ArrowRight, Heart, MessageCircle } from 'lucide-react'
import { FadeIn } from './FadeIn'
import Link from 'next/link'
import { formatDateTime } from '@/utilities/formatDateTime'
import { Media } from '@/components/Media'
import type { Media as MediaType } from '@/payload-types'
import type { SiteLocale } from '@/utilities/locales'
import { SectionHead } from '@/components/brand'

type NewsItem = {
  title: string
  date: string
  excerpt: string
  slug: string
  image?: MediaType | null
  likes?: number
  comments?: number
}

type Props = {
  tag: string
  title: string
  description: string
  cta: string
  items: NewsItem[]
  locale: string
}

// Fallback covers extracted from the approved design prototype.
export const POST_FALLBACK_COVERS = [
  '/illustrations/post-shift-recap.svg',
  '/illustrations/post-enrollment.svg',
  '/illustrations/post-achievement.svg',
  '/illustrations/post-first-aid-training.svg',
  '/illustrations/post-depot-excursion.svg',
  '/illustrations/post-story.svg',
]

export function NewsSection({ tag, title, cta, items, locale }: Props) {
  const prefix = locale === 'en' ? '/en' : ''

  if (items.length === 0) return null

  return (
    <>
      <FadeIn>
        <SectionHead
          eyebrow={tag}
          title={title}
          action={
            <Link
              href={`${prefix}/posts`}
              className="inline-flex items-center gap-2 rounded-full border-[1.5px] border-[#C9C2B2] px-4.5 py-2 font-display text-xs font-semibold uppercase tracking-[0.1em] text-ink transition-colors hover:border-ember hover:text-ember"
            >
              {cta}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          }
        />
      </FadeIn>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, i) => (
          <FadeIn key={item.slug} delay={100 + i * 100}>
            <article className="group flex h-full flex-col overflow-hidden rounded-[14px] border border-[#E4DFD2] bg-white text-ink transition-all duration-200 hover:-translate-y-1 hover:border-orange hover:shadow-[0_14px_34px_-18px_rgb(14_27_58/0.4)]">
              <Link href={`${prefix}/posts/${item.slug}`} className="flex flex-1 flex-col">
                <div className="relative aspect-[16/9] overflow-hidden bg-ink">
                  {item.image ? (
                    <Media
                      resource={item.image}
                      fill
                      size="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      imgClassName="object-cover transition-transform duration-300 group-hover:scale-[1.045]"
                    />
                  ) : (
                    <img
                      src={POST_FALLBACK_COVERS[i % POST_FALLBACK_COVERS.length]}
                      alt=""
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.045]"
                      loading="lazy"
                    />
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-2 p-5">
                  {item.date && (
                    <div className="flex gap-2.5 text-[11px] font-bold uppercase tracking-[0.1em] text-ember">
                      {formatDateTime(item.date, locale as SiteLocale)}
                    </div>
                  )}
                  <h3 className="text-[15.5px] font-bold leading-[1.35] transition-colors group-hover:text-ember">
                    {item.title}
                  </h3>
                  {item.excerpt && (
                    <p className="line-clamp-2 text-[12.5px] leading-relaxed text-paper-muted">
                      {item.excerpt}
                    </p>
                  )}
                  {((item.likes ?? 0) > 0 || (item.comments ?? 0) > 0) && (
                    <div className="@container mt-auto flex flex-nowrap items-center gap-3.5 overflow-hidden whitespace-nowrap border-t border-[#EBE6D9] pt-3 text-[11.5px] font-semibold text-[#7C7768]">
                      {item.likes != null && item.likes > 0 && (
                        <span className="num flex flex-none items-center gap-1.5">
                          <Heart className="h-3.5 w-3.5" fill="currentColor" strokeWidth={0} />
                          {item.likes}
                        </span>
                      )}
                      {item.comments != null && item.comments > 0 && (
                        <span className="num flex flex-none items-center gap-1.5 @max-[160px]:hidden">
                          <MessageCircle className="h-3.5 w-3.5" />
                          {item.comments}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </Link>
            </article>
          </FadeIn>
        ))}
      </div>
    </>
  )
}
