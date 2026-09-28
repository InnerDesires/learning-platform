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
import { SectionDivider } from '@/components/brand'

type Props = {
  locale: SiteLocale
  calendar: CalendarContent
  newsSlot: ReactNode
  coursesSlot: ReactNode
}

// Order: platform (hero, courses) → live content (news) → the project behind it
// (about) → join a shift (calendar) → trust (partners) → contact.
export function HomePage({ locale, calendar, newsSlot, coursesSlot }: Props) {
  const c = getHomeContent(locale)

  return (
    <main className="overflow-x-clip">
      <HeroSection {...c.hero} locale={locale} />
      <SectionDivider className="-mt-px" />
      <CoursesSection {...c.courses} locale={locale}>
        {coursesSlot}
      </CoursesSection>

      <div id="news" className="band on-paper mt-14 scroll-mt-24">
        <div className="container">{newsSlot}</div>
      </div>

      <AboutSection {...c.about} />

      <div id="calendar" className="band on-paper scroll-mt-24">
        <div className="container">
          <CalendarSection {...calendar} />
        </div>
      </div>

      <PartnersSection {...c.partners} />
      <SectionDivider />
      <ContactSection {...c.contact} />
    </main>
  )
}
