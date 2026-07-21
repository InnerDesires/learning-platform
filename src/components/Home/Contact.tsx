'use client'

import { FadeIn } from './FadeIn'

type Props = {
  tag: string
  title: string
  phone: string
  email: string
  address: string
  telegram: string
  telegramManager: string
  instagram: string
  facebook: string
  tiktok: string
  discord: string
  cta: string
  ctaSecondary: string
}

export function ContactSection({
  title,
  phone,
  email,
  address,
  telegramManager,
  telegram,
  instagram,
  facebook,
  tiktok,
  discord,
  cta,
  ctaSecondary,
}: Props) {
  const socials = [
    { name: 'Telegram', url: telegram },
    { name: 'Instagram', url: instagram },
    { name: 'Facebook', url: facebook },
    { name: 'TikTok', url: tiktok },
    { name: 'Discord', url: discord },
  ]

  return (
    <section id="contact" className="container scroll-mt-24 pt-14">
      <FadeIn>
        <div className="relative flex flex-wrap items-center justify-between gap-8 overflow-hidden rounded-[20px] border border-line-2 bg-[linear-gradient(120deg,var(--brand-blue),var(--navy))] p-8 md:p-11">
          <div
            className="pointer-events-none absolute -right-16 -top-16 h-60 w-60 rounded-full"
            style={{ background: 'radial-gradient(circle, rgb(249 140 31 / 0.28), transparent 70%)' }}
            aria-hidden="true"
          />
          <div className="relative min-w-0">
            <h2 className="heading-display text-3xl">{title}</h2>
            <div className="mt-2.5 grid gap-1 text-[13.5px] text-fog">
              <a href={`tel:${phone.replace(/\s/g, '')}`} className="num font-semibold text-cloud hover:text-amber">
                {phone}
              </a>
              <a href={`mailto:${email}`} className="hover:text-cloud">
                {email}
              </a>
              <span>{address}</span>
            </div>
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-[11.5px] font-bold uppercase tracking-[0.1em]">
              {socials.map((social) => (
                <a
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-steel transition-colors hover:text-amber"
                >
                  {social.name}
                </a>
              ))}
            </div>
          </div>
          <div className="relative flex flex-wrap gap-3">
            <a
              href={telegramManager}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-full bg-orange px-7 py-3.5 font-display text-sm font-semibold uppercase tracking-[0.1em] text-[#1B1204] shadow-[0_6px_20px_-8px_rgb(249_140_31/0.6)] transition-all hover:-translate-y-px hover:bg-amber"
            >
              {cta}
            </a>
            <a
              href={`mailto:${email}`}
              className="inline-flex items-center rounded-full border-[1.5px] border-line-2 px-7 py-3.5 font-display text-sm font-semibold uppercase tracking-[0.1em] text-cloud transition-colors hover:border-orange hover:text-orange"
            >
              {ctaSecondary}
            </a>
          </div>
        </div>
      </FadeIn>
    </section>
  )
}
