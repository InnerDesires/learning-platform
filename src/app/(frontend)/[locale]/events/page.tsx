import type { Metadata } from 'next/types'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import React from 'react'

import { locales, type SiteLocale } from '@/utilities/locales'
import { getFrontendMessages } from '@/utilities/i18n'
import { PageHead } from '@/components/brand'
import { EventsExplorer } from '@/components/Events/EventsExplorer'
import type { EventCardData } from '@/components/Events/EventCard'

export const revalidate = 300

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

type Args = {
  params: Promise<{ locale: SiteLocale }>
}

export default async function EventsPage({ params: paramsPromise }: Args) {
  const { locale } = await paramsPromise
  const t = getFrontendMessages(locale)
  const payload = await getPayload({ config: configPromise })

  // overrideAccess: false keeps this to published events and strips the
  // registration-only meeting link out of the shared ISR cache.
  const { docs } = await payload.find({
    collection: 'events',
    locale,
    draft: false,
    overrideAccess: false,
    where: { _status: { equals: 'published' } },
    sort: '-startDate',
    limit: 200,
    depth: 1,
    select: {
      slug: true,
      title: true,
      description: true,
      cover: true,
      startDate: true,
      endDate: true,
      locationType: true,
      address: true,
      capacity: true,
    },
  })

  return (
    <div className="pb-16">
      <PageHead eyebrow={t.eventsEyebrow} title={<span data-testid="events-page-title">{t.eventsTitle}</span>} sub={t.eventsSub} />
      <div className="container">
        <EventsExplorer
          events={docs as EventCardData[]}
          locale={locale}
          serverNow={new Date().toISOString()}
        />
      </div>
    </div>
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { locale } = await paramsPromise
  const t = getFrontendMessages(locale)
  return { title: t.eventsMetaTitle }
}
