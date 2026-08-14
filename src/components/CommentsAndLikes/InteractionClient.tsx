'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useSession } from '@/lib/auth/client'
import { LikeButton } from './LikeButton'
import { CommentsSection } from './CommentsSection'

interface Labels {
  commentsTitle: string
  commentsEmpty: string
  commentsPlaceholder: string
  commentsSubmit: string
  commentsSubmitting: string
  commentsLoginToComment: string
  likeLoginPrompt?: string
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
  loginUrl: string
  userProfileBase: string
  labels: Labels
}

export function InteractionClient({
  targetCollection,
  targetId,
  loginUrl,
  userProfileBase,
  labels,
}: InteractionClientProps) {
  const { data: session } = useSession()
  const user = session?.user
  const isAuthenticated = Boolean(user)
  const currentUserId = user?.id ? Number(user.id) : null
  const isAdmin = Boolean(
    user && 'role' in user && (user as { role?: string[] }).role?.includes('admin'),
  )

  const rootRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(false)
  useEffect(() => {
    const el = rootRef.current
    if (!el || active) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setActive(true)
      },
      { rootMargin: '400px 0px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [active])

  return (
    <div id="comments" ref={rootRef} className="scroll-mt-24">
      <div className="flex items-center gap-4 pt-4 pb-4 pl-2">
        <LikeButton
          targetCollection={targetCollection}
          targetId={targetId}
          isAuthenticated={isAuthenticated}
          active={active}
          loginUrl={loginUrl}
          loginPromptLabel={labels.likeLoginPrompt}
        />
      </div>

      <CommentsSection
        targetCollection={targetCollection}
        targetId={targetId}
        isAuthenticated={isAuthenticated}
        currentUserId={currentUserId}
        isAdmin={isAdmin}
        active={active}
        loginUrl={loginUrl}
        userProfileBase={userProfileBase}
        labels={{
          title: labels.commentsTitle,
          empty: labels.commentsEmpty,
          placeholder: labels.commentsPlaceholder,
          submit: labels.commentsSubmit,
          submitting: labels.commentsSubmitting,
          loginToComment: labels.commentsLoginToComment,
          loginToLike: labels.likeLoginPrompt,
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
