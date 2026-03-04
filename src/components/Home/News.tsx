'use client'

import { FadeIn } from './FadeIn'
import Link from 'next/link'

type NewsItem = {
  title: string
  date: string
  excerpt: string
  slug: string
}

type Props = {
  tag: string
  title: string
  description: string
  cta: string
  items: NewsItem[]
  locale: string
}

export function NewsSection({ tag, title, description, cta, items, locale }: Props) {
  return (
    <section className="py-32 bg-gradient-to-b from-secondary/30 to-background">
      <div className="container">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-16 gap-6">
          <div>
            <FadeIn>
              <span className="inline-block px-4 py-1.5 rounded-full bg-[#F99E2D]/10 text-[#F99E2D] text-sm font-semibold tracking-wider uppercase mb-6">
                {tag}
              </span>
            </FadeIn>
            <FadeIn delay={100}>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
                {title}
              </h2>
            </FadeIn>
            <FadeIn delay={200}>
              <p className="text-muted-foreground text-lg mt-3">
                {description}
              </p>
            </FadeIn>
          </div>
          <FadeIn delay={300}>
            <Link
              href={`/${locale}/posts`}
              className="inline-flex items-center gap-2 text-[#1e3b8a] font-semibold hover:gap-3 transition-all duration-300 whitespace-nowrap"
            >
              {cta}
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </FadeIn>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {items.map((item, i) => (
            <FadeIn key={i} delay={200 + i * 100}>
              <article className="group hover:-translate-y-1.5 transition-transform">
                <Link href={`/${locale}/posts/${item.slug}`} className="block">
                  <div className="relative h-48 rounded-2xl bg-gradient-to-br from-primary/10 via-accent/5 to-primary/5 border border-border/50 mb-5 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute bottom-4 left-4">
                      <span className="px-3 py-1 rounded-full bg-white/90 text-foreground text-xs font-medium shadow-sm">
                        {item.date}
                      </span>
                    </div>
                  </div>
                  <h3 className="font-semibold text-lg text-foreground group-hover:text-[#1e3b8a] transition-colors duration-300 mb-2 line-clamp-2">
                    {item.title}
                  </h3>
                  <p className="text-muted-foreground text-sm line-clamp-2">{item.excerpt}</p>
                </Link>
              </article>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}
