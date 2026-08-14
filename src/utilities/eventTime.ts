import type { SiteLocale } from './locales'

export type EventTimeInfo = {
  /** The moment the event stops being "upcoming" — endDate when set, else startDate. */
  endsAt: Date
  startsAt: Date
}

export const getEventTimes = (event: {
  startDate: string
  endDate?: string | null
}): EventTimeInfo => {
  const startsAt = new Date(event.startDate)
  const endsAt = event.endDate ? new Date(event.endDate) : startsAt
  return { startsAt, endsAt }
}

export const isEventPast = (
  event: { startDate: string; endDate?: string | null },
  now: Date = new Date(),
): boolean => getEventTimes(event).endsAt < now

const INTL_LOCALES: Record<SiteLocale, string> = { uk: 'uk-UA', en: 'en-GB' }

export const formatEventDate = (date: Date, locale: SiteLocale): string =>
  new Intl.DateTimeFormat(INTL_LOCALES[locale], {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)

export const formatEventTime = (date: Date, locale: SiteLocale): string =>
  new Intl.DateTimeFormat(INTL_LOCALES[locale], {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)

export const formatEventMonthShort = (date: Date, locale: SiteLocale): string =>
  new Intl.DateTimeFormat(INTL_LOCALES[locale], { month: 'short' }).format(date).replace('.', '')

/** "12 січня 2026, 18:00 – 20:00" or "12 – 14 січня 2026" for multi-day events. */
export const formatEventRange = (
  event: { startDate: string; endDate?: string | null },
  locale: SiteLocale,
): string => {
  const { startsAt, endsAt } = getEventTimes(event)
  const sameDay = startsAt.toDateString() === endsAt.toDateString()

  if (!event.endDate || (sameDay && startsAt.getTime() === endsAt.getTime())) {
    return `${formatEventDate(startsAt, locale)}, ${formatEventTime(startsAt, locale)}`
  }
  if (sameDay) {
    return `${formatEventDate(startsAt, locale)}, ${formatEventTime(startsAt, locale)} – ${formatEventTime(endsAt, locale)}`
  }
  return `${formatEventDate(startsAt, locale)} – ${formatEventDate(endsAt, locale)}`
}

const toGoogleDate = (date: Date): string =>
  date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')

/** Prefilled Google Calendar "create event" URL. */
export const googleCalendarUrl = (args: {
  title: string
  description?: string | null
  location?: string | null
  startDate: string
  endDate?: string | null
}): string => {
  const { startsAt, endsAt } = getEventTimes(args)
  // Google requires an end; default to one hour for open-ended events.
  const end = endsAt.getTime() === startsAt.getTime()
    ? new Date(startsAt.getTime() + 60 * 60 * 1000)
    : endsAt

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: args.title,
    dates: `${toGoogleDate(startsAt)}/${toGoogleDate(end)}`,
  })
  if (args.description) params.set('details', args.description)
  if (args.location) params.set('location', args.location)
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

export type MeetingPlatform = 'zoom' | 'google-meet' | 'youtube' | 'other'

export const detectMeetingPlatform = (url: string | null | undefined): MeetingPlatform => {
  if (!url) return 'other'
  try {
    const host = new URL(url).hostname
    if (host === 'zoom.us' || host.endsWith('.zoom.us')) return 'zoom'
    if (host === 'meet.google.com') return 'google-meet'
    if (host === 'youtube.com' || host.endsWith('.youtube.com') || host === 'youtu.be') {
      return 'youtube'
    }
  } catch {
    // not a parseable URL — fall through
  }
  return 'other'
}

export const MEETING_PLATFORM_LABELS: Record<MeetingPlatform, string> = {
  zoom: 'Zoom',
  'google-meet': 'Google Meet',
  youtube: 'YouTube',
  other: 'Online',
}
