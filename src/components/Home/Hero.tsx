'use client'

import Link from 'next/link'
import { ArrowRight, Award, Check, PlayCircle, Trophy } from 'lucide-react'
import { FadeIn } from './FadeIn'
import { XpChip } from '@/components/brand'

type Props = {
  kick: string
  title1: string
  title2: string
  subtitle: string
  cta: string
  ctaSecondary: string
  supportLabel: string
  supportName: string
  features: string[]
  mock: {
    course: string
    progress: string
    steps: string[]
    quiz: string
    certificate: string
  }
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
  features,
  mock,
  locale,
}: Props) {
  const prefix = locale === 'en' ? '/en' : ''

  return (
    <section className="relative overflow-hidden pb-20 pt-14 md:pb-28 md:pt-20 lg:pt-24">
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(880px 500px at 80% 14%, rgb(4 40 113 / 0.62), transparent 60%), radial-gradient(680px 440px at 8% 92%, rgb(249 140 31 / 0.10), transparent 62%)',
        }}
        aria-hidden="true"
      />
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
        src="/illustrations/hero-lines.svg"
        alt=""
        className="pointer-events-none absolute -bottom-8 -right-32 w-[640px] max-w-none opacity-60"
        aria-hidden="true"
      />

      <div className="container relative grid items-center gap-14 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <div>
          <FadeIn>
            <span className="inline-flex items-center gap-2.5 text-[11.5px] font-bold uppercase tracking-[0.24em] text-fog before:h-0.5 before:w-8 before:bg-orange">
              {kick}
            </span>
          </FadeIn>
          <FadeIn delay={100}>
            <h1 className="my-5 font-display text-[clamp(44px,7vw,92px)] font-bold uppercase leading-[0.98] tracking-[0.01em]">
              {title1}{' '}
              <em className="block not-italic text-orange [text-shadow:0_0_40px_rgb(249_140_31/0.35)]">
                {title2}
              </em>
            </h1>
          </FadeIn>
          <FadeIn delay={200}>
            <p className="max-w-[50ch] text-[17px] leading-relaxed text-fog">{subtitle}</p>
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
              <Link
                href={`${prefix}/register`}
                className="inline-flex items-center rounded-full border-[1.5px] border-line-2 px-7 py-3.5 font-display text-sm font-semibold uppercase tracking-[0.1em] text-cloud transition-colors hover:border-orange hover:text-orange"
              >
                {ctaSecondary}
              </Link>
            </div>
          </FadeIn>
          <FadeIn delay={400}>
            <ul className="mt-9 flex flex-wrap gap-2.5">
              {features.map((feature) => (
                <li
                  key={feature}
                  className="inline-flex items-center gap-2 rounded-full border border-line-2 bg-navy/60 px-3.5 py-1.5 text-[12.5px] font-semibold text-cloud"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-orange" aria-hidden="true" />
                  {feature}
                </li>
              ))}
            </ul>
            <span className="mt-6 inline-flex items-center gap-2.5 text-[11.5px] tracking-[0.06em] text-fog before:h-0.5 before:w-8 before:bg-orange">
              {supportLabel} <b className="font-bold tracking-[0.14em] text-cloud">{supportName}</b>
            </span>
          </FadeIn>
        </div>

        {/* Platform preview: a course in progress, with the rewards the platform gives */}
        <FadeIn delay={300}>
          <div className="relative mx-auto w-full max-w-[440px] pb-10 pt-6 lg:mx-0 lg:ml-auto" aria-hidden="true">
            <div className="overflow-hidden rounded-2xl border border-line-2 bg-[linear-gradient(150deg,rgb(4_40_113/0.62),var(--navy))] shadow-[0_30px_60px_-30px_rgb(0_0_0/0.7)]">
              <div className="relative aspect-[16/9] bg-navy-2">
                <img
                  src="/illustrations/course-leadership.svg"
                  alt=""
                  className="h-full w-full object-cover"
                />
                <span className="absolute inset-0 grid place-items-center">
                  <PlayCircle className="h-14 w-14 text-cloud/90 drop-shadow-lg" strokeWidth={1.5} />
                </span>
              </div>
              <div className="p-5">
                <h3 className="font-display text-lg font-bold uppercase tracking-[0.04em] text-cloud">
                  {mock.course}
                </h3>
                <div className="mt-3 flex items-center gap-3">
                  <div className="pbar flex-1">
                    <i style={{ width: '60%' }} />
                  </div>
                  <span className="num text-xs font-semibold text-fog">{mock.progress}</span>
                </div>
                <ul className="mt-4 grid gap-2.5">
                  {mock.steps.map((step, i) => (
                    <li key={step} className="flex items-center gap-3 text-[13.5px] text-cloud">
                      <span
                        className={
                          i < 2
                            ? 'grid h-5 w-5 flex-none place-items-center rounded-full bg-orange'
                            : 'h-5 w-5 flex-none rounded-full border-[1.5px] border-line-2'
                        }
                      >
                        {i < 2 ? <Check className="h-3 w-3 text-[#1B1204]" strokeWidth={3} /> : null}
                      </span>
                      <span className={i < 2 ? 'text-fog' : undefined}>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <XpChip
              xp={30}
              className="absolute right-2 top-0 -rotate-3 shadow-[0_10px_24px_-10px_rgb(249_140_31/0.7)] sm:-right-4"
            />

            <div className="absolute -bottom-0 left-2 flex items-center gap-3 rounded-xl border border-line-2 bg-void px-4 py-3 shadow-[0_18px_36px_-16px_rgb(0_0_0/0.8)] sm:-left-6">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-orange/16">
                <Award className="h-5 w-5 text-orange" />
              </span>
              <div className="leading-tight">
                <div className="font-display text-[13px] font-bold uppercase tracking-[0.08em] text-cloud">
                  {mock.certificate}
                </div>
                <div className="mt-0.5 flex items-center gap-1.5 text-[11.5px] text-fog">
                  <Trophy className="h-3 w-3 text-amber" />
                  {mock.quiz}
                </div>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
