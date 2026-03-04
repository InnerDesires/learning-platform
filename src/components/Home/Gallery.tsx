'use client'

import { FadeIn } from './FadeIn'

type Props = {
  tag: string
  title: string
}

const placeholders = [
  { span: 'col-span-2 row-span-2', gradient: 'from-white/10 to-white/5' },
  { span: 'col-span-1 row-span-1', gradient: 'from-[#F99E2D]/15 to-[#F99E2D]/5' },
  { span: 'col-span-1 row-span-1', gradient: 'from-white/8 to-white/3' },
  { span: 'col-span-1 row-span-2', gradient: 'from-[#F99E2D]/10 to-white/5' },
  { span: 'col-span-1 row-span-1', gradient: 'from-white/10 to-[#F99E2D]/5' },
  { span: 'col-span-2 row-span-1', gradient: 'from-white/5 to-white/10' },
]

export function GallerySection({ tag, title }: Props) {
  return (
    <section className="py-32 relative overflow-hidden bg-gradient-to-br from-[#0a1228] via-[#1e3b8a] to-[#0f1d45]">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#F99E2D]/5 rounded-full blur-3xl" />

      <div className="container relative">
        <div className="text-center mb-16">
          <FadeIn className="inline-block px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-[#F99E2D] text-sm font-semibold tracking-wider uppercase mb-6">
            {tag}
          </FadeIn>
          <FadeIn delay={100} className="text-3xl md:text-4xl lg:text-5xl font-bold text-white">
            {title}
          </FadeIn>
        </div>

        <FadeIn
          delay={200}
          className="grid grid-cols-2 md:grid-cols-4 auto-rows-[140px] md:auto-rows-[180px] gap-3 md:gap-4"
        >
          {placeholders.map((item, i) => (
            <FadeIn
              key={i}
              delay={300 + i * 80}
              className={`${item.span} rounded-2xl bg-gradient-to-br ${item.gradient} border border-white/10 overflow-hidden cursor-pointer relative group hover:scale-[1.02] transition-transform`}
            >
              <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors duration-300" />
              <div className="absolute inset-0 flex items-center justify-center opacity-20">
                <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
                </svg>
              </div>
            </FadeIn>
          ))}
        </FadeIn>
      </div>
    </section>
  )
}
