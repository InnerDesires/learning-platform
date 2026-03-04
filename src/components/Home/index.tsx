'use client'

import type { SiteLocale } from '@/utilities/locales'
import { getHomeContent } from './content'
import { HeroSection } from './Hero'
import { StatsSection } from './Stats'
import { AboutSection } from './About'
import { TeamSection } from './Team'
import { NewsSection } from './News'
import { CoursesSection } from './Courses'
import { PartnersSection } from './Partners'
import { CalendarSection } from './Calendar'
import { VideoSection } from './Video'
import { GallerySection } from './Gallery'
import { FAQSection } from './FAQ'
import { ContactSection } from './Contact'

type Props = {
  locale: SiteLocale
}

export function HomePage({ locale }: Props) {
  const c = getHomeContent(locale)

  return (
    <main>
      <HeroSection {...c.hero} locale={locale} />
      <StatsSection items={c.stats.children} />
      <CoursesSection {...c.courses} locale={locale} />
      <AboutSection {...c.about} locale={locale} />
      <NewsSection {...c.news} locale={locale} />
      <VideoSection locale={locale} />
      <TeamSection {...c.team} />
      <PartnersSection {...c.partners} />
      <CalendarSection {...c.calendar} locale={locale} />
      <GallerySection {...c.gallery} />
      <FAQSection {...c.faq} />
      <ContactSection {...c.contact} locale={locale} />
    </main>
  )
}
