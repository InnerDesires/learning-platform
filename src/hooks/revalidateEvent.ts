import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, Payload } from 'payload'

import { revalidatePath } from 'next/cache'

import type { Event } from '@/payload-types'

const LOCALE_PREFIXES = ['', '/en']

// Busts every ISR-cached surface an event appears on. Scheduled publishes run
// outside a request, where revalidatePath throws; a missed bust falls back to
// the time window, so never fail the save.
function revalidateEventPaths(payload: Payload, slug: string | null | undefined) {
  try {
    for (const prefix of LOCALE_PREFIXES) {
      if (slug) revalidatePath(`${prefix}/events/${slug}`)
      revalidatePath(`${prefix}/events`)
    }
  } catch (err) {
    payload.logger.warn({ err, slug }, 'events: revalidation skipped')
  }
}

export const revalidateEvent: CollectionAfterChangeHook<Event> = ({
  doc,
  previousDoc,
  req: { context, payload },
}) => {
  if (context.disableRevalidate) return doc

  if (doc._status === 'published') {
    revalidateEventPaths(payload, doc.slug)
  }

  // A rename or an unpublish strands the old URL with stale content.
  const wasPublished = previousDoc?._status === 'published'
  const slugChanged = previousDoc?.slug && previousDoc.slug !== doc.slug
  if (wasPublished && (slugChanged || doc._status !== 'published')) {
    revalidateEventPaths(payload, previousDoc.slug)
  }

  return doc
}

export const revalidateEventDelete: CollectionAfterDeleteHook<Event> = ({
  doc,
  req: { context, payload },
}) => {
  if (!context.disableRevalidate && doc?.slug) {
    revalidateEventPaths(payload, doc.slug)
  }
  return doc
}
