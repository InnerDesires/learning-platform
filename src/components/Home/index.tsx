'use client'

import type { ReactNode } from 'react'
import type { SiteLocale } from '@/utilities/locales'
import { getHomeContent, type CalendarContent } from './content'
import { HeroSection } from './Hero'
import { AboutSection } from './About'
import { PlatformSection } from './Platform'
import { CoursesSection } from './Courses'
import { PartnersSection } from './Partners'
import { CalendarSection } from './Calendar'
import { ContactSection } from './Contact'
import { SectionDivider } from '@/components/brand'

type Props = {
  locale: SiteLocale
  calendar: CalendarContent
  showCalendar: boolean
  newsSlot: ReactNode
  coursesSlot: ReactNode
}

// Order: hero → about → platform & achievements → courses → news & shift calendar
// → partners → contact.
export function HomePage({ locale, calendar, showCalendar, newsSlot, coursesSlot }: Props) {
  const c = getHomeContent(locale)

  return (
    <main className="overflow-x-clip">
      <HeroSection {...c.hero} locale={locale} />
      <SectionDivider className="-mt-px" />
      <AboutSection {...c.about} />
      <PlatformSection {...c.platform} />
      <CoursesSection {...c.courses} locale={locale} className="mt-16">
        {coursesSlot}
      </CoursesSection>

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
      <SectionDivider />
      <ContactSection {...c.contact} />
    </main>
  )
}
