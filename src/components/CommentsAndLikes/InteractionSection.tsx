import React, { Suspense } from 'react'
import { getSession } from '@/lib/auth/getSession'
import type { SiteLocale } from '@/utilities/locales'
import { getFrontendMessages } from '@/utilities/i18n'
import { defaultLocale } from '@/utilities/locales'
import { InteractionClient } from './InteractionClient'

interface InteractionSectionProps {
  targetCollection: 'posts' | 'courses'
  targetId: number
  locale: SiteLocale
}

async function InteractionContent({
  targetCollection,
  targetId,
  locale,
}: InteractionSectionProps) {
  const session = await getSession()
  const t = getFrontendMessages(locale)
  const loginPath = locale === defaultLocale ? '/login' : `/${locale}/login`

  const isAuthenticated = Boolean(session?.user)
  const currentUserId = session?.user?.id ? Number(session.user.id) : null
  const isAdmin = Boolean(
    session?.user && 'role' in session.user && (session.user as { role?: string[] }).role?.includes('admin'),
  )

  return (
    <InteractionClient
      targetCollection={targetCollection}
      targetId={targetId}
      isAuthenticated={isAuthenticated}
      currentUserId={currentUserId}
      isAdmin={isAdmin}
      loginUrl={loginPath}
      labels={{
        commentsTitle: t.commentsTitle,
        commentsEmpty: t.commentsEmpty,
        commentsPlaceholder: t.commentsPlaceholder,
        commentsSubmit: t.commentsSubmit,
        commentsSubmitting: t.commentsSubmitting,
        commentsLoginToComment: t.commentsLoginToComment,
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

export function InteractionSection(props: InteractionSectionProps) {
  return (
    <Suspense
      fallback={
        <div className="mt-12 space-y-4">
          <div className="h-6 w-32 rounded bg-muted animate-pulse" />
          <div className="h-24 rounded-xl bg-muted/50 animate-pulse" />
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="rounded-xl bg-muted/50 p-4 animate-pulse">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-24 rounded bg-muted" />
                    <div className="h-3 w-full rounded bg-muted" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      }
    >
      <InteractionContent {...props} />
    </Suspense>
  )
}
