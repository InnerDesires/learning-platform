'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { FadeIn } from './FadeIn'

type Props = {
  title: string
  subtitle: string
  cta: string
  ctaSecondary: string
  locale: string
}

export function HeroSection({ title, subtitle, cta, ctaSecondary, locale }: Props) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  return (
    <section className="relative min-h-[100dvh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#0a1228] via-[#1e3b8a] to-[#0f1d45]">
      <img
        src="/static/zz/zz-32.png"
        alt=""
        className="absolute inset-0 w-full h-full object-cover opacity-25 mix-blend-luminosity"
        loading="eager"
        aria-hidden="true"
      />

      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a1228]/80 via-[#1e3b8a]/30 to-[#0a1228]/60" />

      <div className="container relative z-10 text-center py-20">
        <div
          className={`mb-6 transition-all duration-700 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}
          style={{ transitionDelay: '200ms' }}
        >
          <span className="inline-block px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-white/60 text-sm font-medium tracking-widest uppercase backdrop-blur-sm">
            {locale === 'uk' ? 'Платформа' : 'Platform'} {new Date().getFullYear()}
          </span>
        </div>

        <h1
          className={`text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-white/90 to-white/50 mb-6 transition-all duration-1000 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
          style={{ transitionDelay: '400ms' }}
        >
          {title}
        </h1>

        <p
          className={`text-lg md:text-xl lg:text-2xl text-white/60 max-w-2xl mx-auto mb-12 leading-relaxed transition-all duration-800 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}
          style={{ transitionDelay: '700ms' }}
        >
          {subtitle}
        </p>

        <div
          className={`flex flex-col sm:flex-row items-center justify-center gap-4 transition-all duration-800 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}
          style={{ transitionDelay: '900ms' }}
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
        </div>
      </div>

      <div
        className={`absolute bottom-8 left-1/2 -translate-x-1/2 transition-opacity duration-1000 ${mounted ? 'opacity-100' : 'opacity-0'}`}
        style={{ transitionDelay: '1500ms' }}
      >
        <div className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center p-1.5 animate-bounce">
          <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
        </div>
      </div>
    </section>
  )
}
