'use client'

import { FadeIn } from './FadeIn'
import Link from 'next/link'

type Props = {
  tag: string
  title: string
  description: string
  cta: string
  locale: string
}

export function CoursesSection({ tag, title, description, cta, locale }: Props) {
  const features = [
    {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
        </svg>
      ),
      uk: 'Відеоуроки',
      en: 'Video Lessons',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
        </svg>
      ),
      uk: 'Матеріали',
      en: 'Materials',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
      ),
      uk: 'Тести',
      en: 'Quizzes',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
        </svg>
      ),
      uk: 'Сертифікати',
      en: 'Certificates',
    },
  ]

  return (
    <section className="py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />

      <div className="container relative">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1">
            <FadeIn>
              <span className="inline-block px-4 py-1.5 rounded-full bg-[#F99E2D]/10 text-[#F99E2D] text-sm font-semibold tracking-wider uppercase mb-6">
                {tag}
              </span>
            </FadeIn>
            <FadeIn delay={100}>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
                {title}
              </h2>
            </FadeIn>
            <FadeIn delay={200}>
              <p className="text-lg text-muted-foreground mb-8 max-w-lg">
                {description}
              </p>
            </FadeIn>
            <FadeIn delay={300}>
              <Link
                href={`/${locale}/courses`}
                className="inline-flex items-center justify-center h-14 px-8 rounded-full bg-[#F99E2D] text-white font-semibold text-base shadow-lg shadow-[#F99E2D]/25 hover:shadow-xl hover:shadow-[#F99E2D]/30 transition-all duration-300 hover:scale-105 active:scale-[0.98]"
              >
                {cta}
              </Link>
            </FadeIn>
          </div>

          <div className="flex-1 w-full">
            <div className="grid grid-cols-2 gap-4">
              {features.map((feature, i) => (
                <FadeIn key={i} delay={200 + i * 100}>
                  <div className="p-6 rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm hover:border-[#F99E2D]/30 hover:shadow-lg hover:shadow-[#F99E2D]/5 transition-all duration-300 hover:-translate-y-1">
                    <span className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#F99E2D]/10 text-[#F99E2D] mb-4">
                      {feature.icon}
                    </span>
                    <p className="font-semibold text-foreground">
                      {locale === 'uk' ? feature.uk : feature.en}
                    </p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
