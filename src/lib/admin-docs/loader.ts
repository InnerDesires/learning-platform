import fs from 'fs'
import path from 'path'

import { renderMarkdown } from './markdown'
import type {
  DocArticle,
  DocCategory,
  DocsNavCategory,
  DocsTrack,
  DocsTree,
  SearchDoc,
} from './types'

const CONTENT_ROOT = path.resolve(process.cwd(), 'docs/admin-panel')

/**
 * File and directory names carry a numeric ordering prefix: `03-kursy` →
 * order 3, slug `kursy`. Names without a prefix sort after prefixed ones.
 */
const parseName = (name: string): { order: number; slug: string } => {
  const match = /^(\d+)-(.*)$/.exec(name)
  if (match) return { order: Number(match[1]), slug: match[2] }
  return { order: 1000, slug: name }
}

type Frontmatter = Record<string, string>

const parseFrontmatter = (raw: string): { body: string; data: Frontmatter } => {
  const match = /^---\n([\s\S]*?)\n---\n?/.exec(raw)
  if (!match) return { body: raw, data: {} }
  const data: Frontmatter = {}
  for (const line of match[1].split('\n')) {
    const idx = line.indexOf(':')
    if (idx === -1) continue
    const key = line.slice(0, idx).trim()
    let value = line.slice(idx + 1).trim()
    if (
      (value.startsWith("'") && value.endsWith("'")) ||
      (value.startsWith('"') && value.endsWith('"'))
    ) {
      value = value.slice(1, -1)
    }
    if (key) data[key] = value
  }
  return { body: raw.slice(match[0].length), data }
}

const loadArticle = (
  filePath: string,
  track: DocsTrack,
  parentSlugs: string[],
): DocArticle => {
  const { order, slug } = parseName(path.basename(filePath, '.md'))
  const raw = fs.readFileSync(filePath, 'utf8')
  const { body, data } = parseFrontmatter(raw)
  const { headings, html, plainText } = renderMarkdown(body)
  const slugParts = [...parentSlugs, slug]
  return {
    track,
    slugParts,
    url: `/admin/docs/${track}/${slugParts.join('/')}`,
    title: data.title || slug,
    description: data.description || '',
    order,
    headings,
    html,
    plainText,
    filePath,
  }
}

const byOrder = <T extends { order: number; title?: string; label?: string }>(
  a: T,
  b: T,
): number =>
  a.order - b.order || String(a.title ?? a.label).localeCompare(String(b.title ?? b.label), 'uk')

const loadCategory = (
  dirPath: string,
  track: DocsTrack,
  parentSlugs: string[],
): DocCategory => {
  const { order, slug } = parseName(path.basename(dirPath))
  const slugParts = [...parentSlugs, slug]

  let label = slug
  let description = ''
  const metaPath = path.join(dirPath, '_category.json')
  if (fs.existsSync(metaPath)) {
    try {
      const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'))
      if (typeof meta.label === 'string') label = meta.label
      if (typeof meta.description === 'string') description = meta.description
    } catch {
      // A malformed _category.json falls back to slug-derived labels.
    }
  }

  const entries = fs.readdirSync(dirPath, { withFileTypes: true })
  const articles: DocArticle[] = []
  const subcategories: DocCategory[] = []

  for (const entry of entries) {
    const entryPath = path.join(dirPath, entry.name)
    if (entry.isDirectory()) {
      subcategories.push(loadCategory(entryPath, track, slugParts))
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      articles.push(loadArticle(entryPath, track, slugParts))
    }
  }

  articles.sort(byOrder)
  subcategories.sort(byOrder)

  return { track, slug, label, description, order, articles, subcategories }
}

const loadTree = (track: DocsTrack): DocsTree => {
  const trackRoot = path.join(CONTENT_ROOT, track)
  if (!fs.existsSync(trackRoot)) return { track, categories: [] }

  const categories = fs
    .readdirSync(trackRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => loadCategory(path.join(trackRoot, entry.name), track, []))
    .sort(byOrder)

  return { track, categories }
}

const cache: Partial<Record<DocsTrack, DocsTree>> = {}

export const getDocsTree = (track: DocsTrack): DocsTree => {
  if (process.env.NODE_ENV !== 'production') return loadTree(track)
  if (!cache[track]) cache[track] = loadTree(track)
  return cache[track]!
}

const flattenArticles = (categories: DocCategory[]): DocArticle[] =>
  categories.flatMap((category) => [
    ...category.articles,
    ...flattenArticles(category.subcategories),
  ])

export const getAllArticles = (track: DocsTrack): DocArticle[] =>
  flattenArticles(getDocsTree(track).categories)

export const findArticle = (
  track: DocsTrack,
  slugParts: string[],
): DocArticle | undefined => {
  const target = slugParts.join('/')
  return getAllArticles(track).find((article) => article.slugParts.join('/') === target)
}

/** Category labels on the path to an article, for breadcrumbs. */
export const findBreadcrumbs = (track: DocsTrack, slugParts: string[]): string[] => {
  const labels: string[] = []
  let categories = getDocsTree(track).categories
  for (const part of slugParts.slice(0, -1)) {
    const category = categories.find((c) => c.slug === part)
    if (!category) break
    labels.push(category.label)
    categories = category.subcategories
  }
  return labels
}

const toNavCategory = (category: DocCategory): DocsNavCategory => ({
  slug: category.slug,
  label: category.label,
  articles: category.articles.map(({ url, title }) => ({ url, title })),
  subcategories: category.subcategories.map(toNavCategory),
})

export const getNavTree = (track: DocsTrack): DocsNavCategory[] =>
  getDocsTree(track).categories.map(toNavCategory)

const SEARCH_TEXT_LIMIT = 4000

const collectSearchDocs = (
  categories: DocCategory[],
  parentLabel: string,
): SearchDoc[] =>
  categories.flatMap((category) => {
    const label = parentLabel ? `${parentLabel} → ${category.label}` : category.label
    return [
      ...category.articles.map((article) => ({
        track: article.track,
        url: article.url,
        title: article.title,
        description: article.description,
        category: label,
        headings: article.headings.map(({ id, text }) => ({ id, text })),
        text: article.plainText.slice(0, SEARCH_TEXT_LIMIT),
      })),
      ...collectSearchDocs(category.subcategories, label),
    ]
  })

export const getSearchIndex = (): SearchDoc[] => [
  ...collectSearchDocs(getDocsTree('manager').categories, ''),
  ...collectSearchDocs(getDocsTree('technical').categories, ''),
]

/** Previous/next article within a track, in sidebar order. */
export const getAdjacentArticles = (
  track: DocsTrack,
  slugParts: string[],
): { next?: { title: string; url: string }; prev?: { title: string; url: string } } => {
  const articles = getAllArticles(track)
  const target = slugParts.join('/')
  const index = articles.findIndex((article) => article.slugParts.join('/') === target)
  if (index === -1) return {}
  const pick = (article?: DocArticle) =>
    article ? { title: article.title, url: article.url } : undefined
  return { prev: pick(articles[index - 1]), next: pick(articles[index + 1]) }
}
