import Link from 'next/link'
import React from 'react'

import { getDocsTree } from '@/lib/admin-docs/loader'
import { TRACKS, type DocCategory, type DocsTrack } from '@/lib/admin-docs/types'

import { DocsShell } from './DocsShell'

const CategoryCard: React.FC<{ category: DocCategory }> = ({ category }) => {
  const articles = [
    ...category.articles,
    ...category.subcategories.flatMap((sub) => sub.articles),
  ]
  return (
    <section className="admin-docs__category-card">
      <h2>{category.label}</h2>
      {category.description ? <p>{category.description}</p> : null}
      <ul>
        {articles.map((article) => (
          <li key={article.url}>
            <Link href={article.url}>{article.title}</Link>
            {article.description ? <span>{article.description}</span> : null}
          </li>
        ))}
      </ul>
    </section>
  )
}

export const TrackHome: React.FC<{ track: DocsTrack }> = ({ track }) => {
  const tree = getDocsTree(track)
  const meta = TRACKS[track]

  return (
    <DocsShell activeUrl={`/admin/docs/${track}`} track={track}>
      <div className="admin-docs__track-home">
        <header>
          <h1>{meta.label}</h1>
          <p>{meta.description}</p>
        </header>
        {tree.categories.length === 0 ? (
          <p className="admin-docs__empty">
            Статті ще не додано. Розмістіть markdown-файли у{' '}
            <code>docs/admin-panel/{track}/</code>.
          </p>
        ) : (
          <div className="admin-docs__category-grid">
            {tree.categories.map((category) => (
              <CategoryCard category={category} key={category.slug} />
            ))}
          </div>
        )}
      </div>
    </DocsShell>
  )
}
