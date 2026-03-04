'use client'

import { FadeIn } from './FadeIn'

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
  return (
    <section className="py-32 overflow-hidden">
      <div className="container">
        <div className="text-center mb-16">
          <FadeIn className="inline-block px-4 py-1.5 rounded-full bg-[#F99E2D]/10 text-[#F99E2D] text-sm font-semibold tracking-wider uppercase mb-6">
            {tag}
          </FadeIn>
          <FadeIn delay={100} className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            {title}
          </FadeIn>
          <FadeIn delay={200} className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {description}
          </FadeIn>
        </div>
      </div>

      <FadeIn delay={300}>
        <MarqueeRow logos={logos} />
      </FadeIn>
    </section>
  )
}
