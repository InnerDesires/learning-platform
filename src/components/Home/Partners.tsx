'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

type Logo = {
  name: string
  image: string
}

type Props = {
  tag: string
  title: string
  description: string
  logos: Logo[]
}

function MarqueeRow({ logos, reverse = false }: { logos: Logo[]; reverse?: boolean }) {
  const doubled = [...logos, ...logos]

  return (
    <div className="flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
      <div
        className={`flex gap-6 ${reverse ? 'animate-marquee-reverse' : 'animate-marquee'} shrink-0`}
      >
        {doubled.map((logo, i) => (
          <div
            key={i}
            className="flex items-center justify-center w-48 h-24 rounded-xl bg-[#0f1d45] px-6 hover:bg-[#1e3b8a] transition-all duration-300 shrink-0"
          >
            <img
              src={logo.image}
              alt={logo.name}
              className="max-h-14 max-w-[140px] w-auto object-contain brightness-0 invert opacity-70 hover:opacity-100 transition-opacity duration-300"
              loading="lazy"
            />
          </div>
        ))}
      </div>
      <div
        className={`flex gap-6 ${reverse ? 'animate-marquee-reverse' : 'animate-marquee'} shrink-0`}
        aria-hidden="true"
      >
        {doubled.map((logo, i) => (
          <div
            key={i}
            className="flex items-center justify-center w-48 h-24 rounded-xl bg-[#0f1d45] px-6 hover:bg-[#1e3b8a] transition-all duration-300 shrink-0"
          >
            <img
              src={logo.image}
              alt={logo.name}
              className="max-h-14 max-w-[140px] w-auto object-contain brightness-0 invert opacity-70 hover:opacity-100 transition-opacity duration-300"
              loading="lazy"
            />
          </div>
        ))}
      </div>
    </div>
  )
}

export function PartnersSection({ tag, title, description, logos }: Props) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section ref={ref} className="py-32 overflow-hidden">
      <div className="container">
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
            className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6"
          >
            {title}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-muted-foreground text-lg max-w-2xl mx-auto"
          >
            {description}
          </motion.p>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ duration: 0.8, delay: 0.3 }}
      >
        <MarqueeRow logos={logos} />
      </motion.div>
    </section>
  )
}
