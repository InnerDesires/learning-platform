'use client'

import { FadeIn } from './FadeIn'
import Link from 'next/link'

type CalendarEvent = {
  date: string
  title: string
  description: string
}

type Props = {
  tag: string
  title: string
  description: string
  events: CalendarEvent[]
  cta: string
  locale: string
}

export function CalendarSection({ tag, title, description, events, cta, locale }: Props) {
  return (
    <section className="py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/3 rounded-full blur-3xl" />

      <div className="container relative">
        <div className="text-center mb-16">
          <FadeIn className="inline-block px-4 py-1.5 rounded-full bg-[#F99E2D]/10 text-[#F99E2D] text-sm font-semibold tracking-wider uppercase mb-6">
            {tag}
          </FadeIn>
          <FadeIn delay={100} className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            {title}
          </FadeIn>
          <FadeIn delay={200} className="text-muted-foreground text-lg">
            {description}
          </FadeIn>
        </div>

        <div className="max-w-2xl mx-auto space-y-6 mb-12">
          {events.map((event, i) => (
            <FadeIn key={i} delay={300 + i * 150} className="group relative">
              <div className="flex gap-6 items-start p-6 rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm hover:border-[#F99E2D]/30 hover:shadow-lg hover:shadow-[#F99E2D]/5 transition-all duration-300">
                <div className="shrink-0 w-20 h-20 rounded-xl bg-gradient-to-br from-[#F99E2D] to-[#e88a1a] flex flex-col items-center justify-center text-white shadow-md">
                  <span className="text-xs font-medium uppercase opacity-80">
                    {event.date.split(' ')[0]}
                  </span>
                  <span className="text-lg font-bold">{event.date.split(' ')[1]}</span>
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-foreground group-hover:text-[#1e3b8a] transition-colors duration-300">
                    {event.title}
                  </h3>
                  <p className="text-muted-foreground text-sm mt-1">{event.description}</p>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>

        <FadeIn delay={600} className="text-center">
          <Link
            href={`/${locale}/anketa`}
            className="inline-flex items-center justify-center h-14 px-8 rounded-full bg-[#F99E2D] text-white font-semibold text-base shadow-lg shadow-[#F99E2D]/25 hover:shadow-xl hover:shadow-[#F99E2D]/30 transition-all duration-300 hover:scale-105 active:scale-[0.98]"
          >
            {cta}
          </Link>
        </FadeIn>
      </div>
    </section>
  )
}
