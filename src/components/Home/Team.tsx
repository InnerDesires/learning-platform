'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

type Member = {
  name: string
  role: string
  initials: string
  image?: string
}

type Props = {
  tag: string
  title: string
  members: Member[]
}

export function TeamSection({ tag, title, members }: Props) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section ref={ref} className="py-32 relative overflow-hidden bg-gradient-to-br from-[#0f1d45] via-[#1e3b8a] to-[#0a1228]">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#F99E2D]/5 rounded-full blur-3xl" />

      <div className="container relative">
        <div className="text-center mb-16">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="inline-block px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-[#F99E2D] text-sm font-semibold tracking-wider uppercase mb-6"
          >
            {tag}
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl md:text-4xl lg:text-5xl font-bold text-white"
          >
            {title}
          </motion.h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 md:gap-8">
          {members.map((member, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40, scale: 0.9 }}
              animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
              transition={{ duration: 0.5, delay: 0.1 + i * 0.1 }}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
              className="group text-center"
            >
              <div className="relative mx-auto mb-5 w-28 h-28 md:w-32 md:h-32">
                {member.image ? (
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full rounded-full object-cover shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105 ring-3 ring-white/10 group-hover:ring-[#F99E2D]/40"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-white/10 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                    <span className="text-2xl md:text-3xl font-bold text-white/90">
                      {member.initials}
                    </span>
                  </div>
                )}
              </div>
              <h3 className="font-semibold text-white text-sm md:text-base">{member.name}</h3>
              <p className="text-white/50 text-xs md:text-sm mt-1">{member.role}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
