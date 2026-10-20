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
  showCalendar: boolean
  newsSlot: ReactNode
  coursesSlot: ReactNode
}

export function HomePage({ locale, calendar, showCalendar, newsSlot, coursesSlot }: Props) {
  const c = getHomeContent(locale)

  return (
    <main className="overflow-x-clip">
      <HeroSection {...c.hero} stats={c.stats.children} locale={locale} />
      <CoursesSection {...c.courses} locale={locale}>
        {coursesSlot}
      </CoursesSection>
      <AboutSection {...c.about} />

      {(newsSlot || showCalendar) && (
        <div className="band on-paper mt-14">
          <div className="container">
            {newsSlot && (
              <div id="news" className="scroll-mt-24">
                {newsSlot}
              </div>
            )}
            {showCalendar && (
              <div id="calendar" className={newsSlot ? 'mt-16 scroll-mt-24' : 'scroll-mt-24'}>
                <CalendarSection {...calendar} />
              </div>
            )}
          </div>
        </div>
      )}

      <PartnersSection {...c.partners} />
      <ContactSection {...c.contact} />
    </main>
  )
}
