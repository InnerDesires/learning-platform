'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { FadeIn } from './FadeIn'
import { SectionHead } from '@/components/brand'

type Props = {
  tag: string
  title: string
  description: string
  cta: string
  locale: string
  children?: ReactNode
}

export function CoursesSection({ tag, title, description, cta, locale, children }: Props) {
  const prefix = locale === 'en' ? '/en' : ''

  return (
    <section className="container pt-18 md:pt-20">
      <FadeIn>
        <SectionHead
          eyebrow={tag}
          title={title}
          action={
            <Link
              href={`${prefix}/courses`}
              className="inline-flex h-11 items-center gap-2 rounded-full border-[1.5px] border-line-2 px-5 font-display text-xs font-semibold uppercase tracking-[0.1em] text-cloud transition-colors hover:border-orange hover:text-orange"
            >
              {cta}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          }
        />
      </FadeIn>
      <FadeIn delay={100}>
        <p className="-mt-4 mb-8 max-w-[60ch] text-sm text-fog">{description}</p>
      </FadeIn>
      {children}
    </section>
  )
}
