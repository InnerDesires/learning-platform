'use server'

import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { getSession } from '@/lib/auth/getSession'

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

  const doc = await payload.create({
    collection: 'comments',
    data: {
      body: trimmed,
      author: userId,
      targetCollection,
      targetId,
      ...(parentId ? { parent: parentId } : {}),
    },
  })

  const author = typeof doc.author === 'object' ? doc.author : null

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

  return { success: true }
}

export type LikeInfo = {
  liked: boolean
  count: number
}

export async function getLikesCountsBatch(
  targetCollection: LikeTargetCollection,
  targetIds: number[],
): Promise<Record<number, number>> {
  if (targetIds.length === 0) return {}

  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'likes',
    where: {
      and: [
        { targetCollection: { equals: targetCollection } },
        { targetId: { in: targetIds } },
      ],
    },
    limit: 10000,
    depth: 0,
  })

  const counts: Record<number, number> = {}
  for (const like of result.docs) {
    const tid = Number(like.targetId)
    counts[tid] = (counts[tid] || 0) + 1
  }

  return counts
}

export async function getLikeInfo(
  targetCollection: LikeTargetCollection,
  targetId: number,
): Promise<LikeInfo> {
  const payload = await getPayload({ config: configPromise })
  const session = await getSession()
  const userId = session?.user?.id ? Number(session.user.id) : null

  const result = await payload.find({
    collection: 'likes',
    where: {
      and: [
        { targetCollection: { equals: targetCollection } },
        { targetId: { equals: targetId } },
      ],
    },
    limit: 10000,
    depth: 0,
  })

  let liked = false
  if (userId) {
    liked = result.docs.some((doc) => {
      const likeUserId = typeof doc.user === 'object' ? doc.user.id : doc.user
      return likeUserId === userId
    })
  }

  return { liked, count: result.totalDocs }
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
    await payload.create({
      collection: 'likes',
      data: {
        user: userId,
        targetCollection,
        targetId,
      },
    })
  }

  const updatedCount = await payload.find({
    collection: 'likes',
    where: {
      and: [
        { targetCollection: { equals: targetCollection } },
        { targetId: { equals: targetId } },
      ],
    },
    limit: 0,
    depth: 0,
  })

  return {
    success: true,
    liked: existing.totalDocs === 0,
    count: updatedCount.totalDocs,
  }
}
