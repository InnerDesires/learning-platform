'use client'

import React, { useCallback, useEffect, useOptimistic, useState, useTransition } from 'react'
import type { CommentWithMeta } from '@/actions/commentsAndLikes'
import {
  getComments,
  addComment,
  deleteComment as deleteCommentAction,
} from '@/actions/commentsAndLikes'
import { CommentForm } from './CommentForm'
import { CommentItem } from './CommentItem'

type TargetCollection = 'posts' | 'courses'

interface Labels {
  title: string
  empty: string
  placeholder: string
  submit: string
  submitting: string
  loginToComment: string
  reply: string
  replying: string
  delete: string
  deleteConfirm: string
  showReplies: string
  hideReplies: string
}

interface CommentsSectionProps {
  targetCollection: TargetCollection
  targetId: number
  isAuthenticated: boolean
  currentUserId: number | null
  isAdmin: boolean
  labels: Labels
  loginUrl: string
}

type OptimisticAction =
  | { type: 'add'; comment: CommentWithMeta }
  | { type: 'delete'; commentId: number }

export function CommentsSection({
  targetCollection,
  targetId,
  isAuthenticated,
  currentUserId,
  isAdmin,
  labels,
  loginUrl,
}: CommentsSectionProps) {
  const [comments, setComments] = useState<CommentWithMeta[]>([])
  const [loading, setLoading] = useState(true)
  const [, startTransition] = useTransition()

  const [optimisticComments, setOptimisticComments] = useOptimistic(
    comments,
    (state, action: OptimisticAction) => {
      if (action.type === 'add') {
        return [...state, action.comment]
      }
      if (action.type === 'delete') {
        return state.filter((c) => c.id !== action.commentId && c.parent !== action.commentId)
      }
      return state
    },
  )

  useEffect(() => {
    let cancelled = false
    getComments(targetCollection, targetId).then((data) => {
      if (!cancelled) {
        setComments(data.comments)
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [targetCollection, targetId])

  const handleAddComment = useCallback(
    async (body: string): Promise<boolean> => {
      const result = await addComment(targetCollection, targetId, body, null)
      if (result.success && result.comment) {
        setComments((prev) => [...prev, result.comment!])
        return true
      }
      return false
    },
    [targetCollection, targetId],
  )

  const handleReply = useCallback(
    async (parentId: number, body: string): Promise<boolean> => {
      const result = await addComment(targetCollection, targetId, body, parentId)
      if (result.success && result.comment) {
        setComments((prev) => [...prev, result.comment!])
        return true
      }
      return false
    },
    [targetCollection, targetId],
  )

  const handleDelete = useCallback(
    async (commentId: number): Promise<boolean> => {
      startTransition(async () => {
        setOptimisticComments({ type: 'delete', commentId })
        const result = await deleteCommentAction(commentId)
        if (result.success) {
          setComments((prev) => prev.filter((c) => c.id !== commentId && c.parent !== commentId))
        }
      })
      return true
    },
    [setOptimisticComments, startTransition],
  )

  const topLevelComments = optimisticComments.filter((c) => !c.parent)
  const repliesByParent: Record<number, CommentWithMeta[]> = {}
  for (const c of optimisticComments) {
    if (c.parent) {
      if (!repliesByParent[c.parent]) repliesByParent[c.parent] = []
      repliesByParent[c.parent]!.push(c)
    }
  }

  return (
    <section className="mt-6">
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
        {labels.title}
        {optimisticComments.length > 0 && (
          <span className="text-sm font-normal text-muted-foreground">
            ({optimisticComments.length})
          </span>
        )}
      </h2>

      {isAuthenticated ? (
        <div className="mb-8">
          <CommentForm
            onSubmit={handleAddComment}
            placeholder={labels.placeholder}
            submitLabel={labels.submit}
            submittingLabel={labels.submitting}
          />
        </div>
      ) : (
        <a
          href={loginUrl}
          className="block mb-8 text-center py-4 px-6 rounded-xl border border-dashed border-border text-sm text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
        >
          {labels.loginToComment}
        </a>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl bg-muted/50 p-4 animate-pulse">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-24 rounded bg-muted" />
                  <div className="h-3 w-full rounded bg-muted" />
                  <div className="h-3 w-2/3 rounded bg-muted" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : topLevelComments.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">{labels.empty}</p>
      ) : (
        <div className="space-y-3">
          {topLevelComments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              repliesByParent={repliesByParent}
              isAuthenticated={isAuthenticated}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              labels={{
                reply: labels.reply,
                replying: labels.replying,
                delete: labels.delete,
                deleteConfirm: labels.deleteConfirm,
                showReplies: labels.showReplies,
                hideReplies: labels.hideReplies,
                placeholder: labels.placeholder,
                submit: labels.submit,
                submitting: labels.submitting,
              }}
              onReply={handleReply}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </section>
  )
}
