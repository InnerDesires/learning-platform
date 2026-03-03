'use client'

import React, { useState } from 'react'
import type { CommentWithMeta } from '@/actions/commentsAndLikes'
import { LikeButton } from './LikeButton'
import { CommentForm } from './CommentForm'

interface Labels {
  reply: string
  replying: string
  delete: string
  deleteConfirm: string
  showReplies: string
  hideReplies: string
  placeholder: string
  submit: string
  submitting: string
}

interface CommentItemProps {
  comment: CommentWithMeta
  repliesByParent: Record<number, CommentWithMeta[]>
  isAuthenticated: boolean
  currentUserId: number | null
  isAdmin: boolean
  labels: Labels
  onReply: (parentId: number, body: string) => Promise<boolean>
  onDelete: (commentId: number) => Promise<boolean>
  depth?: number
}

function formatRelativeTime(dateStr: string): string {
  const now = Date.now()
  const date = new Date(dateStr).getTime()
  const diff = now - date
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '< 1m'
  if (minutes < 60) return `${minutes}m`
  if (hours < 24) return `${hours}h`
  if (days < 30) return `${days}d`
  return new Date(dateStr).toLocaleDateString()
}

function UserAvatar({ name, image }: { name: string; image?: string | null }) {
  if (image) {
    return (
      <img
        src={image}
        alt={name}
        className="w-8 h-8 rounded-full object-cover flex-shrink-0"
      />
    )
  }

  const initial = name?.charAt(0)?.toUpperCase() || '?'
  return (
    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold flex-shrink-0">
      {initial}
    </div>
  )
}

export function CommentItem({
  comment,
  repliesByParent,
  isAuthenticated,
  currentUserId,
  isAdmin,
  labels,
  onReply,
  onDelete,
  depth = 0,
}: CommentItemProps) {
  const replies = repliesByParent[comment.id] ?? []
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [showReplies, setShowReplies] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)

  const canDelete = isAdmin || comment.author.id === currentUserId

  const handleDelete = async () => {
    if (!window.confirm(labels.deleteConfirm)) return
    setIsDeleting(true)
    await onDelete(comment.id)
    setIsDeleting(false)
  }

  const handleReply = async (body: string) => {
    const success = await onReply(comment.id, body)
    if (success) setShowReplyForm(false)
    return success
  }

  return (
    <div className={`${depth > 0 ? 'ml-6 sm:ml-10' : ''}`}>
      <div
        className={`group relative rounded-xl p-4 transition-colors ${
          isDeleting ? 'opacity-40' : ''
        } ${depth > 0 ? 'bg-muted/30' : 'bg-muted/50'}`}
      >
        <div className="flex items-start gap-3">
          <UserAvatar name={comment.author.name} image={comment.author.image} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-foreground">{comment.author.name}</span>
              <span className="text-xs text-muted-foreground">
                {formatRelativeTime(comment.createdAt)}
              </span>
            </div>
            <p className="mt-1.5 text-sm text-foreground/90 whitespace-pre-wrap break-words">
              {comment.body}
            </p>
            <div className="mt-2.5 flex items-center gap-4">
              <LikeButton
                targetCollection="comments"
                targetId={comment.id}
                isAuthenticated={isAuthenticated}
                initialLiked={comment.userLiked}
                initialCount={comment.likesCount}
                size="sm"
              />
              {isAuthenticated && depth < 2 && (
                <button
                  type="button"
                  onClick={() => setShowReplyForm(!showReplyForm)}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {labels.reply}
                </button>
              )}
              {canDelete && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="text-xs text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                >
                  {labels.delete}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {showReplyForm && (
        <div className="mt-2 ml-6 sm:ml-11">
          <CommentForm
            onSubmit={handleReply}
            placeholder={labels.placeholder}
            submitLabel={labels.submit}
            submittingLabel={labels.submitting}
            replyingTo={comment.author.name}
            replyingLabel={labels.replying}
            onCancelReply={() => setShowReplyForm(false)}
            autoFocus
          />
        </div>
      )}

      {replies.length > 0 && (
        <div className="mt-1">
          {replies.length > 2 && (
            <button
              type="button"
              onClick={() => setShowReplies(!showReplies)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors ml-6 sm:ml-10 mb-1"
            >
              {showReplies ? labels.hideReplies : `${labels.showReplies} (${replies.length})`}
            </button>
          )}
          {showReplies && (
            <div className="space-y-2 mt-2">
              {replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  repliesByParent={repliesByParent}
                  isAuthenticated={isAuthenticated}
                  currentUserId={currentUserId}
                  isAdmin={isAdmin}
                  labels={labels}
                  onReply={onReply}
                  onDelete={onDelete}
                  depth={depth + 1}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
