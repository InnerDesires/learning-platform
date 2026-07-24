'use server'

import { APIError, getPayload, type Where } from 'payload'
import configPromise from '@payload-config'
import { revalidateTag } from 'next/cache'
import { getSession } from '@/lib/auth/getSession'

/** True when a Local API write was rejected by a rate-limit hook (429). */
const isRateLimited = (err: unknown): boolean => err instanceof APIError && err.status === 429

type TargetCollection = 'posts' | 'courses'
type LikeTargetCollection = 'posts' | 'courses' | 'comments'

export type CommentWithMeta = {
  id: number
  body: string
  author: { id: number; name: string; image?: string | null }
  parent?: number | null
  likesCount: number
  userLiked: boolean
  createdAt: string
}

export type CommentsResponse = {
  comments: CommentWithMeta[]
  total: number
}

export async function getComments(
  targetCollection: TargetCollection,
  targetId: number,
): Promise<CommentsResponse> {
  const payload = await getPayload({ config: configPromise })
  const session = await getSession()
  const userId = session?.user?.id ? Number(session.user.id) : null

  const result = await payload.find({
    collection: 'comments',
    where: {
      and: [
        { targetCollection: { equals: targetCollection } },
        { targetId: { equals: targetId } },
      ],
    },
    sort: 'createdAt',
    limit: 500,
    depth: 1,
  })

  const commentIds = result.docs.map((c) => c.id)

  const likeCounts: Record<number, number> = {}
  const userLikes: Set<number> = new Set()

  if (commentIds.length > 0) {
    const allCommentLikes = await payload.find({
      collection: 'likes',
      where: {
        and: [
          { targetCollection: { equals: 'comments' } },
          { targetId: { in: commentIds } },
        ],
      },
      limit: 10000,
      depth: 0,
    })

    for (const like of allCommentLikes.docs) {
      const tid = like.targetId
      likeCounts[tid] = (likeCounts[tid] || 0) + 1
      const likeUserId = typeof like.user === 'object' ? like.user.id : like.user
      if (userId && likeUserId === userId) {
        userLikes.add(tid)
      }
    }
  }

  const comments: CommentWithMeta[] = result.docs.map((doc) => {
    const author = typeof doc.author === 'object' ? doc.author : null
    const parentId = typeof doc.parent === 'object' ? doc.parent?.id : (doc.parent as number | null)

    return {
      id: doc.id,
      body: doc.body,
      author: {
        id: author?.id ?? 0,
        name: author?.name ?? '',
        image: author?.image ?? null,
      },
      parent: parentId ?? null,
      likesCount: likeCounts[doc.id] || 0,
      userLiked: userLikes.has(doc.id),
      createdAt: doc.createdAt,
    }
  })

  return { comments, total: result.totalDocs }
}

export async function addComment(
  targetCollection: TargetCollection,
  targetId: number,
  body: string,
  parentId?: number | null,
): Promise<{ success: boolean; comment?: CommentWithMeta; error?: string }> {
  const session = await getSession()
  if (!session?.user) {
    return { success: false, error: 'AUTH_REQUIRED' }
  }

  const trimmed = body.trim()
  if (!trimmed || trimmed.length > 2000) {
    return { success: false, error: 'INVALID_BODY' }
  }

  const payload = await getPayload({ config: configPromise })
  const userId = Number(session.user.id)

  const target = await payload.find({
    collection: targetCollection,
    where: {
      and: [{ id: { equals: targetId } }, { _status: { equals: 'published' } }],
    },
    limit: 1,
    depth: 0,
    select: {},
  })
  if (target.totalDocs === 0) {
    return { success: false, error: 'INVALID_TARGET' }
  }

  if (parentId) {
    const parent = await payload.find({
      collection: 'comments',
      where: {
        and: [
          { id: { equals: parentId } },
          { targetCollection: { equals: targetCollection } },
          { targetId: { equals: targetId } },
        ],
      },
      limit: 1,
      depth: 0,
      select: {},
    })
    if (parent.totalDocs === 0) {
      return { success: false, error: 'INVALID_TARGET' }
    }
  }

  let doc
  try {
    doc = await payload.create({
      collection: 'comments',
      data: {
        body: trimmed,
        author: userId,
        targetCollection,
        targetId,
        ...(parentId ? { parent: parentId } : {}),
      },
    })
  } catch (err) {
    if (isRateLimited(err)) return { success: false, error: 'RATE_LIMITED' }
    throw err
  }

  const author = typeof doc.author === 'object' ? doc.author : null

  revalidateCounts('comments', targetCollection)

  return {
    success: true,
    comment: {
      id: doc.id,
      body: doc.body,
      author: {
        id: author?.id ?? userId,
        name: author?.name ?? session.user.name ?? '',
        image: author?.image ?? session.user.image ?? null,
      },
      parent: parentId ?? null,
      likesCount: 0,
      userLiked: false,
      createdAt: doc.createdAt,
    },
  }
}

export async function deleteComment(
  commentId: number,
): Promise<{ success: boolean; error?: string }> {
  const session = await getSession()
  if (!session?.user) {
    return { success: false, error: 'AUTH_REQUIRED' }
  }

  const payload = await getPayload({ config: configPromise })
  const userId = Number(session.user.id)

  const comment = await payload.findByID({
    collection: 'comments',
    id: commentId,
    depth: 0,
  })

  if (!comment) {
    return { success: false, error: 'NOT_FOUND' }
  }

  const authorId = typeof comment.author === 'object' ? comment.author.id : comment.author

  const user = await payload.findByID({ collection: 'users', id: userId, depth: 0 })
  const isAdmin = user?.role?.includes('admin')

  if (authorId !== userId && !isAdmin) {
    return { success: false, error: 'FORBIDDEN' }
  }

  await payload.delete({
    collection: 'likes',
    where: {
      and: [
        { targetCollection: { equals: 'comments' } },
        { targetId: { equals: commentId } },
      ],
    },
  })

  await payload.delete({
    collection: 'comments',
    where: {
      parent: { equals: commentId },
    },
  })

  await payload.delete({
    collection: 'comments',
    id: commentId,
  })

  revalidateCounts('comments', comment.targetCollection)

  return { success: true }
}

export type LikeInfo = {
  liked: boolean
  count: number
}

/** Invalidate the cached grouped counts (src/utilities/contentCounts.ts) after a write. */
function revalidateCounts(kind: 'likes' | 'comments', targetCollection: LikeTargetCollection) {
  if (targetCollection === 'posts' || targetCollection === 'courses') {
    revalidateTag(`${kind}-counts-${targetCollection}`)
  }
}

export async function getLikeInfo(
  targetCollection: LikeTargetCollection,
  targetId: number,
): Promise<LikeInfo> {
  const payload = await getPayload({ config: configPromise })
  const session = await getSession()
  const userId = session?.user?.id ? Number(session.user.id) : null

  const targetWhere: Where[] = [
    { targetCollection: { equals: targetCollection } },
    { targetId: { equals: targetId } },
  ]

  const [{ totalDocs: count }, userLike] = await Promise.all([
    payload.count({ collection: 'likes', where: { and: targetWhere } }),
    userId
      ? payload.find({
          collection: 'likes',
          where: { and: [...targetWhere, { user: { equals: userId } }] },
          limit: 1,
          depth: 0,
        })
      : Promise.resolve(null),
  ])

  return { liked: (userLike?.totalDocs ?? 0) > 0, count }
}

export async function toggleLike(
  targetCollection: LikeTargetCollection,
  targetId: number,
): Promise<{ success: boolean; liked: boolean; count: number; error?: string }> {
  const session = await getSession()
  if (!session?.user) {
    return { success: false, liked: false, count: 0, error: 'AUTH_REQUIRED' }
  }

  const payload = await getPayload({ config: configPromise })
  const userId = Number(session.user.id)

  const existing = await payload.find({
    collection: 'likes',
    where: {
      and: [
        { user: { equals: userId } },
        { targetCollection: { equals: targetCollection } },
        { targetId: { equals: targetId } },
      ],
    },
    limit: 1,
    depth: 0,
  })

  if (existing.totalDocs > 0) {
    await payload.delete({
      collection: 'likes',
      id: existing.docs[0]!.id,
    })
  } else {
    try {
      await payload.create({
        collection: 'likes',
        data: {
          user: userId,
          targetCollection,
          targetId,
        },
      })
    } catch (err) {
      if (isRateLimited(err)) return { success: false, liked: false, count: 0, error: 'RATE_LIMITED' }
      throw err
    }
  }

  const { totalDocs: count } = await payload.count({
    collection: 'likes',
    where: {
      and: [
        { targetCollection: { equals: targetCollection } },
        { targetId: { equals: targetId } },
      ],
    },
  })

  revalidateCounts('likes', targetCollection)

  return {
    success: true,
    liked: existing.totalDocs === 0,
    count,
  }
}
