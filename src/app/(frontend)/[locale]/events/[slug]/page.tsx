import type { Metadata } from 'next/types'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import React, { cache } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, CalendarDays, Clock3, MapPin, Users, Video } from 'lucide-react'

import { locales, type SiteLocale } from '@/utilities/locales'
import { getFrontendMessages } from '@/utilities/i18n'
import { plural } from '@/utilities/plural'
import type { Event, Media as MediaType } from '@/payload-types'
import { getPreviewAwareServerURL } from '@/utilities/getURL'
import { AccentLine } from '@/components/brand'
import {
  formatEventDate,
  formatEventDayNumber,
  formatEventMonthShort,
  formatEventRange,
  formatEventTime,
  getEventTimes,
  isEventPast,
} from '@/utilities/eventTime'
import { EventUserStateProvider } from '@/components/Events/EventUserState'
import { EventActionBar } from '@/components/Events/EventActionBar'
import { EventJoinCard } from '@/components/Events/EventJoinCard'
import { AddToCalendar } from '@/components/Events/AddToCalendar'
import { InteractionSection } from '@/components/CommentsAndLikes/InteractionSection'
import { ShareButtons } from '@/components/ShareButtons'

export const revalidate = 300

type Args = {
  params: Promise<{ locale: SiteLocale; slug: string }>
}

function eventPageUrl(locale: SiteLocale, slug: string): string {
  const base = getPreviewAwareServerURL()
  return `${base}${locale === 'en' ? '/en' : ''}/events/${encodeURIComponent(slug)}`
}

const queryEventBySlug = cache(async (locale: SiteLocale, slug: string): Promise<Event | undefined> => {
  const payload = await getPayload({ config: configPromise })
  // The meeting link is excluded from the shared ISR page by field access.
  const result = await payload.find({
    collection: 'events',
    locale,
    depth: 1,
    draft: false,
    overrideAccess: false,
    where: { slug: { equals: slug }, _status: { equals: 'published' } },
    limit: 1,
  })
  return result.docs[0] as Event | undefined
})

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

export default async function EventPage({ params: paramsPromise }: Args) {
  const { locale, slug } = await paramsPromise
  const t = getFrontendMessages(locale)
  const event = await queryEventBySlug(locale, slug)
  if (!event) notFound()

  const payload = await getPayload({ config: configPromise })
  const { totalDocs: enrolledCount } = await payload.count({
    collection: 'event-enrollments',
    where: { event: { equals: event.id } },
  })

  const cover = event.cover && typeof event.cover === 'object' ? (event.cover as MediaType) : null
  const coverUrl = cover?.sizes?.large?.url || cover?.sizes?.xlarge?.url || cover?.url
  const prefix = locale === 'en' ? '/en' : ''
  const past = isEventPast(event)
  const isFull = typeof event.capacity === 'number' && enrolledCount >= event.capacity
  const seatsLeft = typeof event.capacity === 'number' ? Math.max(event.capacity - enrolledCount, 0) : null
  const { startsAt, endsAt } = getEventTimes(event)
  const eventUrl = eventPageUrl(locale, event.slug)
  const locationLabel = event.locationType === 'virtual' ? t.eventOnline : t.eventOffline
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.title,
    description: event.description || undefined,
    startDate: startsAt.toISOString(),
    endDate: event.endDate ? endsAt.toISOString() : undefined,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: event.locationType === 'virtual'
      ? 'https://schema.org/OnlineEventAttendanceMode'
      : 'https://schema.org/OfflineEventAttendanceMode',
    location: event.locationType === 'virtual'
      ? { '@type': 'VirtualLocation', url: eventUrl }
      : { '@type': 'Place', name: event.address || t.eventOffline, address: event.address },
    image: coverUrl ? new URL(coverUrl, new URL(eventUrl).origin).href : undefined,
    url: eventUrl,
  }

  return (
    <EventUserStateProvider eventId={event.id}>
      <article className="pb-16">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }}
        />
        <header className="relative overflow-hidden border-b border-line">
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(720px 440px at 85% 0%, rgb(4 40 113 / 0.5), transparent 60%), linear-gradient(180deg, rgb(34 52 88 / 0.86) 0%, var(--void) 100%)',
            }}
            aria-hidden="true"
          />
          <img
            src="/illustrations/hero-lines.svg"
            alt=""
            className="pointer-events-none absolute -bottom-8 -right-32 w-[560px] max-w-none opacity-40"
            aria-hidden="true"
          />
          <div className="container relative max-w-6xl py-10 lg:py-14">
            <Link
              href={`${prefix}/events`}
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.08em] text-fog transition-colors hover:text-orange"
            >
              <ArrowLeft className="h-4 w-4" />
              {t.eventBackToEvents}
            </Link>

            <div className="mt-7 grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.72fr)] lg:gap-14">
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="chip">{locationLabel}</span>
                  {past && <span className="rounded-full bg-navy-2 px-3 py-1 text-xs font-semibold text-fog">{t.eventFinished}</span>}
                  {!past && seatsLeft !== null && !isFull && (
                    <span className="rounded-full bg-orange/15 px-3 py-1 text-xs font-semibold text-orange">
                      {t.eventSeatsLeft} {seatsLeft}
                    </span>
                  )}
                </div>
                <h1
                  className="heading-display mt-5 max-w-[18ch] text-[clamp(2.5rem,5vw,4.5rem)] font-bold leading-[1.06]"
                  data-testid="event-page-title"
                >
                  {event.title}
                </h1>
                <AccentLine className="mt-4" />
                {event.description && (
                  <p className="mt-5 max-w-[56ch] text-base leading-relaxed text-fog lg:text-lg">
                    {event.description}
                  </p>
                )}
                <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-medium text-cloud">
                  <time dateTime={event.startDate} className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-orange" />
                    {formatEventRange(event, locale)}
                  </time>
                  {enrolledCount > 0 && (
                    <span className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-orange" />
                      {enrolledCount} {plural(locale, enrolledCount, t.eventParticipantsPlural)}
                    </span>
                  )}
                </div>
                <p className="mt-2 pl-6 text-xs text-steel">{t.eventTimeZone}</p>
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

              <div className="relative hidden h-[300px] overflow-hidden rounded-2xl border border-white/10 bg-navy-2 shadow-2xl sm:block lg:h-[340px]">
                {coverUrl ? (
                  <Image
                    src={coverUrl}
                    alt={cover?.alt || event.title}
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 40vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_20%,rgba(249,140,31,0.23),transparent_38%),linear-gradient(145deg,#243c62,#101a2f)]" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-transparent to-transparent" />
                <div className="absolute bottom-6 left-6 flex items-end gap-4">
                  <div className="rounded-xl bg-ink/90 px-4 py-3 text-center backdrop-blur">
                    <b className="block font-display text-4xl leading-none text-orange">{formatEventDayNumber(startsAt)}</b>
                    <span className="mt-1 block text-xs font-bold uppercase tracking-wider text-cloud">{formatEventMonthShort(startsAt, locale)}</span>
                  </div>
                  <span className="mb-1 text-sm font-semibold text-white">{formatEventTime(startsAt, locale)} · {t.eventTimeZone}</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="container max-w-6xl pt-8 lg:pt-10">
          <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="min-w-0 space-y-6">
              <section aria-label={t.eventLocationTitle}>
                {event.locationType === 'virtual' ? (
                  <EventJoinCard locale={locale} isPast={past} />
                ) : (
                  <div className="rounded-2xl border border-line bg-card p-6">
                    <h2 className="flex items-center gap-3 font-display text-base font-bold">
                      <MapPin className="h-5 w-5 text-orange" /> {t.eventLocationTitle}
                    </h2>
                    {event.address && <p className="mt-4 text-base leading-relaxed text-cloud">{event.address}</p>}
                    {event.mapLink && (
                      <a href={event.mapLink} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-orange hover:text-amber">
                        {t.eventOpenMap} <ArrowLeft className="h-4 w-4 rotate-[135deg]" />
                      </a>
                    )}
                  </div>
                )}
              </section>

              {!past && (
                <section className="rounded-2xl border border-line bg-card p-6" aria-label={t.eventAddToCalendar}>
                  <AddToCalendar event={event} locale={locale} eventUrl={eventUrl} />
                </section>
              )}

              <section aria-label={t.shareLabel}>
                <ShareButtons
                  url={eventUrl}
                  title={event.title}
                  label={t.shareLabel}
                  copyLabel={t.shareCopyLink}
                  copiedLabel={t.copied}
                />
              </section>
            </div>

            <aside className="rounded-2xl border border-line bg-card p-6 lg:sticky lg:top-24">
              <h2 className="flex items-center gap-2.5 font-display text-base font-bold">
                {event.locationType === 'virtual' ? <Video className="h-5 w-5 text-blue-ill" /> : <MapPin className="h-5 w-5 text-orange" />}
                {t.eventScheduleTitle}
              </h2>
              <dl className="mt-6 space-y-5 text-sm">
                <div>
                  <dt className="text-steel">{t.eventStartLabel}</dt>
                  <dd className="mt-1 font-semibold text-cloud">{formatEventDate(startsAt, locale)}</dd>
                  <dd className="font-display text-2xl font-bold text-orange">{formatEventTime(startsAt, locale)}</dd>
                </div>
                {event.endDate && (
                  <div className="border-t border-line pt-4">
                    <dt className="text-steel">{t.eventEndLabel}</dt>
                    <dd className="mt-1 font-semibold text-cloud">{formatEventDate(endsAt, locale)}</dd>
                    <dd className="font-display text-lg font-bold text-cloud">{formatEventTime(endsAt, locale)}</dd>
                  </div>
                )}
                <div className="border-t border-line pt-4 text-fog">
                  <Clock3 className="mr-2 inline h-4 w-4 text-orange" />{t.eventTimeZone}
                </div>
                {seatsLeft !== null && (
                  <div className="flex justify-between gap-4 border-t border-line pt-4">
                    <dt className="text-steel">{t.eventSeatsLeft}</dt>
                    <dd className="font-semibold text-cloud">{seatsLeft} / {event.capacity}</dd>
                  </div>
                )}
              </dl>
            </aside>
          </div>

          <section className="mt-10 max-w-[46rem] border-t border-line pt-5 lg:mt-14">
            <InteractionSection
              targetCollection="events"
              targetId={event.id}
              locale={locale}
              redirectPath={`${prefix}/events/${event.slug}`}
            />
          </section>
        </div>
      </article>
    </EventUserStateProvider>
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { locale, slug } = await paramsPromise
  const event = await queryEventBySlug(locale, slug)
  if (!event) return { title: locale === 'uk' ? 'Подію не знайдено' : 'Event not found' }

  const url = eventPageUrl(locale, event.slug)
  const cover = event.cover && typeof event.cover === 'object' ? (event.cover as MediaType) : null
  const imagePath = cover?.sizes?.og?.url || cover?.url || '/og-image.webp'
  const image = new URL(imagePath, new URL(url).origin).href
  const title = `${event.title} | Залізна Зміна`
  const description = event.description || formatEventRange(event, locale)

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        uk: eventPageUrl('uk', event.slug),
        en: eventPageUrl('en', event.slug),
      },
    },
    robots: process.env.VERCEL_ENV === 'preview' ? { index: false, follow: false } : undefined,
    openGraph: {
      type: 'website',
      title,
      description,
      url,
      siteName: 'Залізна Зміна',
      locale: locale === 'uk' ? 'uk_UA' : 'en_GB',
      images: [{ url: image, alt: cover?.alt || event.title }],
    },
    twitter: { card: 'summary_large_image', title, description, images: [image] },
  }
}
