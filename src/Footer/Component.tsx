import { getCachedGlobal } from '@/utilities/getGlobals'
import Link from 'next/link'
import React from 'react'

import type { Footer } from '@/payload-types'
import type { SiteLocale } from '@/utilities/locales'

import { CMSLink } from '@/components/Link'
import { Brand } from '@/components/Logo/Brand'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { Rails } from '@/components/brand'
import { getFrontendMessages } from '@/utilities/i18n'
import { getHomeContent } from '@/components/Home/content'

export async function Footer({ locale }: { locale: SiteLocale }) {
  const footerData: Footer = await getCachedGlobal('footer', 1, locale)()
  const t = getFrontendMessages(locale)
  const contact = getHomeContent(locale).contact

  const navItems = footerData?.navItems || []
  const prefix = locale === 'en' ? '/en' : ''

  const projectLinks = [
    { label: t.footerAbout, href: `${prefix}/#about` },
    { label: t.footerCalendar, href: `${prefix}/#calendar` },
    { label: t.footerPartners, href: `${prefix}/#partners` },
    { label: t.footerContact, href: `${prefix}/#contact` },
  ]

  return (
    <footer className="relative mt-24 overflow-hidden border-t border-line">
      <div className="container">
        <div
          className="select-none whitespace-nowrap pb-2.5 pt-8 font-display text-[clamp(48px,9vw,118px)] font-extrabold uppercase leading-none tracking-[0.02em] text-[rgb(147_160_190/0.07)]"
          aria-hidden="true"
        >
          {t.brandName1} {t.brandName2}
        </div>
        <Rails />

        <div className="grid gap-10 py-9 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div>
            <Brand locale={locale} size="lg" />
            <p className="mt-3.5 max-w-[30ch] text-[12.5px] leading-relaxed text-fog">
              {t.footerMission}
            </p>
          </div>

          <div>
            <h4 className="mb-3.5 font-display text-xs font-semibold uppercase tracking-[0.22em] text-orange">
              {t.footerColPlatform}
            </h4>
            <ul className="grid gap-2 text-[13px]">
              {navItems.map(({ link }, i) => (
                <li key={i}>
                  <CMSLink className="text-fog transition-colors hover:text-cloud" {...link} />
                </li>
              ))}
              <li>
                <Link
                  href={`${prefix}/leaderboard`}
                  className="text-fog transition-colors hover:text-cloud"
                >
                  {t.footerLeaderboard}
                </Link>
              </li>
              <li>
                <Link
                  href={`${prefix}/certificates`}
                  className="text-fog transition-colors hover:text-cloud"
                >
                  {t.footerCertificates}
                </Link>
              </li>
              <li>
                <Link
                  href={`${prefix}/search`}
                  className="text-fog transition-colors hover:text-cloud"
                >
                  {t.footerSearch}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3.5 font-display text-xs font-semibold uppercase tracking-[0.22em] text-orange">
              {t.footerColProject}
            </h4>
            <ul className="grid gap-2 text-[13px]">
              {projectLinks.map(({ label, href }) => (
                <li key={href}>
                  <Link href={href} className="text-fog transition-colors hover:text-cloud">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-3.5 font-display text-xs font-semibold uppercase tracking-[0.22em] text-orange">
              {t.footerColContacts}
            </h4>
            <ul className="grid gap-2 text-[13px]">
              <li>
                <a
                  href={`tel:${contact.phone.replace(/\s/g, '')}`}
                  className="num text-fog transition-colors hover:text-cloud"
                >
                  {contact.phone}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${contact.email}`}
                  className="text-fog transition-colors hover:text-cloud"
                >
                  {contact.email}
                </a>
              </li>
              <li>
                <a
                  href={contact.telegram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-fog transition-colors hover:text-cloud"
                >
                  Telegram
                </a>
                <span className="text-steel-dim"> · </span>
                <a
                  href={contact.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-fog transition-colors hover:text-cloud"
                >
                  Instagram
                </a>
              </li>
              <li className="text-steel-dim">{contact.address}</li>
            </ul>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line pb-6 pt-4 text-[11.5px] text-steel-dim">
          <span>{t.footerRights}</span>
          <LanguageSwitcher />
        </div>
      </div>
    </footer>
  )
}
