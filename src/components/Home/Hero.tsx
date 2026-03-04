'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { useEffect, useState } from 'react'

type Props = {
  title: string
  subtitle: string
  cta: string
  ctaSecondary: string
  locale: string
}

function GridBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />
      {Array.from({ length: 5 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-[#F99E2D]/8 blur-3xl"
          style={{
            width: 200 + i * 100,
            height: 200 + i * 100,
            left: `${15 + i * 18}%`,
            top: `${20 + (i % 3) * 25}%`,
          }}
          animate={{
            x: [0, 30, -20, 0],
            y: [0, -20, 30, 0],
            scale: [1, 1.1, 0.95, 1],
          }}
          transition={{
            duration: 12 + i * 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}

export function HeroSection({ title, subtitle, cta, ctaSecondary, locale }: Props) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const words = title.split(' ')

  return (
    <section className="relative min-h-[100dvh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#0a1228] via-[#1e3b8a] to-[#0f1d45]">
      <img
        src="/static/zz/zz-32.png"
        alt=""
        className="absolute inset-0 w-full h-full object-cover opacity-25 mix-blend-luminosity"
        loading="eager"
        aria-hidden="true"
      />
      <GridBackground />

      <div className="absolute inset-0 bg-gradient-to-t from-[#0a1228]/80 via-[#1e3b8a]/30 to-[#0a1228]/60" />

      <div className="container relative z-10 text-center py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={mounted ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-6"
        >
          <span className="inline-block px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-white/60 text-sm font-medium tracking-widest uppercase backdrop-blur-sm">
            {locale === 'uk' ? 'Платформа' : 'Platform'} {new Date().getFullYear()}
          </span>
        </motion.div>

        <h1 className="mb-6 select-none">
          <span className="sr-only">{title}</span>
          <span aria-hidden="true" className="flex justify-center flex-wrap gap-x-3 md:gap-x-5">
            {words.map((word, wi) => (
              <span key={wi} className="inline-flex whitespace-nowrap">
                {word.split('').map((letter, li) => {
                  const i = words.slice(0, wi).reduce((acc, w) => acc + w.length, 0) + li
                  return (
                    <motion.span
                      key={i}
                      initial={{ opacity: 0, y: 50, rotateX: -90 }}
                      animate={mounted ? { opacity: 1, y: 0, rotateX: 0 } : {}}
                      transition={{
                        duration: 0.6,
                        delay: 0.4 + i * 0.05,
                        ease: [0.215, 0.61, 0.355, 1],
                      }}
                      className="inline-block text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-white/90 to-white/50"
                      style={{ perspective: '600px' }}
                    >
                      {letter}
                    </motion.span>
                  )
                })}
              </span>
            ))}
          </span>
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={mounted ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 1 }}
          className="text-lg md:text-xl lg:text-2xl text-white/60 max-w-2xl mx-auto mb-12 leading-relaxed"
        >
          {subtitle}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={mounted ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 1.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            href={`/${locale}/anketa`}
            className="group relative inline-flex items-center justify-center h-14 px-8 rounded-full bg-[#F99E2D] text-white font-semibold text-base shadow-lg shadow-[#F99E2D]/25 hover:shadow-xl hover:shadow-[#F99E2D]/30 transition-all duration-300 hover:scale-105 active:scale-[0.98] whitespace-nowrap"
          >
            <span className="relative z-10">{cta}</span>
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#F99E2D] to-[#e88a1a] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </Link>

          <Link
            href={`/${locale}/pro-nas`}
            className="inline-flex items-center justify-center h-14 px-8 rounded-full border-2 border-white/15 text-white/80 font-semibold text-base hover:bg-white/5 hover:border-white/25 transition-all duration-300 backdrop-blur-sm hover:scale-105 active:scale-[0.98] whitespace-nowrap"
          >
            {ctaSecondary}
          </Link>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={mounted ? { opacity: 1 } : {}}
        transition={{ delay: 2, duration: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center p-1.5"
        >
          <motion.div className="w-1.5 h-1.5 rounded-full bg-white/40" />
        </motion.div>
      </motion.div>
    </section>
  )
}
