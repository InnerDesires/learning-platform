'use client'

import Link from 'next/link'
import { FadeIn } from './FadeIn'

type Props = {
  tag: string
  title: string
  description: string
  description2: string
  cta: string
  locale: string
}

export function AboutSection({ tag, title, description, description2, cta, locale }: Props) {
  return (
    <section className="py-32 relative overflow-hidden bg-gradient-to-br from-[#0a1228] via-[#1e3b8a] to-[#0f1d45]">
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-[#F99E2D]/5 to-transparent" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#F99E2D]/5 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2" />

      <div className="container relative">
        <div className="max-w-4xl mx-auto">
          <FadeIn>
            <span className="inline-block px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-[#F99E2D] text-sm font-semibold tracking-wider uppercase mb-6">
              {tag}
            </span>
          </FadeIn>

          <FadeIn delay={100}>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-8 text-white">
              {title}
            </h2>
          </FadeIn>

          <div className="space-y-6">
            <FadeIn delay={200}>
              <p className="text-lg md:text-xl text-white/60 leading-relaxed">{description}</p>
            </FadeIn>

            <FadeIn delay={300}>
              <p className="text-lg md:text-xl text-white/60 leading-relaxed">{description2}</p>
            </FadeIn>
          </div>

          <FadeIn delay={400} className="mt-10">
            <Link
              href={`/${locale}/pro-nas`}
              className="group inline-flex items-center gap-3 text-[#F99E2D] font-semibold text-lg hover:gap-4 transition-all duration-300"
            >
              {cta}
              <svg
                className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </FadeIn>
        </div>
      </div>
    </section>
  )
}
