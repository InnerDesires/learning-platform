'use client'

import React, { useCallback, useEffect, useOptimistic, useState, useTransition } from 'react'
import { getLikeInfo, toggleLike } from '@/actions/commentsAndLikes'

type LikeTargetCollection = 'posts' | 'courses' | 'events' | 'comments'

interface LikeButtonProps {
  targetCollection: LikeTargetCollection
  targetId: number
  isAuthenticated: boolean
  active?: boolean
  initialLiked?: boolean
  initialCount?: number
  size?: 'sm' | 'md'
  loginUrl?: string
  loginPromptLabel?: string
  likeLabel?: string
  likedLabel?: string
}

export function LikeButton({
  targetCollection,
  targetId,
  isAuthenticated,
  active = true,
  initialLiked,
  initialCount,
  size = 'md',
  loginUrl,
  loginPromptLabel,
  likeLabel = 'Like',
  likedLabel = 'Liked',
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
  const [loadFailed, setLoadFailed] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    if (initialLiked !== undefined || !active) return
    let cancelled = false
    getLikeInfo(targetCollection, targetId)
      .then((info) => {
        if (!cancelled) {
          setLoadFailed(false)
          setRealState({ liked: info.liked, count: info.count, loaded: true })
        }
      })
      .catch(() => {
        // The real like state is unknown: show a neutral button without a count and let a
        // click retry the lookup, instead of asserting "unliked, 0 likes".
        if (!cancelled) {
          setLoadFailed(true)
          setRealState((state) => ({ ...state, loaded: true }))
        }
      })
    return () => {
      cancelled = true
    }
  }, [targetCollection, targetId, initialLiked, active, reloadKey])

  const handleToggle = useCallback(() => {
    if (loadFailed) {
      setLoadFailed(false)
      setRealState((state) => ({ ...state, loaded: false }))
      setReloadKey((key) => key + 1)
      return
    }
    if (!isAuthenticated) {
      if (loginUrl) window.location.assign(loginUrl)
      return
    }

    startTransition(async () => {
      setOptimistic('toggle')
      try {
        const result = await toggleLike(targetCollection, targetId)
        if (result.success) {
          setRealState({ liked: result.liked, count: result.count, loaded: true })
        }
      } catch {
        // The optimistic flip reverts when the transition settles without a state update.
      }
    })
  }, [loadFailed, isAuthenticated, loginUrl, targetCollection, targetId, setOptimistic])

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
      aria-label={guestCanLogin ? loginPromptLabel : optimistic.liked ? likedLabel : likeLabel}
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
      {!isSm && <span className="font-medium">{optimistic.liked ? likedLabel : likeLabel}</span>}
      {optimistic.count > 0 && <span className="font-medium tabular-nums">{optimistic.count}</span>}
    </button>
  )
}
