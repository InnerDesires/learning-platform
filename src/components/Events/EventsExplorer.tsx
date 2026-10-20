'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, CalendarDays, MapPin, Video } from 'lucide-react'

import type { SiteLocale } from '@/utilities/locales'
import { getFrontendMessages } from '@/utilities/i18n'
import { filterPill } from '@/components/Courses/CategoryFilter'
import { plural } from '@/utilities/plural'
import { FadeIn } from '@/components/Home/FadeIn'
import { Media } from '@/components/Media'
import { formatEventRange, getEventTimes } from '@/utilities/eventTime'
import { EventCard, type EventCardData } from './EventCard'
import { useMyEventEnrollments } from './useMyEventEnrollments'

type Props = {
  events: EventCardData[]
  locale: SiteLocale
  /** Time the page was rendered — the first client render must match the SSR HTML. */
  serverNow: string
}

type Tab = 'upcoming' | 'past'

function Countdown({ startsAt, now, locale }: { startsAt: Date; now: Date; locale: SiteLocale }) {
  const t = getFrontendMessages(locale)
  const diffMs = startsAt.getTime() - now.getTime()
  if (diffMs <= 0) {
    return <span className="text-success">{t.eventStartsNow}</span>
  }
  const minutes = Math.floor(diffMs / 60000)
  const days = Math.floor(minutes / (60 * 24))
  const hours = Math.floor((minutes % (60 * 24)) / 60)

  const [value, pluralForms] =
    days > 0
      ? [days, t.eventStartsInDaysPlural]
      : hours > 0
        ? [hours, t.eventStartsInHoursPlural]
        : [Math.max(minutes, 1), t.eventStartsInMinutesPlural]

  return (
    <span className="num">
      <b className="text-orange">{value}</b> {plural(locale, value, pluralForms)}{' '}
      {t.eventStartsInSuffix}
    </span>
  )
}

export function EventsExplorer({ events, locale, serverNow }: Props) {
  const t = getFrontendMessages(locale)
  const prefix = locale === 'en' ? '/en' : ''
  const [tab, setTab] = useState<Tab>('upcoming')
  const [now, setNow] = useState(() => new Date(serverNow))
  const { enrolledEventIds } = useMyEventEnrollments()

  // Swap the prerendered clock for the live one after hydration, then keep the
  // countdown fresh.
  useEffect(() => {
    setNow(new Date())
    const interval = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(interval)
  }, [])

  const { upcoming, past } = useMemo(() => {
    const upcomingList: EventCardData[] = []
    const pastList: EventCardData[] = []
    for (const event of events) {
      if (getEventTimes(event).endsAt < now) pastList.push(event)
      else upcomingList.push(event)
    }
    upcomingList.sort((a, b) => +new Date(a.startDate) - +new Date(b.startDate))
    pastList.sort((a, b) => +new Date(b.startDate) - +new Date(a.startDate))
    return { upcoming: upcomingList, past: pastList }
  }, [events, now])

  const [featured, ...restUpcoming] = upcoming
  const featuredCover =
    featured?.cover && typeof featured.cover === 'object' ? featured.cover : null

  return (
    <div>
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'upcoming'}
          className={filterPill(tab === 'upcoming')}
          onClick={() => setTab('upcoming')}
        >
          {t.eventsUpcoming}
          <span className="num ml-1.5 opacity-70">{upcoming.length}</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'past'}
          className={filterPill(tab === 'past')}
          onClick={() => setTab('past')}
        >
          {t.eventsPast}
          <span className="num ml-1.5 opacity-70">{past.length}</span>
        </button>
      </div>

      {tab === 'upcoming' && (
        <div className="mt-7">
          {upcoming.length === 0 && (
            <p className="rounded-[14px] border border-dashed border-line-2 px-6 py-12 text-center text-sm text-fog">
              {t.eventsEmptyUpcoming}
            </p>
          )}

          {featured && (
            <FadeIn>
              <Link
                href={`${prefix}/events/${featured.slug}`}
                className="group relative mb-6 flex min-h-[240px] flex-col justify-end overflow-hidden rounded-[16px] border border-line transition-all duration-200 hover:border-orange/60"
              >
                <div className="absolute inset-0 bg-ink">
                  {featuredCover ? (
                    <Media
                      resource={featuredCover}
                      size="100vw"
                      imgClassName="h-full w-full object-cover opacity-45 transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div
                      className="h-full w-full"
                      style={{
                        background:
                          'radial-gradient(720px 400px at 85% 0%, rgb(4 40 113 / 0.55), transparent 60%), radial-gradient(420px 260px at 10% 100%, rgb(249 140 31 / 0.22), transparent 60%), linear-gradient(180deg, var(--navy-2) 0%, var(--void) 100%)',
                      }}
                    />
                  )}
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        'linear-gradient(180deg, transparent 20%, rgb(11 19 39 / 0.92) 85%)',
                    }}
                  />
                </div>
                <div className="relative flex flex-col gap-2.5 p-6 md:p-8">
                  <span className="eyebrow">{t.eventsNextEvent}</span>
                  <h2 className="heading-display max-w-[26ch] text-[clamp(24px,3.4vw,38px)] font-bold leading-[1.08] transition-colors group-hover:text-amber">
                    {featured.title}
                  </h2>
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[13px] font-semibold text-fog">
                    <span className="num flex items-center gap-1.5">
                      <CalendarDays className="h-4 w-4 text-orange" />
                      {formatEventRange(featured, locale)}
                    </span>
                    {featured.locationType === 'virtual' ? (
                      <span className="flex items-center gap-1.5">
                        <Video className="h-4 w-4 text-blue-ill" />
                        {t.eventOnline}
                      </span>
                    ) : (
                      featured.address && (
                        <span className="flex items-center gap-1.5">
                          <MapPin className="h-4 w-4 text-orange" />
                          {featured.address}
                        </span>
                      )
                    )}
                    <span className="flex items-center gap-1.5">
                      <Countdown
                        startsAt={getEventTimes(featured).startsAt}
                        now={now}
                        locale={locale}
                      />
                    </span>
                  </div>
                  <span className="mt-1 inline-flex items-center gap-2 font-display text-xs font-semibold uppercase tracking-[0.1em] text-orange">
                    {enrolledEventIds.includes(featured.id) ? t.eventEnrolledBadge : t.eventEnroll}
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            </FadeIn>
          )}

          {restUpcoming.length > 0 && (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {restUpcoming.map((event, i) => (
                <FadeIn key={event.id} delay={i * 80}>
                  <EventCard
                    event={event}
                    locale={locale}
                    isPast={false}
                    isEnrolled={enrolledEventIds.includes(event.id)}
                    className="h-full"
                  />
                </FadeIn>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'past' && (
        <div className="mt-7">
          {past.length === 0 ? (
            <p className="rounded-[14px] border border-dashed border-line-2 px-6 py-12 text-center text-sm text-fog">
              {t.eventsEmptyPast}
            </p>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {past.map((event, i) => (
                <FadeIn key={event.id} delay={i * 60}>
                  <EventCard event={event} locale={locale} isPast className="h-full" />
                </FadeIn>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
