'use client'

import { FadeIn } from './FadeIn'
import { Eyebrow } from '@/components/brand'

type Partner = {
  name: string
  url: string
}

type Props = {
  tag: string
  title: string
  description: string
  names: Partner[]
}

export function PartnersSection({ tag, title, description, names }: Props) {
  const doubled = [...names, ...names]

  return (
    <section id="partners" className="scroll-mt-24 overflow-hidden pt-16">
      <div className="container text-center">
        <FadeIn>
          <Eyebrow className="justify-center">{tag}</Eyebrow>
          <h2 className="heading-display mt-2.5 text-[clamp(26px,3.4vw,38px)]">{title}</h2>
        </FadeIn>
        <FadeIn delay={100}>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-fog">{description}</p>
        </FadeIn>
      </div>

      <FadeIn delay={200}>
        <div className="relative mt-8 overflow-hidden border-y border-line py-5 [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
          <div className="flex w-max animate-marquee gap-16 pr-16">
            {doubled.map((partner, i) => (
              <a
                key={`${partner.name}-${i}`}
                href={partner.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-hidden={i >= names.length || undefined}
                tabIndex={i >= names.length ? -1 : undefined}
                className="whitespace-nowrap font-display text-[19px] font-semibold uppercase tracking-[0.14em] text-steel-dim transition-colors duration-200 hover:text-cloud"
              >
                {partner.name}
              </a>
            ))}
          </div>
        </div>
      </FadeIn>
    </section>
  )
}
