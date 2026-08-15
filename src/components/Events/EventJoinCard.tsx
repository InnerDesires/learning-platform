'use client'

import React from 'react'
import { ExternalLink, Lock, Video } from 'lucide-react'

import type { SiteLocale } from '@/utilities/locales'
import { getFrontendMessages } from '@/utilities/i18n'
import { detectMeetingPlatform, MEETING_PLATFORM_LABELS } from '@/utilities/eventTime'
import { useEventUserState } from './EventUserState'

const PLATFORM_ACCENTS: Record<string, string> = {
  zoom: '#2D8CFF',
  'google-meet': '#00897B',
  youtube: '#FF0033',
  other: '#5b9bff',
}

type Props = {
  locale: SiteLocale
  isPast: boolean
}

/**
 * The virtual-event join card. The meeting link never ships in the static
 * page — it arrives via EventUserState only for registered users.
 */
export function EventJoinCard({ locale, isPast }: Props) {
  const t = getFrontendMessages(locale)
  const { loading, enrolled, meetingLink } = useEventUserState()

  if (isPast) return null

  const platform = detectMeetingPlatform(meetingLink)
  const accent = PLATFORM_ACCENTS[platform]
  const platformLabel = MEETING_PLATFORM_LABELS[platform]

  return (
    <div
      className="relative overflow-hidden rounded-[14px] border border-line bg-card p-6"
      style={{
        background: `radial-gradient(360px 200px at 100% 0%, ${accent}1f, transparent 65%), var(--card)`,
      }}
    >
      <div className="flex items-center gap-3">
        <span
          className="flex h-11 w-11 flex-none items-center justify-center rounded-[12px]"
          style={{ background: `${accent}26`, color: accent }}
        >
          <Video className="h-5 w-5" />
        </span>
        <div>
          <h3 className="font-display text-sm font-bold uppercase tracking-[0.08em]">
            {t.eventJoinTitle}
          </h3>
          {meetingLink && (
            <span className="num text-[11.5px] font-semibold" style={{ color: accent }}>
              {platformLabel}
            </span>
          )}
        </div>
      </div>

      {loading ? (
        <div className="mt-5 h-11 w-44 animate-pulse rounded-full bg-navy-2" />
      ) : enrolled && meetingLink ? (
        <div className="mt-5 space-y-2.5">
          <a
            href={meetingLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full px-6 py-3 font-display text-sm font-semibold uppercase tracking-[0.1em] text-[#08111F] transition-all hover:-translate-y-px"
            style={{ background: accent, boxShadow: `0 6px 20px -8px ${accent}99` }}
          >
            {t.eventJoin}
            <ExternalLink className="h-4 w-4" />
          </a>
          <p className="break-all text-[12px] text-fog">{meetingLink}</p>
        </div>
      ) : (
        <p className="mt-5 flex items-center gap-2 text-[13px] font-semibold text-fog">
          <Lock className="h-4 w-4 flex-none text-steel" />
          {enrolled ? t.eventJoinHint : t.eventJoinLocked}
        </p>
      )}
    </div>
  )
}
