'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { FadeIn } from './FadeIn'
import { StatCounter } from './Stats'

type Props = {
  kick: string
  title1: string
  title2: string
  subtitle: string
  cta: string
  ctaSecondary: string
  supportLabel: string
  supportName: string
  stats: { value: number; label: string; suffix?: string }[]
  locale: string
}

export function HeroSection({
  kick,
  title1,
  title2,
  subtitle,
  cta,
  ctaSecondary,
  supportLabel,
  supportName,
  stats,
  locale,
}: Props) {
  const prefix = locale === 'en' ? '/en' : ''

  return (
    <section className="relative overflow-hidden pb-24 pt-20 md:pb-28 md:pt-24">
      {/* brand-blue glow + orange ember */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(880px 500px at 80% 14%, rgb(4 40 113 / 0.62), transparent 60%), radial-gradient(680px 440px at 8% 92%, rgb(249 140 31 / 0.10), transparent 62%)',
        }}
        aria-hidden="true"
      />
      {/* landing echo: orange diagonal sliver on the right edge */}
      <div
        className="pointer-events-none absolute inset-y-0 right-0 hidden w-[38%] md:block"
        style={{
          background:
            'linear-gradient(118deg, transparent 46%, rgb(249 140 31 / 0.14) 66%, rgb(4 40 113 / 0.34))',
          clipPath: 'polygon(34% 0, 100% 0, 100% 100%, 0 100%)',
        }}
        aria-hidden="true"
      />
      <img
        src="/illustrations/hero-rails.svg"
        alt=""
        className="pointer-events-none absolute -bottom-8 -right-32 w-[640px] max-w-none opacity-60"
        aria-hidden="true"
      />

      <div className="container relative grid items-center gap-12 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <div>
          <FadeIn>
            <span className="inline-flex items-center gap-2.5 text-[11.5px] font-bold uppercase tracking-[0.24em] text-fog before:h-0.5 before:w-8 before:bg-orange">
              {kick}
            </span>
          </FadeIn>
          <FadeIn delay={100}>
            <h1 className="my-5 font-display text-[clamp(52px,7.6vw,96px)] font-bold uppercase leading-[0.98] tracking-[0.01em]">
              {title1}{' '}
              <em className="block not-italic text-orange [text-shadow:0_0_40px_rgb(249_140_31/0.35)]">
                {title2}
              </em>
            </h1>
          </FadeIn>
          <FadeIn delay={200}>
            <p className="max-w-[46ch] text-[17px] text-fog">{subtitle}</p>
          </FadeIn>
          <FadeIn delay={300}>
            <div className="mt-8 flex flex-wrap gap-3.5">
              <Link
                href={`${prefix}/courses`}
                className="inline-flex items-center gap-2 rounded-full bg-orange px-7 py-3.5 font-display text-sm font-semibold uppercase tracking-[0.1em] text-[#1B1204] shadow-[0_6px_20px_-8px_rgb(249_140_31/0.6)] transition-all hover:-translate-y-px hover:bg-amber hover:shadow-[0_10px_26px_-8px_rgb(249_140_31/0.7)]"
              >
                {cta}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#about"
                className="inline-flex items-center rounded-full border-[1.5px] border-line-2 px-7 py-3.5 font-display text-sm font-semibold uppercase tracking-[0.1em] text-cloud transition-colors hover:border-orange hover:text-orange"
              >
                {ctaSecondary}
              </a>
            </div>
          </FadeIn>
          <FadeIn delay={400}>
            <span className="mt-9 inline-flex items-center gap-3 rounded-full border border-blue-line bg-brand-blue/30 px-4.5 py-2.5 text-[11.5px] tracking-[0.06em] text-fog">
              {supportLabel}{' '}
              <b className="font-bold tracking-[0.14em] text-cloud">{supportName}</b>
            </span>
          </FadeIn>
        </div>

        {/* stats scoreboard */}
        <div className="grid gap-3.5">
          {stats.map((stat, i) => (
            <FadeIn key={stat.label} delay={300 + i * 120}>
              <div className="flex items-baseline gap-4 rounded-[14px] border border-line-2 bg-[linear-gradient(150deg,rgb(4_40_113/0.62),var(--navy))] px-6 py-5 transition-all duration-200 hover:translate-x-1 hover:border-orange/55">
                <b className="num min-w-[120px] font-display text-[44px] font-bold leading-none text-orange">
                  <StatCounter value={stat.value} />
                  {stat.suffix ?? ''}
                </b>
                <span className="text-[13px] font-semibold uppercase tracking-[0.08em] text-fog">
                  {stat.label}
                </span>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}
