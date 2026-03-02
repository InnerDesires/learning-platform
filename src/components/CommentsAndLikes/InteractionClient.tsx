'use client'

import React from 'react'
import { LikeButton } from './LikeButton'
import { CommentsSection } from './CommentsSection'

interface Labels {
  commentsTitle: string
  commentsEmpty: string
  commentsPlaceholder: string
  commentsSubmit: string
  commentsSubmitting: string
  commentsLoginToComment: string
  commentsReply: string
  commentsReplying: string
  commentsDelete: string
  commentsDeleteConfirm: string
  commentsShowReplies: string
  commentsHideReplies: string
}

interface InteractionClientProps {
  targetCollection: 'posts' | 'courses'
  targetId: number
  isAuthenticated: boolean
  currentUserId: number | null
  isAdmin: boolean
  loginUrl: string
  labels: Labels
}

export function InteractionClient({
  targetCollection,
  targetId,
  isAuthenticated,
  currentUserId,
  isAdmin,
  loginUrl,
  labels,
}: InteractionClientProps) {
  return (
    <div>
      <div className="flex items-center gap-4 pt-4 pb-4 pl-2">
        <LikeButton
          targetCollection={targetCollection}
          targetId={targetId}
          isAuthenticated={isAuthenticated}
        />
      </div>

      <CommentsSection
        targetCollection={targetCollection}
        targetId={targetId}
        isAuthenticated={isAuthenticated}
        currentUserId={currentUserId}
        isAdmin={isAdmin}
        loginUrl={loginUrl}
        labels={{
          title: labels.commentsTitle,
          empty: labels.commentsEmpty,
          placeholder: labels.commentsPlaceholder,
          submit: labels.commentsSubmit,
          submitting: labels.commentsSubmitting,
          loginToComment: labels.commentsLoginToComment,
          reply: labels.commentsReply,
          replying: labels.commentsReplying,
          delete: labels.commentsDelete,
          deleteConfirm: labels.commentsDeleteConfirm,
          showReplies: labels.commentsShowReplies,
          hideReplies: labels.commentsHideReplies,
        }}
      />
    </div>
  )
}
