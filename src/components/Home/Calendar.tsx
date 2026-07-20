'use client'

import { ArrowRight } from 'lucide-react'
import { FadeIn } from './FadeIn'
import { SectionHead } from '@/components/brand'

type CalendarEvent = {
  month: string
  year: string
  range: string
  title: string
  description: string
  formUrl: string
}

type Props = {
  tag: string
  title: string
  description: string
  events: CalendarEvent[]
  cta: string
}

export function CalendarSection({ tag, title, description, events, cta }: Props) {
  return (
    <>
      <FadeIn>
        <SectionHead eyebrow={tag} title={title} className="mt-16" />
      </FadeIn>
      <FadeIn delay={100}>
        <p className="-mt-4 mb-8 max-w-[60ch] text-sm text-paper-muted">{description}</p>
      </FadeIn>
      <div className="grid gap-4 lg:grid-cols-2">
        {events.map((event, i) => (
          <FadeIn key={event.title} delay={150 + i * 120}>
            <a
              href={event.formUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-5 rounded-[14px] border border-[#E4DFD2] bg-white p-5 transition-all duration-200 hover:translate-x-1 hover:border-orange"
            >
              <div className="w-[92px] flex-none rounded-[10px] bg-ink px-2 py-3 text-center font-display uppercase leading-[1.15] text-cloud">
                <b className="block text-xl font-semibold text-orange">{event.month}</b>
                <span className="num text-[10.5px] tracking-[0.18em]">{event.year}</span>
              </div>
              <div className="min-w-0">
                <div className="num text-[11px] font-bold uppercase tracking-[0.1em] text-ember">
                  {event.range}
                </div>
                <h3 className="mt-0.5 text-[16.5px] font-bold text-ink">{event.title}</h3>
                <p className="mt-0.5 text-[12.5px] text-paper-muted">{event.description}</p>
              </div>
            </a>
          </FadeIn>
        ))}
      </div>
      <FadeIn delay={400}>
        <div className="mt-7">
          <a
            href={events[0]?.formUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-orange px-7 py-3.5 font-display text-sm font-semibold uppercase tracking-[0.1em] text-[#1B1204] shadow-[0_6px_20px_-8px_rgb(249_140_31/0.6)] transition-all hover:-translate-y-px hover:bg-amber"
          >
            {cta}
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </FadeIn>
    </>
  )
}
