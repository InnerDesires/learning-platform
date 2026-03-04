'use client'

import { motion, useInView } from 'framer-motion'
import Link from 'next/link'
import { useRef } from 'react'

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
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section ref={ref} className="py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/3 rounded-full blur-3xl" />

      <div className="container relative">
        <div className="text-center mb-16">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="inline-block px-4 py-1.5 rounded-full bg-[#F99E2D]/10 text-[#F99E2D] text-sm font-semibold tracking-wider uppercase mb-6"
          >
            {tag}
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4"
          >
            {title}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-muted-foreground text-lg"
          >
            {description}
          </motion.p>
        </div>

        <div className="max-w-2xl mx-auto space-y-6 mb-12">
          {events.map((event, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.3 + i * 0.15 }}
              className="group relative"
            >
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
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-center"
        >
          <Link
            href={`/${locale}/anketa`}
            className="inline-flex items-center justify-center h-14 px-8 rounded-full bg-[#F99E2D] text-white font-semibold text-base shadow-lg shadow-[#F99E2D]/25 hover:shadow-xl hover:shadow-[#F99E2D]/30 transition-all duration-300 hover:scale-105 active:scale-[0.98]"
          >
            {cta}
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
