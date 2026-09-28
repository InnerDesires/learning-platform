'use client'

import { ArrowRight, Check } from 'lucide-react'
import { FadeIn } from './FadeIn'
import { Eyebrow, AccentLine } from '@/components/brand'
import { LANDING_URL } from './content'

type Props = {
  tag: string
  title: string
  description: string
  description2: string
  goalsTitle: string
  goals: string[]
  support: string
  cta: string
}

export function AboutSection({
  tag,
  title,
  description,
  description2,
  goalsTitle,
  goals,
  support,
  cta,
}: Props) {
  return (
    <section id="about" className="relative scroll-mt-24 overflow-hidden py-24">
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(720px 440px at 12% 10%, rgb(4 40 113 / 0.4), transparent 60%)',
        }}
        aria-hidden="true"
      />
      <div className="container relative">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-start">
          <div>
            <FadeIn>
              <Eyebrow>{tag}</Eyebrow>
              <h2 className="heading-display mt-2.5 text-[clamp(26px,3.4vw,38px)]">{title}</h2>
              <AccentLine className="mt-4" />
            </FadeIn>
            <FadeIn delay={150}>
              <p className="mt-7 leading-relaxed text-fog">{description}</p>
            </FadeIn>
            <FadeIn delay={250}>
              <p className="mt-4 leading-relaxed text-fog">{description2}</p>
            </FadeIn>
            <FadeIn delay={350}>
              <p className="mt-6 text-[13px] leading-relaxed text-steel">{support}</p>
            </FadeIn>
            <FadeIn delay={450}>
              <div className="mt-8 flex flex-wrap gap-3.5">
                <a
                  href={LANDING_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-11 items-center gap-2 rounded-full border-[1.5px] border-line-2 px-6 font-display text-xs font-semibold uppercase tracking-[0.1em] text-cloud transition-colors hover:border-orange hover:text-orange"
                >
                  {cta}
                  <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </div>
            </FadeIn>
          </div>

          <FadeIn delay={300}>
            <div className="rounded-2xl border border-line-2 bg-[linear-gradient(150deg,rgb(4_40_113/0.5),var(--navy))] p-7 md:p-8">
              <h3 className="font-display text-sm font-semibold uppercase tracking-[0.14em] text-amber">
                {goalsTitle}
              </h3>
              <ul className="mt-5 grid gap-3.5">
                {goals.map((goal) => (
                  <li key={goal} className="flex items-start gap-3 text-sm text-cloud">
                    <span className="mt-0.5 grid h-5 w-5 flex-none place-items-center rounded-full bg-orange/16">
                      <Check className="h-3 w-3 text-orange" strokeWidth={3} />
                    </span>
                    {goal}
                  </li>
                ))}
              </ul>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  )
}
