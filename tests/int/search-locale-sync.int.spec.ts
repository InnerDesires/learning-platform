import { getPayload, Payload } from 'payload'
import config from '@/payload.config'
import { describe, it, beforeAll, afterAll, expect } from 'vitest'
import { minimalLexicalContent } from '../helpers/factories'

let payload: Payload
const createdPageIds: number[] = []
const createdPostIds: number[] = []

// Regression tests for the "ghost card" bug: @payloadcms/plugin-search only syncs
// the locale of the saving request, so a doc published from the EN admin locale
// used to get a search row with an empty uk title (rendered as a blank card on
// /search). The searchLocaleSync plugin backfills the other locales.

const findSearchRow = async (relationTo: 'pages' | 'posts', value: number, locale: 'uk' | 'en') => {
  const { docs } = await payload.find({
    collection: 'search',
    depth: 0,
    locale,
    // no fallback: we assert what is actually stored per locale
    fallbackLocale: false,
    where: {
      'doc.relationTo': { equals: relationTo },
      'doc.value': { equals: value },
    },
  })
  return docs[0]
}

describe('search locale sync', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })
  })

  afterAll(async () => {
    for (const id of createdPageIds) {
      await payload.delete({ collection: 'pages', id, context: { disableRevalidate: true } })
    }
    for (const id of createdPostIds) {
      await payload.delete({ collection: 'posts', id, context: { disableRevalidate: true } })
    }
  })

  it('publishing a page from the EN locale still writes the uk search title', async () => {
    // Mirror the production scenario: page exists as a draft with a uk title,
    // then gets published while the admin UI is switched to EN.
    const page = await payload.create({
      collection: 'pages',
      context: { disableRevalidate: true },
      locale: 'uk',
      data: {
        title: 'Контакти (тест пошуку)',
        slug: `search-locale-sync-page-${Date.now()}`,
        hero: { type: 'lowImpact' as const },
        layout: [
          {
            blockType: 'mediaBlock',
            mediaType: 'youtube',
            youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          },
        ],
        _status: 'draft' as const,
      },
    })
    createdPageIds.push(page.id)

    // No search row while the page is a draft.
    expect(await findSearchRow('pages', page.id, 'uk')).toBeUndefined()

    await payload.update({
      collection: 'pages',
      id: page.id,
      context: { disableRevalidate: true },
      locale: 'en',
      data: {
        title: 'Contacts (search test)',
        // layout is localized + required, so the EN publish needs its own value
        layout: [
          {
            blockType: 'mediaBlock',
            mediaType: 'youtube',
            youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          },
        ],
        _status: 'published' as const,
      },
    })

    const enRow = await findSearchRow('pages', page.id, 'en')
    expect(enRow?.title).toBe('Contacts (search test)')

    // Before the fix this was undefined — the ghost card.
    const ukRow = await findSearchRow('pages', page.id, 'uk')
    expect(ukRow?.title).toBe('Контакти (тест пошуку)')
  })

  it('publishing a post from the uk locale backfills the en search title', async () => {
    const post = await payload.create({
      collection: 'posts',
      context: { disableRevalidate: true },
      locale: 'en',
      data: {
        title: 'Search sync post (en)',
        slug: `search-locale-sync-post-${Date.now()}`,
        content: minimalLexicalContent,
        _status: 'draft' as const,
      },
    })
    createdPostIds.push(post.id)

    await payload.update({
      collection: 'posts',
      id: post.id,
      context: { disableRevalidate: true },
      locale: 'uk',
      data: {
        title: 'Пост синхронізації пошуку',
        content: minimalLexicalContent,
        _status: 'published' as const,
      },
    })

    const ukRow = await findSearchRow('posts', post.id, 'uk')
    expect(ukRow?.title).toBe('Пост синхронізації пошуку')

    const enRow = await findSearchRow('posts', post.id, 'en')
    expect(enRow?.title).toBe('Search sync post (en)')
  })
})
