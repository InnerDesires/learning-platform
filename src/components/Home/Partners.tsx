'use client'

import { FadeIn } from './FadeIn'
import { AccentLine, Eyebrow } from '@/components/brand'

type Partner = {
  name: string
  url: string
  logo: string
}

type Props = {
  tag: string
  title: string
  description: string
  items: Partner[]
}

// The first three are the project's main supporters and get larger tiles.
const FEATURED_COUNT = 3

function PartnerTile({ partner, featured }: { partner: Partner; featured?: boolean }) {
  return (
    <a
      href={partner.url}
      target="_blank"
      rel="noopener noreferrer"
      title={partner.name}
      aria-label={partner.name}
      className={`group flex w-full items-center justify-center rounded-2xl border border-line-2 bg-[linear-gradient(150deg,rgb(4_40_113/0.5),var(--navy))] transition-all duration-300 hover:-translate-y-1 hover:border-orange/60 hover:shadow-[0_18px_36px_-18px_rgb(249_140_31/0.45)] focus-visible:outline-2 focus-visible:outline-orange ${
        featured ? 'h-24 p-5 sm:h-40 sm:p-8' : 'h-24 p-4 sm:h-28 sm:p-5'
      }`}
    >
      <img
        src={partner.logo}
        alt={partner.name}
        loading="lazy"
        decoding="async"
        className={`max-h-full w-auto object-contain opacity-90 transition-transform duration-300 group-hover:scale-105 group-hover:opacity-100 ${
          featured ? 'max-w-[85%]' : 'max-w-[80%]'
        }`}
      />
    </a>
  )
}

export function PartnersSection({ tag, title, description, items }: Props) {
  const featured = items.slice(0, FEATURED_COUNT)
  const rest = items.slice(FEATURED_COUNT)

  return (
    <section id="partners" className="scroll-mt-24 py-20 md:py-24">
      <div className="container">
        <FadeIn>
          <div className="flex flex-col items-center text-center">
            <Eyebrow>{tag}</Eyebrow>
            <h2 className="heading-display mt-2.5 text-[clamp(26px,3.4vw,38px)]">{title}</h2>
            <AccentLine className="mt-4" />
          </div>
        </FadeIn>
        <FadeIn delay={100}>
          <p className="mx-auto mt-6 max-w-2xl text-center text-sm leading-relaxed text-fog">
            {description}
          </p>
        </FadeIn>

        <FadeIn delay={200}>
          <ul className="mx-auto mt-10 grid max-w-5xl grid-cols-1 gap-4 min-[480px]:grid-cols-3 sm:gap-5">
            {featured.map((partner) => (
              <li key={partner.name}>
                <PartnerTile partner={partner} featured />
              </li>
            ))}
          </ul>
          <ul className="mx-auto mt-4 flex max-w-5xl flex-wrap justify-center gap-4 sm:mt-5 sm:gap-5">
            {rest.map((partner) => (
              <li key={partner.name} className="w-[calc(50%-8px)] sm:w-[calc(33.333%-14px)] lg:w-[calc(25%-15px)]">
                <PartnerTile partner={partner} />
              </li>
            ))}
          </ul>
        </FadeIn>
      </div>
    </section>
  )
}
