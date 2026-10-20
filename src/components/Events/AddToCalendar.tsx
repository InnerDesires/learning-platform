import React from 'react'
import { CalendarPlus, Download } from 'lucide-react'

import type { SiteLocale } from '@/utilities/locales'
import { getFrontendMessages } from '@/utilities/i18n'
import { googleCalendarUrl } from '@/utilities/eventTime'
import type { EventCardData } from './EventCard'

type Props = {
  event: EventCardData & { description?: string | null }
  locale: SiteLocale
  /** Absolute or root-relative URL of the event page — used as the calendar "location" for virtual events. */
  eventUrl: string
}

const linkClass =
  'inline-flex items-center gap-2 rounded-full border border-line-2 px-4 py-2 font-display text-[11px] font-semibold uppercase tracking-[0.1em] text-fog transition-colors hover:border-orange hover:text-orange'

export const AddToCalendar: React.FC<Props> = ({ event, locale, eventUrl }) => {
  const t = getFrontendMessages(locale)

  // Virtual events point at the event page (where the registered user finds the
  // join link) so the meeting link itself never leaks through calendar files.
  const location = event.locationType === 'local' ? event.address || undefined : eventUrl

  const googleUrl = googleCalendarUrl({
    title: event.title,
    description: event.description ? `${event.description}\n\n${eventUrl}` : eventUrl,
    location,
    startDate: event.startDate,
    endDate: event.endDate,
  })

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <span className="mr-1 text-[12px] font-semibold uppercase tracking-[0.08em] text-steel">
        {t.eventAddToCalendar}
      </span>
      <a href={googleUrl} target="_blank" rel="noopener noreferrer" className={linkClass}>
        <CalendarPlus className="h-3.5 w-3.5" />
        {t.eventGoogleCalendar}
      </a>
      <a href={`/api/events/${event.id}/calendar.ics`} download className={linkClass}>
        <Download className="h-3.5 w-3.5" />
        {t.eventDownloadIcs}
      </a>
    </div>
  )
}
