import React from 'react'
import Link from 'next/link'
import { Heart, MessageSquare } from 'lucide-react'

import { getPayload } from '@/lib/payload'
import { getFrontendMessages } from '@/utilities/i18n'
import { defaultLocale, type SiteLocale } from '@/utilities/locales'
import { formatDateTime } from '@/utilities/formatDateTime'
import { plural } from '@/utilities/plural'

// One window of recent comments is enough for the profile teaser; per-page
// "and N more" counts are computed within it rather than with extra queries.
const COMMENTS_WINDOW = 30
const MAX_PAGES = 5

type Props = {
  userId: number
  locale: SiteLocale
}

// Streams in behind <Suspense> on the public profile page: everything runs in
// the same serverless invocation (no extra API routes / function calls), and
// every query selects only the columns the UI renders.
export async function ProfileLatestComments({ userId, locale }: Props) {
  const payload = await getPayload()
  const t = getFrontendMessages(locale)
  const prefix = locale === defaultLocale ? '' : `/${locale}`

  const { docs: comments } = await payload.find({
    collection: 'comments',
    where: { author: { equals: userId } },
    sort: '-createdAt',
    limit: COMMENTS_WINDOW,
    depth: 0,
    select: { body: true, targetCollection: true, targetId: true, parent: true, createdAt: true },
  })
  if (comments.length === 0) return null

  // Newest-first docs → the first comment seen per page is its latest one,
  // and Map insertion order keeps pages sorted by that latest comment.
  type Group = { latest: (typeof comments)[number]; count: number }
  const groups = new Map<string, Group>()
  for (const comment of comments) {
    const key = `${comment.targetCollection}:${comment.targetId}`
    const group = groups.get(key)
    if (group) group.count += 1
    else groups.set(key, { latest: comment, count: 1 })
  }
  const topGroups = [...groups.values()].slice(0, MAX_PAGES)

  const postIds = topGroups
    .filter((g) => g.latest.targetCollection === 'posts')
    .map((g) => g.latest.targetId)
  const courseIds = topGroups
    .filter((g) => g.latest.targetCollection === 'courses')
    .map((g) => g.latest.targetId)
  const parentIds = topGroups
    .map((g) => g.latest.parent)
    .filter((p): p is number => typeof p === 'number')
  const displayedIds = topGroups.map((g) => g.latest.id)

  const [postsRes, coursesRes, parentsRes, likesRes] = await Promise.all([
    postIds.length
      ? payload.find({
          collection: 'posts',
          where: { id: { in: postIds }, _status: { equals: 'published' } },
          depth: 0,
          limit: postIds.length,
          select: { title: true, slug: true },
        })
      : null,
    courseIds.length
      ? payload.find({
          collection: 'courses',
          locale,
          where: { id: { in: courseIds }, _status: { equals: 'published' } },
          depth: 0,
          limit: courseIds.length,
          select: { title: true, slug: true },
        })
      : null,
    parentIds.length
      ? payload.find({
          collection: 'comments',
          where: { id: { in: parentIds } },
          depth: 1,
          limit: parentIds.length,
          select: { body: true, author: true },
        })
      : null,
    payload.find({
      collection: 'likes',
      where: { targetCollection: { equals: 'comments' }, targetId: { in: displayedIds } },
      depth: 0,
      limit: 1000,
      select: { targetId: true },
    }),
  ])

  const targets = new Map<string, { title: string; url: string }>()
  for (const post of postsRes?.docs ?? []) {
    targets.set(`posts:${post.id}`, {
      title: post.title,
      url: `${prefix}/posts/${post.slug}#comments`,
    })
  }
  for (const course of coursesRes?.docs ?? []) {
    targets.set(`courses:${course.id}`, {
      title: course.title,
      url: `${prefix}/courses/${course.slug}#comments`,
    })
  }

  const likeCounts = new Map<number, number>()
  for (const like of likesRes.docs) {
    likeCounts.set(like.targetId, (likeCounts.get(like.targetId) ?? 0) + 1)
  }

  // Only the parent's name and body reach the markup — never the author doc.
  const parents = new Map<number, { authorName: string; body: string }>()
  for (const parent of parentsRes?.docs ?? []) {
    parents.set(parent.id, {
      authorName: typeof parent.author === 'object' && parent.author ? parent.author.name : '',
      body: parent.body,
    })
  }

  // Drop comments whose target was deleted or unpublished.
  const items = topGroups.flatMap((group) => {
    const target = targets.get(`${group.latest.targetCollection}:${group.latest.targetId}`)
    return target ? [{ group, target }] : []
  })
  if (items.length === 0) return null

  return (
    <>
      <h2 className="heading-display mb-4 mt-10 text-xl tracking-[0.06em]">
        {t.publicProfileComments}
      </h2>
      <div className="grid gap-2.5">
        {items.map(({ group, target }) => {
          const parent =
            typeof group.latest.parent === 'number' ? parents.get(group.latest.parent) : undefined
          const moreCount = group.count - 1
          const likes = likeCounts.get(group.latest.id) ?? 0
          return (
            <div
              key={group.latest.id}
              className="rounded-xl border border-line bg-card px-5 py-4 transition-colors hover:border-orange/55"
            >
              <div className="flex items-baseline justify-between gap-3">
                <Link
                  href={target.url}
                  className="inline-flex min-w-0 items-center gap-2 text-sm font-bold transition-colors hover:text-amber"
                >
                  <MessageSquare className="h-3.5 w-3.5 flex-none text-orange" />
                  <span className="truncate">{target.title}</span>
                </Link>
                <span className="num flex-none inline-flex items-center gap-2.5 text-[11px] text-steel">
                  {likes > 0 && (
                    <span className="inline-flex items-center gap-1">
                      <Heart className="h-3 w-3" fill="currentColor" strokeWidth={0} />
                      {likes}
                    </span>
                  )}
                  {formatDateTime(group.latest.createdAt, locale)}
                </span>
              </div>

              {parent && (
                <div className="mt-2.5 border-l-2 border-line-2 pl-3">
                  <p className="text-[11px] font-semibold text-steel">
                    {t.publicProfileCommentReply} {parent.authorName}
                  </p>
                  <p className="mt-0.5 line-clamp-2 break-words text-xs text-fog">{parent.body}</p>
                </div>
              )}

              <p className="mt-2 line-clamp-3 whitespace-pre-line break-words text-sm leading-relaxed text-foreground/90">
                {group.latest.body}
              </p>

              {moreCount > 0 && (
                <Link
                  href={target.url}
                  className="mt-2 inline-block text-xs font-medium text-fog transition-colors hover:text-orange"
                >
                  {plural(locale, moreCount, t.publicProfileCommentsMore).replace(
                    '%d',
                    String(moreCount),
                  )}
                </Link>
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}

export function ProfileLatestCommentsSkeleton() {
  return (
    <div className="mt-10">
      <div className="mb-4 h-6 w-48 animate-pulse rounded bg-muted" />
      <div className="grid gap-2.5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl border border-line bg-card" />
        ))}
      </div>
    </div>
  )
}
