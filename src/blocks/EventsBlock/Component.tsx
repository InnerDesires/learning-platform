import type { EventsBlock as EventsBlockProps } from '@/payload-types'
import type { SiteLocale } from '@/utilities/locales'

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

import RichText from '@/components/RichText'
import { EventCard, type EventCardData } from '@/components/Events/EventCard'
import { getFrontendMessages } from '@/utilities/i18n'
import { isEventPast } from '@/utilities/eventTime'

const CARD_SELECT = {
  slug: true,
  title: true,
  description: true,
  cover: true,
  startDate: true,
  endDate: true,
  locationType: true,
  address: true,
  capacity: true,
} as const

export const EventsBlockComponent: React.FC<
  EventsBlockProps & {
    id?: string
    locale?: SiteLocale
  }
> = async (props) => {
  const { id, introContent, limit: limitFromProps, locale, populateBy, selectedEvents, showAllLink } = props

  const siteLocale: SiteLocale = locale ?? 'uk'
  const t = getFrontendMessages(siteLocale)
  const prefix = siteLocale === 'en' ? '/en' : ''
  const limit = limitFromProps || 3

  let events: EventCardData[] = []

  const payload = await getPayload({ config: configPromise })

  if (populateBy === 'selection' && selectedEvents?.length) {
    const ids = selectedEvents.map((event) => (typeof event === 'object' ? event.id : event))
    // Re-fetch instead of trusting the populated docs: access control filters
    // out drafts and strips the registration-only meeting link.
    const fetched = await payload.find({
      collection: 'events',
      depth: 1,
      limit: ids.length,
      locale: siteLocale,
      draft: false,
      overrideAccess: false,
      select: CARD_SELECT,
      where: {
        and: [{ id: { in: ids } }, { _status: { equals: 'published' } }],
      },
    })
    // Preserve the hand-picked order.
    const byId = new Map(fetched.docs.map((doc) => [doc.id, doc]))
    events = ids.flatMap((eventId) => {
      const doc = byId.get(eventId)
      return doc ? [doc as EventCardData] : []
    })
  } else {
    const fetched = await payload.find({
      collection: 'events',
      depth: 1,
      limit,
      locale: siteLocale,
      draft: false,
      overrideAccess: false,
      sort: 'startDate',
      select: CARD_SELECT,
      where: {
        and: [
          { _status: { equals: 'published' } },
          {
            or: [
              { endDate: { greater_than_equal: new Date().toISOString() } },
              {
                and: [
                  { endDate: { exists: false } },
                  { startDate: { greater_than_equal: new Date().toISOString() } },
                ],
              },
            ],
          },
        ],
      },
    })
    events = fetched.docs as EventCardData[]
  }

  if (events.length === 0 && !introContent) return null

  return (
    <div className="my-16" id={`block-${id}`}>
      {introContent && (
        <div className="container mb-10">
          <RichText className="ms-0 max-w-[48rem]" data={introContent} enableGutter={false} />
        </div>
      )}
      <div className="container">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              locale={siteLocale}
              isPast={isEventPast(event)}
              className="h-full"
            />
          ))}
        </div>
        {showAllLink !== false && (
          <div className="mt-6">
            <Link
              href={`${prefix}/events`}
              className="inline-flex items-center gap-2 font-display text-xs font-semibold uppercase tracking-[0.1em] text-orange transition-colors hover:text-amber"
            >
              {t.eventsBlockSeeAll}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
