import React from 'react'
import type { SiteLocale } from '@/utilities/locales'
import { getFrontendMessages } from '@/utilities/i18n'
import { defaultLocale } from '@/utilities/locales'
import { InteractionClient } from './InteractionClient'

interface InteractionSectionProps {
  targetCollection: 'posts' | 'courses'
  targetId: number
  locale: SiteLocale
  redirectPath?: string
}

export function InteractionSection({
  targetCollection,
  targetId,
  locale,
  redirectPath,
}: InteractionSectionProps) {
  const t = getFrontendMessages(locale)
  const userProfileBase = locale === defaultLocale ? '/users' : `/${locale}/users`
  const loginBase = locale === defaultLocale ? '/login' : `/${locale}/login`
  const loginPath = redirectPath
    ? `${loginBase}?redirect=${encodeURIComponent(`${redirectPath}#comments`)}`
    : loginBase

  return (
    <InteractionClient
      targetCollection={targetCollection}
      targetId={targetId}
      loginUrl={loginPath}
      userProfileBase={userProfileBase}
      labels={{
        commentsTitle: t.commentsTitle,
        commentsEmpty: t.commentsEmpty,
        commentsPlaceholder: t.commentsPlaceholder,
        commentsSubmit: t.commentsSubmit,
        commentsSubmitting: t.commentsSubmitting,
        commentsLoginToComment: t.commentsLoginToComment,
        likeLoginPrompt: t.likeLoginPrompt,
        commentsReply: t.commentsReply,
        commentsReplying: t.commentsReplying,
        commentsDelete: t.commentsDelete,
        commentsDeleteConfirm: t.commentsDeleteConfirm,
        commentsShowReplies: t.commentsShowReplies,
        commentsHideReplies: t.commentsHideReplies,
      }}
    />
  )
}
