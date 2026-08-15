import Link from 'next/link'
import React from 'react'
import { Check, MapPin, Users, Video } from 'lucide-react'

import type { Event } from '@/payload-types'
import { Media } from '@/components/Media'
import { cn } from '@/utilities/ui'
import type { SiteLocale } from '@/utilities/locales'
import { getFrontendMessages } from '@/utilities/i18n'
import {
  formatEventMonthShort,
  formatEventRange,
  getEventTimes,
  isEventPast,
} from '@/utilities/eventTime'

export type EventCardData = Pick<
  Event,
  | 'id'
  | 'slug'
  | 'title'
  | 'description'
  | 'cover'
  | 'startDate'
  | 'endDate'
  | 'locationType'
  | 'address'
  | 'capacity'
>

type Props = {
  event: EventCardData
  locale: SiteLocale
  isEnrolled?: boolean
  /** Precomputed on the server for static renders; client renders pass live "now". */
  isPast?: boolean
  className?: string
}

export const EventCard: React.FC<Props> = ({ event, locale, isEnrolled, isPast, className }) => {
  const t = getFrontendMessages(locale)
  const { slug, title, description, cover, locationType, address } = event
  const prefix = locale === 'en' ? '/en' : ''
  const href = `${prefix}/events/${slug}`
  const { startsAt } = getEventTimes(event)
  const past = isPast ?? isEventPast(event)

  return (
    <article
      className={cn(
        'group flex flex-col overflow-hidden rounded-[14px] border border-line bg-card transition-all duration-200 hover:-translate-y-1 hover:border-orange/60 hover:shadow-[0_18px_40px_-22px_rgba(0,0,0,0.8)]',
        past && 'opacity-75 saturate-[0.7] hover:opacity-100 hover:saturate-100',
        className,
      )}
    >
      <Link href={href} className="flex flex-1 flex-col">
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-ink">
          {cover && typeof cover === 'object' ? (
            <Media
              resource={cover}
              size="33vw"
              imgClassName="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.045]"
            />
          ) : (
            <div
              className="h-full w-full"
              style={{
                background:
                  'radial-gradient(420px 260px at 80% 0%, rgb(249 140 31 / 0.28), transparent 60%), linear-gradient(160deg, var(--navy-2) 0%, var(--ink) 100%)',
              }}
            />
          )}
          {/* Date tile — echoes the homepage calendar motif. */}
          <div className="absolute left-3 top-3 z-[2] w-[58px] rounded-[10px] bg-ink/90 px-1.5 py-2 text-center font-display uppercase leading-[1.1] text-cloud backdrop-blur-sm">
            <b className="num block text-xl font-semibold text-orange">{startsAt.getDate()}</b>
            <span className="text-[10.5px] tracking-[0.14em]">
              {formatEventMonthShort(startsAt, locale)}
            </span>
          </div>
          {isEnrolled && !past && (
            <span className="absolute right-3 top-3 z-[2] flex items-center gap-1 rounded-full bg-success px-2.5 py-1 font-display text-[10px] font-semibold uppercase tracking-[0.12em] text-[#08130C]">
              <Check className="h-2.5 w-2.5" strokeWidth={4} />
              {t.eventEnrolledBadge}
            </span>
          )}
          {past && (
            <span className="absolute right-3 top-3 z-[2] rounded-full bg-ink/85 px-2.5 py-1 font-display text-[10px] font-semibold uppercase tracking-[0.12em] text-fog backdrop-blur-sm">
              {t.eventFinished}
            </span>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-2 p-5">
          <div className="num text-[11px] font-bold uppercase tracking-[0.1em] text-ember">
            {formatEventRange(event, locale)}
          </div>
          <h3 className="text-[15.5px] font-bold leading-[1.35] transition-colors group-hover:text-amber">
            {title}
          </h3>
          {description && (
            <p className="line-clamp-2 text-[12.5px] leading-relaxed text-fog">{description}</p>
          )}
          <div className="mt-auto flex flex-nowrap items-center gap-3.5 overflow-hidden whitespace-nowrap border-t border-line pt-3 text-[11.5px] font-semibold text-fog">
            {locationType === 'virtual' ? (
              <span className="flex min-w-0 items-center gap-1.5">
                <Video className="h-3.5 w-3.5 flex-none text-blue-ill" />
                {t.eventOnline}
              </span>
            ) : (
              <span className="flex min-w-0 items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 flex-none text-orange" />
                <span className="truncate">{address || t.eventOffline}</span>
              </span>
            )}
            {typeof event.capacity === 'number' && !past && (
              <span className="num ml-auto flex flex-none items-center gap-1.5">
                <Users className="h-3.5 w-3.5 flex-none" />
                {event.capacity}
              </span>
            )}
          </div>
        </div>
      </Link>
    </article>
  )
}
