import Link from 'next/link'
import React from 'react'

import {
  findArticle,
  findBreadcrumbs,
  getAdjacentArticles,
} from '@/lib/admin-docs/loader'
import { TRACKS, type DocsTrack } from '@/lib/admin-docs/types'

import { DocsContent } from '../DocsContent.client'
import { DocsToc } from '../DocsToc.client'
import { DocsShell } from './DocsShell'
import { NotFoundView } from './NotFoundView'

export const ArticleView: React.FC<{
  slugParts: string[]
  track: DocsTrack
}> = ({ slugParts, track }) => {
  const article = findArticle(track, slugParts)

  if (!article) {
    return <NotFoundView />
  }

  const breadcrumbs = findBreadcrumbs(track, slugParts)
  const { next, prev } = getAdjacentArticles(track, slugParts)

  return (
    <DocsShell activeUrl={article.url} track={track}>
      <div className="admin-docs__article-layout">
        <article className="admin-docs__article" id="admin-docs-article">
          <nav aria-label="Хлібні крихти" className="admin-docs__breadcrumbs">
            <Link href={`/admin/docs/${track}`}>{TRACKS[track].label}</Link>
            {breadcrumbs.map((label) => (
              <span key={label}>{label}</span>
            ))}
          </nav>
          <h1>{article.title}</h1>
          {article.description ? (
            <p className="admin-docs__lead">{article.description}</p>
          ) : null}
          <DocsContent html={article.html} />
          <nav aria-label="Сусідні статті" className="admin-docs__pager">
            {prev ? (
              <Link className="admin-docs__pager-link" href={prev.url}>
                <span>← Попередня</span>
                {prev.title}
              </Link>
            ) : (
              <span />
            )}
            {next ? (
              <Link
                className="admin-docs__pager-link admin-docs__pager-link--next"
                href={next.url}
              >
                <span>Наступна →</span>
                {next.title}
              </Link>
            ) : (
              <span />
            )}
          </nav>
        </article>
        <DocsToc headings={article.headings} />
      </div>
    </DocsShell>
  )
}
