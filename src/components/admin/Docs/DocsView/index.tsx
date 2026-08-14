import type { AdminViewServerProps } from 'payload'

import { DefaultTemplate } from '@payloadcms/next/templates'
import { redirect } from 'next/navigation'
import React from 'react'

import './index.scss'

import { isDocsTrack } from '@/lib/admin-docs/types'

import { ArticleView } from './ArticleView'
import { DocsHome } from './DocsHome'
import { NotFoundView } from './NotFoundView'
import { TrackHome } from './TrackHome'

const DocsView: React.FC<AdminViewServerProps> = ({
  initPageResult,
  params,
  searchParams,
}) => {
  const { locale, permissions, req, visibleEntities } = initPageResult

  if (!req.user) {
    redirect(
      `${req.payload.config.routes.admin}/login?redirect=${encodeURIComponent('/docs')}`,
    )
  }

  const segments = Array.isArray(params?.segments) ? params.segments : []
  const [, trackSegment, ...slugParts] = segments

  let content: React.ReactNode
  if (!trackSegment) {
    content = <DocsHome />
  } else if (!isDocsTrack(trackSegment)) {
    content = <NotFoundView />
  } else if (slugParts.length === 0) {
    content = <TrackHome track={trackSegment} />
  } else {
    content = <ArticleView slugParts={slugParts} track={trackSegment} />
  }

  return (
    <DefaultTemplate
      i18n={req.i18n}
      locale={locale}
      params={params}
      payload={req.payload}
      permissions={permissions}
      searchParams={searchParams}
      user={req.user || undefined}
      visibleEntities={visibleEntities}
    >
      <div className="admin-docs">{content}</div>
    </DefaultTemplate>
  )
}

export default DocsView
