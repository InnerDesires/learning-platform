'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Mail, MapPin, Phone, Send } from 'lucide-react'
import { FadeIn } from './FadeIn'
import { AccentLine, Eyebrow } from '@/components/brand'

type Props = {
  tag: string
  title: string
  description: string
  detailsTitle: string
  socialsTitle: string
  write: string
  writeVia: { telegram: string; email: string; phone: string }
  phone: string
  email: string
  address: string
  telegram: string
  telegramManager: string
  instagram: string
  facebook: string
  tiktok: string
  discord: string
}

function WriteMenu({
  label,
  options,
}: {
  label: string
  options: { name: string; href: string; icon: typeof Send; external?: boolean }[]
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointer = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-full bg-orange px-7 py-3.5 font-display text-sm font-semibold uppercase tracking-[0.1em] text-[#1B1204] shadow-[0_6px_20px_-8px_rgb(249_140_31/0.6)] transition-all hover:-translate-y-px hover:bg-amber"
      >
        {label}
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute left-0 top-full z-20 mt-2 min-w-[230px] overflow-hidden rounded-xl border border-line-2 bg-navy-2 p-1.5 shadow-[0_18px_40px_-16px_rgb(0_0_0/0.8)]"
        >
          {options.map(({ name, href, icon: Icon, external }) => (
            <a
              key={name}
              role="menuitem"
              href={href}
              {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-semibold text-cloud transition-colors hover:bg-orange/16 hover:text-amber"
            >
              <Icon className="h-4 w-4 text-orange" />
              {name}
            </a>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export function ContactSection({
  tag,
  title,
  description,
  detailsTitle,
  socialsTitle,
  write,
  writeVia,
  phone,
  email,
  address,
  telegram,
  telegramManager,
  instagram,
  facebook,
  tiktok,
  discord,
}: Props) {
  const socials = [
    { name: 'Telegram', url: telegram },
    { name: 'Instagram', url: instagram },
    { name: 'Facebook', url: facebook },
    { name: 'TikTok', url: tiktok },
    { name: 'Discord', url: discord },
  ]
  const tel = `tel:${phone.replace(/\s/g, '')}`

  const details = [
    { icon: Phone, label: phone, href: tel },
    { icon: Mail, label: email, href: `mailto:${email}` },
    { icon: MapPin, label: address },
  ]

  return (
    <section id="contact" className="scroll-mt-24 py-20 md:py-24">
      <div className="container">
        <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-16">
          <FadeIn>
            <Eyebrow>{tag}</Eyebrow>
            <h2 className="heading-display mt-2.5 text-[clamp(26px,3.4vw,38px)]">{title}</h2>
            <AccentLine className="mt-4" />
            <p className="mt-6 max-w-[42ch] leading-relaxed text-fog">{description}</p>
            <div className="mt-8">
              <WriteMenu
                label={write}
                options={[
                  { name: writeVia.telegram, href: telegramManager, icon: Send, external: true },
                  { name: writeVia.email, href: `mailto:${email}`, icon: Mail },
                  { name: writeVia.phone, href: tel, icon: Phone },
                ]}
              />
            </div>
          </FadeIn>

          <div className="grid gap-5 sm:grid-cols-2">
            <FadeIn delay={100}>
              <div className="h-full rounded-2xl border border-line-2 bg-[linear-gradient(150deg,rgb(4_40_113/0.5),var(--navy))] p-6">
                <h3 className="font-display text-xs font-semibold uppercase tracking-[0.18em] text-amber">
                  {detailsTitle}
                </h3>
                <ul className="mt-5 grid gap-4 text-sm">
                  {details.map(({ icon: Icon, label, href }) => (
                    <li key={label} className="flex items-start gap-3">
                      <span className="grid h-8 w-8 flex-none place-items-center rounded-lg bg-orange/16">
                        <Icon className="h-4 w-4 text-orange" />
                      </span>
                      {href ? (
                        <a href={href} className="mt-1 break-all text-cloud transition-colors hover:text-amber">
                          {label}
                        </a>
                      ) : (
                        <span className="mt-1 text-cloud">{label}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </FadeIn>
            <FadeIn delay={200}>
              <div className="h-full rounded-2xl border border-line-2 bg-[linear-gradient(150deg,rgb(4_40_113/0.5),var(--navy))] p-6">
                <h3 className="font-display text-xs font-semibold uppercase tracking-[0.18em] text-amber">
                  {socialsTitle}
                </h3>
                <ul className="mt-5 flex flex-wrap gap-2.5">
                  {socials.map((social) => (
                    <li key={social.name}>
                      <a
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex rounded-full border border-line-2 px-4 py-2 text-[12px] font-bold uppercase tracking-[0.08em] text-cloud transition-colors hover:border-orange hover:text-orange"
                      >
                        {social.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </FadeIn>
          </div>
        </div>
      </div>
    </section>
  )
}
