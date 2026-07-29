import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, Payload } from 'payload'

import { revalidatePath } from 'next/cache'

import type { Course } from '@/payload-types'

const LOCALE_PREFIXES = ['', '/en']

/**
 * Every ISR-cached surface a course appears on. Its own page plus the lists that
 * embed it — all on a 300s window, so without this an edit sits invisible for
 * up to five minutes. Step and quiz pages render per request and need no bust.
 *
 * Scheduled publishes run outside a request, where revalidatePath throws; a
 * missed bust just falls back to the time window, so it must not fail the save.
 */
function revalidateCoursePaths(payload: Payload, slug: string) {
  try {
    for (const prefix of LOCALE_PREFIXES) {
      revalidatePath(`${prefix}/courses/${slug}`)
      revalidatePath(`${prefix}/courses`)
      revalidatePath(`${prefix}/courses/category/[slug]`, 'page')
      revalidatePath(prefix || '/')
    }
  } catch (err) {
    payload.logger.warn({ err, slug }, 'courses: revalidation skipped')
  }
}

export const revalidateCourse: CollectionAfterChangeHook<Course> = ({
  doc,
  previousDoc,
  req: { context, payload },
}) => {
  if (context.disableRevalidate) return doc

  if (doc._status === 'published') {
    revalidateCoursePaths(payload, doc.slug)
  }

  // A rename or an unpublish strands the old URL with stale content.
  const wasPublished = previousDoc?._status === 'published'
  const slugChanged = previousDoc?.slug && previousDoc.slug !== doc.slug
  if (wasPublished && (slugChanged || doc._status !== 'published')) {
    revalidateCoursePaths(payload, previousDoc.slug)
  }

  return doc
}

export const revalidateCourseDelete: CollectionAfterDeleteHook<Course> = ({
  doc,
  req: { context, payload },
}) => {
  if (!context.disableRevalidate && doc?.slug) {
    revalidateCoursePaths(payload, doc.slug)
  }
  return doc
}
