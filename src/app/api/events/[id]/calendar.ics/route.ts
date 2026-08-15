import { getPayload } from 'payload'
import configPromise from '@payload-config'

import type { Event } from '@/payload-types'
import { getServerSideURL } from '@/utilities/getURL'
import { getEventTimes } from '@/utilities/eventTime'

const icsEscape = (value: string): string =>
  value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n')

const icsDate = (date: Date): string =>
  date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')

/**
 * Public .ics download for a published event. Virtual events point at the event
 * page rather than the meeting link — the link is reserved for registered
 * users (and is stripped by field access on this anonymous read anyway).
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const eventId = Number(id)
  if (!Number.isInteger(eventId)) {
    return new Response('Not found', { status: 404 })
  }

  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'events',
    where: { and: [{ id: { equals: eventId } }, { _status: { equals: 'published' } }] },
    limit: 1,
    depth: 0,
    overrideAccess: false,
  })

  const event = result.docs[0] as Event | undefined
  if (!event) {
    return new Response('Not found', { status: 404 })
  }

  const { startsAt, endsAt } = getEventTimes(event)
  const end = endsAt.getTime() === startsAt.getTime()
    ? new Date(startsAt.getTime() + 60 * 60 * 1000)
    : endsAt

  const eventUrl = `${getServerSideURL()}/events/${event.slug}`
  const location = event.locationType === 'local' ? event.address || '' : eventUrl
  const description = [event.description, eventUrl].filter(Boolean).join('\n\n')

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Zalizna Zmina//Events//UK',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:event-${event.id}@zalizna-zmina`,
    `DTSTAMP:${icsDate(new Date())}`,
    `DTSTART:${icsDate(startsAt)}`,
    `DTEND:${icsDate(end)}`,
    `SUMMARY:${icsEscape(event.title)}`,
    description ? `DESCRIPTION:${icsEscape(description)}` : null,
    location ? `LOCATION:${icsEscape(location)}` : null,
    `URL:${icsEscape(eventUrl)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter((line): line is string => line !== null)

  return new Response(lines.join('\r\n') + '\r\n', {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="event-${event.id}.ics"`,
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    },
  })
}
