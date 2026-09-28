export type DocsTrack = 'manager' | 'technical'

export type DocHeading = {
  depth: 2 | 3
  id: string
  text: string
}

export type DocArticle = {
  track: DocsTrack
  /** URL path segments below the track, e.g. ['courses', 'quiz'] */
  slugParts: string[]
  /** Full admin URL, e.g. /admin/docs/manager/courses/quiz */
  url: string
  title: string
  description: string
  order: number
  headings: DocHeading[]
  html: string
  /** Plain text used to build the client search index */
  plainText: string
  /** Absolute path of the source .md file */
  filePath: string
}

export type DocCategory = {
  track: DocsTrack
  slug: string
  label: string
  description: string
  order: number
  articles: DocArticle[]
  subcategories: DocCategory[]
}

export type DocsTree = {
  track: DocsTrack
  categories: DocCategory[]
}

export type SearchDoc = {
  track: DocsTrack
  url: string
  title: string
  description: string
  category: string
  headings: { id: string; text: string }[]
  text: string
}

export type DocsNavCategory = {
  slug: string
  label: string
  articles: { url: string; title: string }[]
  subcategories: DocsNavCategory[]
}

export const TRACKS: Record<
  DocsTrack,
  { label: string; shortLabel: string; description: string }
> = {
  manager: {
    label: 'Посібник менеджера',
    shortLabel: 'Для менеджерів',
    description:
      'Як керувати контентом платформи: курси, публікації, користувачі, коментарі, медіа та все, що потрібно для щоденної роботи в адмін-панелі.',
  },
  technical: {
    label: 'Технічна документація',
    shortLabel: 'Для розробників',
    description:
      'Архітектура, модель даних, бізнес-логіка, інфраструктура та робочі процеси для супроводу платформи й розробки нових функцій.',
  },
}

export const isDocsTrack = (value: string): value is DocsTrack =>
  value === 'manager' || value === 'technical'
