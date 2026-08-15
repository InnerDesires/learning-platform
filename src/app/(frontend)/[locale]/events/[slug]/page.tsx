import type { Metadata } from 'next/types'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import React from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, CalendarDays, Clock, MapPin, Users, Video } from 'lucide-react'

import { locales, type SiteLocale } from '@/utilities/locales'
import { getFrontendMessages } from '@/utilities/i18n'
import { plural } from '@/utilities/plural'
import type { Event, Media as MediaType } from '@/payload-types'
import { getServerSideURL } from '@/utilities/getURL'
import {
  formatEventDate,
  formatEventRange,
  formatEventTime,
  getEventTimes,
  isEventPast,
} from '@/utilities/eventTime'
import { EventUserStateProvider } from '@/components/Events/EventUserState'
import { EventActionBar } from '@/components/Events/EventActionBar'
import { EventJoinCard } from '@/components/Events/EventJoinCard'
import { AddToCalendar } from '@/components/Events/AddToCalendar'

export const revalidate = 300

export async function generateStaticParams() {
  const payload = await getPayload({ config: configPromise })
  const events = await payload.find({
    collection: 'events',
    draft: false,
    limit: 1000,
    overrideAccess: false,
    pagination: false,
    where: { _status: { equals: 'published' } },
    select: { slug: true },
  })

  return events.docs.flatMap(({ slug }) => locales.map((locale) => ({ locale, slug })))
}

type Args = {
  params: Promise<{ locale: SiteLocale; slug: string }>
}

async function queryEventBySlug(locale: SiteLocale, slug: string): Promise<Event | undefined> {
  const payload = await getPayload({ config: configPromise })
  // overrideAccess: false — published only, meeting link stripped from the
  // static render (registered users fetch it client-side).
  const result = await payload.find({
    collection: 'events',
    locale,
    depth: 1,
    draft: false,
    overrideAccess: false,
    where: {
      slug: { equals: slug },
      _status: { equals: 'published' },
    },
    limit: 1,
  })
  return result.docs[0] as Event | undefined
}

export default async function EventPage({ params: paramsPromise }: Args) {
  const { locale, slug } = await paramsPromise
  const t = getFrontendMessages(locale)
  const payload = await getPayload({ config: configPromise })

  const event = await queryEventBySlug(locale, slug)
  if (!event) notFound()

  const { totalDocs: enrolledCount } = await payload.count({
    collection: 'event-enrollments',
    where: { event: { equals: event.id } },
  })

  const cover = event.cover && typeof event.cover === 'object' ? (event.cover as MediaType) : null
  const coverUrl = cover?.sizes?.large?.url || cover?.sizes?.xlarge?.url || cover?.url
  const prefix = locale === 'en' ? '/en' : ''
  const past = isEventPast(event)
  const isFull = typeof event.capacity === 'number' && enrolledCount >= event.capacity
  const seatsLeft =
    typeof event.capacity === 'number' ? Math.max(event.capacity - enrolledCount, 0) : null
  const { startsAt, endsAt } = getEventTimes(event)
  const multiDay = startsAt.toDateString() !== endsAt.toDateString()
  const eventUrl = `${getServerSideURL()}${prefix}/events/${event.slug}`

  return (
    <EventUserStateProvider eventId={event.id}>
      <div className="pb-16">
        <div className="relative overflow-hidden">
          {coverUrl && (
            <Image
              src={coverUrl}
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover opacity-25"
            />
          )}
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(720px 440px at 85% 0%, rgb(4 40 113 / 0.5), transparent 60%), linear-gradient(180deg, rgb(34 52 88 / 0.86) 0%, var(--void) 100%)',
            }}
          />
          <div className="relative container max-w-5xl pb-12 pt-14">
            <Link
              href={`${prefix}/events`}
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.08em] text-fog transition-colors hover:text-orange"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              {t.eventBackToEvents}
            </Link>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <span className="chip">
                {event.locationType === 'virtual' ? t.eventOnline : t.eventOffline}
              </span>
              {past && (
                <span className="rounded-full bg-navy-2 px-3 py-1 font-display text-[10.5px] font-semibold uppercase tracking-[0.12em] text-fog">
                  {t.eventFinished}
                </span>
              )}
              {!past && seatsLeft !== null && !isFull && (
                <span className="num rounded-full bg-orange/15 px-3 py-1 font-display text-[10.5px] font-semibold uppercase tracking-[0.12em] text-orange">
                  {t.eventSeatsLeft} {seatsLeft}
                </span>
              )}
            </div>

            <h1
              className="heading-display mb-3.5 mt-4 max-w-[22ch] text-[clamp(34px,4.6vw,54px)] font-bold leading-[1.04]"
              data-testid="event-page-title"
            >
              {event.title}
            </h1>

            {event.description && (
              <p className="max-w-[62ch] text-[15px] leading-relaxed text-fog">
                {event.description}
              </p>
            )}

            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-[13.5px] font-semibold text-fog">
              <span className="num flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-orange" />
                {formatEventRange(event, locale)}
              </span>
              {multiDay && (
                <span className="num flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orange" />
                  {formatEventTime(startsAt, locale)}
                </span>
              )}
              {enrolledCount > 0 && (
                <span className="num flex items-center gap-2">
                  <Users className="h-4 w-4 text-orange" />
                  {enrolledCount} {plural(locale, enrolledCount, t.eventParticipantsPlural)}
                </span>
              )}
            </div>

            <div className="mt-7">
              <EventActionBar
                eventId={event.id}
                eventSlug={event.slug}
                isPast={past}
                isFull={isFull}
                localePrefix={prefix}
                labels={{
                  signIn: t.eventSignIn,
                  loginToEnroll: t.eventLoginToEnroll,
                  enroll: t.eventEnroll,
                  unenroll: t.eventUnenroll,
                  unenrollConfirm: t.eventUnenrollConfirm,
                  enrolledBadge: t.eventEnrolledBadge,
                  full: t.eventFull,
                  finished: t.eventFinished,
                }}
              />
            </div>
          </div>
        </div>

        <div className="container max-w-5xl">
          <div className="mt-10 grid gap-6 md:grid-cols-[1.5fr_1fr]">
            <div className="space-y-6">
              {event.locationType === 'local' ? (
                <div className="rounded-[14px] border border-line bg-card p-6">
                  <h3 className="flex items-center gap-2.5 font-display text-sm font-bold uppercase tracking-[0.08em]">
                    <span className="flex h-9 w-9 flex-none items-center justify-center rounded-[10px] bg-orange/15 text-orange">
                      <MapPin className="h-4.5 w-4.5" />
                    </span>
                    {t.eventLocationTitle}
                  </h3>
                  {event.address && (
                    <p className="mt-4 text-[14.5px] leading-relaxed text-cloud">{event.address}</p>
                  )}
                  {event.mapLink && (
                    <a
                      href={event.mapLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-2 rounded-full border border-line-2 px-4 py-2 font-display text-[11px] font-semibold uppercase tracking-[0.1em] text-fog transition-colors hover:border-orange hover:text-orange"
                    >
                      <MapPin className="h-3.5 w-3.5" />
                      {t.eventOpenMap}
                    </a>
                  )}
                </div>
              ) : (
                <EventJoinCard locale={locale} isPast={past} />
              )}

              {!past && (
                <div className="rounded-[14px] border border-line bg-card p-6">
                  <AddToCalendar event={event} locale={locale} eventUrl={eventUrl} />
                </div>
              )}
            </div>

            <div className="rounded-[14px] border border-line bg-card p-6">
              <h3 className="font-display text-sm font-bold uppercase tracking-[0.08em]">
                {event.locationType === 'virtual' ? (
                  <span className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 flex-none items-center justify-center rounded-[10px] bg-blue-ill/15 text-blue-ill">
                      <Video className="h-4.5 w-4.5" />
                    </span>
                    {t.eventOnline}
                  </span>
                ) : (
                  <span className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 flex-none items-center justify-center rounded-[10px] bg-orange/15 text-orange">
                      <CalendarDays className="h-4.5 w-4.5" />
                    </span>
                    {formatEventDate(startsAt, locale)}
                  </span>
                )}
              </h3>
              <dl className="mt-4 space-y-2.5 text-[13.5px]">
                <div className="flex justify-between gap-4 border-b border-line pb-2.5">
                  <dt className="text-steel">{t.eventStartLabel}</dt>
                  <dd className="num font-semibold text-cloud">
                    {formatEventDate(startsAt, locale)}, {formatEventTime(startsAt, locale)}
                  </dd>
                </div>
                {event.endDate && (
                  <div className="flex justify-between gap-4 border-b border-line pb-2.5">
                    <dt className="text-steel">{t.eventEndLabel}</dt>
                    <dd className="num font-semibold text-cloud">
                      {formatEventDate(endsAt, locale)}, {formatEventTime(endsAt, locale)}
                    </dd>
                  </div>
                )}
                {event.capacity != null && (
                  <div className="flex justify-between gap-4">
                    <dt className="text-steel">{t.eventSeatsLeft}</dt>
                    <dd className="num font-semibold text-cloud">
                      {seatsLeft} / {event.capacity}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        </div>
      </div>
    </EventUserStateProvider>
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { locale, slug } = await paramsPromise
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'events',
    locale,
    draft: false,
    overrideAccess: false,
    where: { slug: { equals: slug }, _status: { equals: 'published' } },
    limit: 1,
    depth: 0,
    select: { title: true },
  })
  const event = result.docs[0]
  if (!event) return {}
  return { title: `${event.title} | Залізна Зміна` }
}
