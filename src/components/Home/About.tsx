'use client'

import { motion, useInView } from 'framer-motion'
import Link from 'next/link'
import { useRef } from 'react'

type Props = {
  tag: string
  title: string
  description: string
  description2: string
  cta: string
  locale: string
}

export function AboutSection({ tag, title, description, description2, cta, locale }: Props) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section ref={ref} className="py-32 relative overflow-hidden bg-gradient-to-br from-[#0a1228] via-[#1e3b8a] to-[#0f1d45]">
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-[#F99E2D]/5 to-transparent" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#F99E2D]/5 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2" />

      <div className="container relative">
        <div className="max-w-4xl mx-auto">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="inline-block px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-[#F99E2D] text-sm font-semibold tracking-wider uppercase mb-6"
          >
            {tag}
          </motion.span>

          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-8 text-white"
          >
            {title}
          </motion.h2>

          <div className="space-y-6">
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="text-lg md:text-xl text-white/60 leading-relaxed"
            >
              {description}
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="text-lg md:text-xl text-white/60 leading-relaxed"
            >
              {description2}
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="mt-10"
          >
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
          </motion.div>
        </div>
      </div>
    </section>
  )
}
