'use client'

import { Award, BarChart3, ClipboardCheck, PlayCircle, Zap } from 'lucide-react'
import { FadeIn } from './FadeIn'
import { StatCounter } from './Stats'
import { SectionHead } from '@/components/brand'

type Props = {
  tag: string
  title: string
  features: { title: string; text: string }[]
  statsTag: string
  statsTitle: string
  stats: { value: number; label: string }[]
}

// One icon per feature, in the same order as the content.
const ICONS = [PlayCircle, ClipboardCheck, Zap, BarChart3, Award]

export function PlatformSection({ tag, title, features, statsTag, statsTitle, stats }: Props) {
  return (
    <section id="platform" className="container scroll-mt-24 pt-4 md:pt-8">
      <FadeIn>
        <SectionHead eyebrow={tag} title={title} />
      </FadeIn>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 [&>*:last-child:nth-child(odd)]:sm:col-span-2 lg:[&>*:last-child:nth-child(odd)]:col-span-1">
        {features.map((feature, i) => {
          const Icon = ICONS[i % ICONS.length]
          return (
            <FadeIn key={feature.title} delay={i * 80}>
              <div className="flex h-full items-start gap-4 rounded-2xl border border-line-2 bg-[linear-gradient(150deg,rgb(4_40_113/0.5),var(--navy))] p-5 transition-colors hover:border-orange/55 sm:block">
                <span className="grid h-11 w-11 flex-none place-items-center rounded-xl bg-orange/16">
                  <Icon className="h-5 w-5 text-orange" />
                </span>
                <div>
                  <h3 className="sm:mt-4 font-display text-sm font-bold uppercase tracking-[0.1em] text-cloud">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-fog">{feature.text}</p>
                </div>
              </div>
            </FadeIn>
          )
        })}
      </div>

      <FadeIn delay={100}>
        <div className="mt-16 rounded-2xl border border-line-2 bg-navy/50 px-4 py-8 sm:px-6 md:px-10 md:py-10">
          <div className="flex flex-col items-center text-center">
            <span className="eyebrow">{statsTag}</span>
            <h2 className="heading-display mt-2.5 text-[clamp(22px,2.6vw,30px)]">{statsTitle}</h2>
          </div>
          <dl className="mt-8 grid grid-cols-3 gap-3 sm:gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <dd className="order-2">
                  <b className="num block font-display text-[clamp(28px,7vw,60px)] font-extrabold leading-none text-orange">
                    <StatCounter value={stat.value} />
                  </b>
                </dd>
                <dt className="mt-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-fog sm:text-[12.5px] sm:tracking-[0.1em]">
                  {stat.label}
                </dt>
              </div>
            ))}
          </dl>
        </div>
      </FadeIn>
    </section>
  )
}
