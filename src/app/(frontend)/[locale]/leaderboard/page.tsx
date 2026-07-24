import type { Metadata } from 'next/types'
import React from 'react'

import { locales, defaultLocale, type SiteLocale } from '@/utilities/locales'
import { getFrontendMessages } from '@/utilities/i18n'
import { PageHead } from '@/components/brand'
import { LeaderboardTabs } from '@/components/Leaderboard/LeaderboardTabs'
import {
  getCachedAllTimeLeaderboard,
  getCachedPeriodLeaderboard,
} from '@/utilities/leaderboard'

// The leaderboard is the same for everyone, so it can be served from the ISR
// cache; XP-awarding mutations revalidate the `xp-leaderboard` tag.
export const revalidate = 300

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

type Args = {
  params: Promise<{ locale: SiteLocale }>
}

export default async function LeaderboardPage({ params: paramsPromise }: Args) {
  const { locale } = await paramsPromise
  const t = getFrontendMessages(locale)
  const prefix = locale === defaultLocale ? '' : `/${locale}`

  const [allTime, day, week, month] = await Promise.all([
    getCachedAllTimeLeaderboard(),
    getCachedPeriodLeaderboard('day'),
    getCachedPeriodLeaderboard('week'),
    getCachedPeriodLeaderboard('month'),
  ])

  return (
    <div className="pb-16">
      <PageHead eyebrow={t.leaderboardEyebrow} title={t.leaderboardTitle} sub={t.leaderboardSub} />
      <div className="container max-w-3xl">
        <LeaderboardTabs
          boards={[
            { key: 'all', label: t.leaderboardAllTime, entries: allTime },
            { key: 'day', label: t.leaderboardDay, entries: day },
            { key: 'week', label: t.leaderboardWeek, entries: week },
            { key: 'month', label: t.leaderboardMonth, entries: month },
          ]}
          localePrefix={prefix}
          emptyText={t.leaderboardEmpty}
          levelLabel={t.profileLevel}
        />
      </div>
    </div>
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { locale } = await paramsPromise
  const t = getFrontendMessages(locale)
  return { title: t.leaderboardMetaTitle }
}
