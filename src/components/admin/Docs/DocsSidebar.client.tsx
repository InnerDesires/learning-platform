'use client'

import Link from 'next/link'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { DocsNavCategory, DocsTrack, SearchDoc } from '@/lib/admin-docs/types'

type SearchResult = {
  doc: SearchDoc
  score: number
  snippet: null | string
}

const normalize = (value: string): string => value.toLowerCase().replace(/ʼ|'/g, '')

const buildSnippet = (text: string, token: string): null | string => {
  const idx = normalize(text).indexOf(token)
  if (idx === -1) return null
  const start = Math.max(0, idx - 55)
  const end = Math.min(text.length, idx + token.length + 65)
  return `${start > 0 ? '…' : ''}${text.slice(start, end).trim()}${end < text.length ? '…' : ''}`
}

const searchDocs = (docs: SearchDoc[], query: string): SearchResult[] => {
  const tokens = normalize(query).split(/\s+/).filter((token) => token.length > 1)
  if (tokens.length === 0) return []

  const results: SearchResult[] = []
  for (const doc of docs) {
    let score = 0
    let snippet: null | string = null
    const title = normalize(doc.title)
    const description = normalize(doc.description)
    const headings = normalize(doc.headings.map((h) => h.text).join(' '))
    const text = normalize(doc.text)

    for (const token of tokens) {
      let tokenScore = 0
      if (title.includes(token)) tokenScore += 8
      if (description.includes(token)) tokenScore += 4
      if (headings.includes(token)) tokenScore += 3
      if (text.includes(token)) {
        tokenScore += 1
        if (!snippet) snippet = buildSnippet(doc.text, token)
      }
      if (tokenScore === 0) {
        score = 0
        break
      }
      score += tokenScore
    }

    if (score > 0) results.push({ doc, score, snippet })
  }

  return results.sort((a, b) => b.score - a.score).slice(0, 12)
}

const NavCategory: React.FC<{
  activeUrl: string
  category: DocsNavCategory
  depth: number
}> = ({ activeUrl, category, depth }) => {
  const containsActive = useMemo(() => {
    const walk = (cat: DocsNavCategory): boolean =>
      cat.articles.some((article) => article.url === activeUrl) ||
      cat.subcategories.some(walk)
    return walk(category)
  }, [activeUrl, category])

  const [open, setOpen] = useState(containsActive || depth === 0)

  useEffect(() => {
    if (containsActive) setOpen(true)
  }, [containsActive])

  return (
    <li className="admin-docs-sidebar__category">
      <button
        aria-expanded={open}
        className="admin-docs-sidebar__category-toggle"
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        <span className={`admin-docs-sidebar__chevron${open ? ' is-open' : ''}`}>›</span>
        {category.label}
      </button>
      {open ? (
        <ul>
          {category.articles.map((article) => (
            <li key={article.url}>
              <Link
                aria-current={article.url === activeUrl ? 'page' : undefined}
                className={`admin-docs-sidebar__link${article.url === activeUrl ? ' is-active' : ''}`}
                href={article.url}
              >
                {article.title}
              </Link>
            </li>
          ))}
          {category.subcategories.map((sub) => (
            <NavCategory
              activeUrl={activeUrl}
              category={sub}
              depth={depth + 1}
              key={sub.slug}
            />
          ))}
        </ul>
      ) : null}
    </li>
  )
}

export const DocsSidebar: React.FC<{
  activeUrl: string
  nav: DocsNavCategory[]
  track: DocsTrack
  trackLabels: Record<DocsTrack, string>
}> = ({ activeUrl, nav, track, trackLabels }) => {
  const [query, setQuery] = useState('')
  const [index, setIndex] = useState<null | SearchDoc[]>(null)
  const [loadFailed, setLoadFailed] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const ensureIndex = useCallback(async () => {
    if (index || loadFailed) return
    try {
      const res = await fetch('/api/admin-docs/search-index', {
        credentials: 'include',
      })
      if (!res.ok) throw new Error(String(res.status))
      setIndex((await res.json()) as SearchDoc[])
    } catch {
      setLoadFailed(true)
    }
  }, [index, loadFailed])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault()
        inputRef.current?.focus()
      }
      if (event.key === 'Escape') {
        setQuery('')
        inputRef.current?.blur()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const results = useMemo(
    () => (index && query.trim() ? searchDocs(index, query) : []),
    [index, query],
  )

  const grouped = useMemo(() => {
    const own = results.filter((result) => result.doc.track === track)
    const other = results.filter((result) => result.doc.track !== track)
    return { other, own }
  }, [results, track])

  return (
    <aside className="admin-docs-sidebar">
      <nav aria-label="Розділи документації" className="admin-docs-sidebar__tracks">
        {(['manager', 'technical'] as DocsTrack[]).map((candidate) => (
          <Link
            aria-current={candidate === track ? 'page' : undefined}
            className={`admin-docs-sidebar__track${candidate === track ? ' is-active' : ''}`}
            href={`/admin/docs/${candidate}`}
            key={candidate}
          >
            {trackLabels[candidate]}
          </Link>
        ))}
      </nav>

      <div className="admin-docs-sidebar__search">
        <input
          aria-label="Пошук у документації"
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => void ensureIndex()}
          placeholder="Пошук… (⌘K)"
          ref={inputRef}
          type="search"
          value={query}
        />
        {query.trim() ? (
          <div className="admin-docs-sidebar__results" role="listbox">
            {loadFailed ? (
              <p className="admin-docs-sidebar__results-empty">
                Не вдалося завантажити індекс пошуку.
              </p>
            ) : !index ? (
              <p className="admin-docs-sidebar__results-empty">Завантаження…</p>
            ) : results.length === 0 ? (
              <p className="admin-docs-sidebar__results-empty">Нічого не знайдено.</p>
            ) : (
              <>
                {grouped.own.map((result) => (
                  <SearchHit key={result.doc.url} result={result} />
                ))}
                {grouped.other.length > 0 ? (
                  <p className="admin-docs-sidebar__results-divider">
                    В іншому розділі документації
                  </p>
                ) : null}
                {grouped.other.map((result) => (
                  <SearchHit key={result.doc.url} result={result} />
                ))}
              </>
            )}
          </div>
        ) : null}
      </div>

      <ul className="admin-docs-sidebar__nav">
        {nav.map((category) => (
          <NavCategory
            activeUrl={activeUrl}
            category={category}
            depth={0}
            key={category.slug}
          />
        ))}
      </ul>
    </aside>
  )
}

const SearchHit: React.FC<{ result: SearchResult }> = ({ result }) => (
  <Link className="admin-docs-sidebar__result" href={result.doc.url}>
    <span className="admin-docs-sidebar__result-title">{result.doc.title}</span>
    <span className="admin-docs-sidebar__result-category">{result.doc.category}</span>
    {result.snippet ? (
      <span className="admin-docs-sidebar__result-snippet">{result.snippet}</span>
    ) : null}
  </Link>
)
