import { describe, expect, it } from 'vitest'

import {
  findArticle,
  getAllArticles,
  getDocsTree,
  getNavTree,
  getSearchIndex,
} from '@/lib/admin-docs/loader'
import { renderMarkdown } from '@/lib/admin-docs/markdown'

describe('admin-docs markdown renderer', () => {
  it('assigns transliterated ids to headings and collects h2/h3 for the TOC', () => {
    const { headings, html } = renderMarkdown('## Що таке платформа\n\n### Підрозділ')
    expect(headings).toEqual([
      { depth: 2, id: 'shcho-take-platforma', text: 'Що таке платформа' },
      { depth: 3, id: 'pidrozdil', text: 'Підрозділ' },
    ])
    expect(html).toContain('<h2 id="shcho-take-platforma">')
    expect(html).toContain('class="admin-docs-anchor"')
  })

  it('deduplicates repeated heading ids', () => {
    const { headings } = renderMarkdown('## Крок\n\n## Крок')
    expect(headings.map((h) => h.id)).toEqual(['krok', 'krok-2'])
  })

  it('renders callout blocks with default and custom titles', () => {
    const { html } = renderMarkdown(
      ':::warning\nтекст\n:::\n\n:::tip Заголовок\nще текст\n:::',
    )
    expect(html).toContain('admin-docs-callout--warning')
    expect(html).toContain('Увага')
    expect(html).toContain('admin-docs-callout--tip')
    expect(html).toContain('Заголовок')
  })

  it('parses markdown blocks that follow a callout', () => {
    const { headings, html } = renderMarkdown(':::tip\nтекст\n:::\n\n## Наступний розділ')
    expect(headings.map((h) => h.text)).toEqual(['Наступний розділ'])
    expect(html).not.toContain('## Наступний розділ')
  })

  it('escapes code blocks and marks external links', () => {
    const { html } = renderMarkdown(
      '```ts\nconst a = <b>1</b>\n```\n\n[зовнішнє](https://example.com) і [внутрішнє](/admin/docs/manager)',
    )
    expect(html).toContain('&lt;b&gt;1&lt;/b&gt;')
    expect(html).toContain('language-ts')
    expect(html).toContain('target="_blank"')
    expect(html).not.toContain('href="/admin/docs/manager" target')
  })

  it('wraps tables for horizontal scrolling', () => {
    const { html } = renderMarkdown('| А | Б |\n| --- | --- |\n| 1 | 2 |')
    expect(html).toContain('<div class="admin-docs-table">')
    expect(html).toContain('<th>А</th>')
  })
})

describe('admin-docs loader (real content)', () => {
  it('loads both tracks with categories and articles', () => {
    for (const track of ['manager', 'technical'] as const) {
      const tree = getDocsTree(track)
      expect(tree.categories.length).toBeGreaterThan(0)
      expect(getAllArticles(track).length).toBeGreaterThan(0)
    }
  })

  it('gives every article a frontmatter title and a prefix-free URL', () => {
    for (const article of [...getAllArticles('manager'), ...getAllArticles('technical')]) {
      expect(article.title.length, article.filePath).toBeGreaterThan(0)
      expect(article.url, article.filePath).not.toMatch(/\/\d+-/)
    }
  })

  it('resolves articles by slug parts', () => {
    const first = getAllArticles('manager')[0]
    expect(findArticle('manager', first.slugParts)?.url).toBe(first.url)
    expect(findArticle('manager', ['does', 'not', 'exist'])).toBeUndefined()
  })

  it('builds a search index covering both tracks', () => {
    const index = getSearchIndex()
    expect(index.some((doc) => doc.track === 'manager')).toBe(true)
    expect(index.some((doc) => doc.track === 'technical')).toBe(true)
    for (const doc of index) {
      expect(doc.url).toMatch(/^\/admin\/docs\//)
    }
  })

  it('keeps internal cross-links resolvable', () => {
    const knownUrls = new Set(
      [...getAllArticles('manager'), ...getAllArticles('technical')].map((a) => a.url),
    )
    knownUrls.add('/admin/docs/manager')
    knownUrls.add('/admin/docs/technical')
    knownUrls.add('/admin/docs')

    const broken: string[] = []
    for (const article of [...getAllArticles('manager'), ...getAllArticles('technical')]) {
      for (const match of article.html.matchAll(/href="(\/admin\/docs[^"#]*)/g)) {
        if (!knownUrls.has(match[1])) {
          broken.push(`${article.filePath} → ${match[1]}`)
        }
      }
    }
    expect(broken).toEqual([])
  })

  it('renders no article with leaked raw markdown (headings or callout fences)', () => {
    const leaks: string[] = []
    for (const article of [...getAllArticles('manager'), ...getAllArticles('technical')]) {
      const withoutCode = article.html
        .replace(/<pre><code[\s\S]*?<\/code><\/pre>/g, '')
        .replace(/<code>[\s\S]*?<\/code>/g, '')
      if (/^#{1,4} /m.test(withoutCode) || withoutCode.includes(':::')) {
        leaks.push(article.filePath)
      }
    }
    expect(leaks).toEqual([])
  })

  it('exposes a nav tree with labels from _category.json', () => {
    const nav = getNavTree('manager')
    expect(nav.length).toBeGreaterThan(0)
    for (const category of nav) {
      expect(category.label).not.toMatch(/^\d+-/)
    }
  })
})
