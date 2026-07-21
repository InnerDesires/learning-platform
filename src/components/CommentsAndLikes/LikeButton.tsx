'use client'

import React, { useCallback, useEffect, useOptimistic, useState, useTransition } from 'react'
import { getLikeInfo, toggleLike } from '@/actions/commentsAndLikes'

type LikeTargetCollection = 'posts' | 'courses' | 'comments'

interface LikeButtonProps {
  targetCollection: LikeTargetCollection
  targetId: number
  isAuthenticated: boolean
  initialLiked?: boolean
  initialCount?: number
  size?: 'sm' | 'md'
  /** Guests are sent here (login with a redirect back) instead of a dead disabled button. */
  loginUrl?: string
  loginPromptLabel?: string
}

export function LikeButton({
  targetCollection,
  targetId,
  isAuthenticated,
  initialLiked,
  initialCount,
  size = 'md',
  loginUrl,
  loginPromptLabel,
}: LikeButtonProps) {
  const [realState, setRealState] = useState({
    liked: initialLiked ?? false,
    count: initialCount ?? 0,
    loaded: initialLiked !== undefined,
  })
  const [optimistic, setOptimistic] = useOptimistic(realState, (state, _action: 'toggle') => ({
    ...state,
    liked: !state.liked,
    count: state.liked ? Math.max(0, state.count - 1) : state.count + 1,
  }))
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (initialLiked !== undefined) return
    let cancelled = false
    getLikeInfo(targetCollection, targetId).then((info) => {
      if (!cancelled) {
        setRealState({ liked: info.liked, count: info.count, loaded: true })
      }
    })
    return () => {
      cancelled = true
    }
  }, [targetCollection, targetId, initialLiked])

  const handleToggle = useCallback(() => {
    if (!isAuthenticated) {
      if (loginUrl) window.location.assign(loginUrl)
      return
    }

    startTransition(async () => {
      setOptimistic('toggle')
      const result = await toggleLike(targetCollection, targetId)
      if (result.success) {
        setRealState({ liked: result.liked, count: result.count, loaded: true })
      }
    })
  }, [isAuthenticated, loginUrl, targetCollection, targetId, setOptimistic])

  const isSm = size === 'sm'
  const iconSize = isSm ? 'w-4 h-4' : 'w-5 h-5'
  const textSize = isSm ? 'text-xs' : 'text-sm'

  if (!realState.loaded && initialLiked === undefined) {
    return (
      <div className={`inline-flex items-center gap-1.5 ${textSize} text-muted-foreground`}>
        <div className={`${iconSize} rounded-full bg-muted animate-pulse`} />
        <span className="w-4 h-3 rounded bg-muted animate-pulse" />
      </div>
    )
  }

  const guestCanLogin = !isAuthenticated && Boolean(loginUrl)

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isPending || (!isAuthenticated && !loginUrl)}
      title={guestCanLogin ? loginPromptLabel : undefined}
      className={`inline-flex items-center gap-1.5 ${textSize} transition-colors duration-200 ${
        optimistic.liked
          ? 'text-orange hover:text-amber'
          : 'text-muted-foreground hover:text-orange'
      } ${!isAuthenticated && !loginUrl ? 'cursor-default opacity-70' : 'cursor-pointer'} disabled:opacity-50`}
      aria-label={guestCanLogin ? loginPromptLabel : optimistic.liked ? 'Unlike' : 'Like'}
    >
      <svg
        className={`${iconSize} transition-transform duration-200 ${isPending ? 'scale-90' : 'scale-100'} ${optimistic.liked ? 'animate-[heartBeat_0.3s_ease-in-out]' : ''}`}
        viewBox="0 0 24 24"
        fill={optimistic.liked ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
      {optimistic.count > 0 && <span className="font-medium tabular-nums">{optimistic.count}</span>}
    </button>
  )
}
