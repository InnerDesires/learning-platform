'use client'

import type { ReactNode } from 'react'
import type { SiteLocale } from '@/utilities/locales'
import { getHomeContent, type CalendarContent } from './content'
import { HeroSection } from './Hero'
import { AboutSection } from './About'
import { CoursesSection } from './Courses'
import { PartnersSection } from './Partners'
import { CalendarSection } from './Calendar'
import { ContactSection } from './Contact'

type Props = {
  locale: SiteLocale
  calendar: CalendarContent
  newsSlot: ReactNode
  coursesSlot: ReactNode
}

export function HomePage({ locale, calendar, newsSlot, coursesSlot }: Props) {
  const c = getHomeContent(locale)

  return (
    <main className="overflow-x-clip">
      <HeroSection {...c.hero} stats={c.stats.children} locale={locale} />
      <CoursesSection {...c.courses} locale={locale}>
        {coursesSlot}
      </CoursesSection>
      <AboutSection {...c.about} />

      {/* warm diagonal band: news + shifts calendar */}
      <div id="news" className="band on-paper mt-14 scroll-mt-24">
        <div className="container">
          {newsSlot}
          <div id="calendar" className="scroll-mt-24">
            <CalendarSection {...calendar} />
          </div>
        </div>
      </div>

      <PartnersSection {...c.partners} />
      <ContactSection {...c.contact} />
    </main>
  )
}
