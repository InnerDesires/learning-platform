import { getPayload, Payload } from 'payload'
import config from '@/payload.config'
import { describe, it, beforeAll, afterAll, expect } from 'vitest'

let payload: Payload
const createdPageIds: number[] = []

const basePage = (suffix: string) => ({
  title: `Media Block Test ${suffix}`,
  slug: `media-block-test-${suffix}-${Date.now()}`,
  // hero is required by the generated Page type; matches the runtime default
  hero: { type: 'lowImpact' as const },
  _status: 'published' as const,
})

describe('MediaBlock — YouTube support', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })
  })

  afterAll(async () => {
    for (const id of createdPageIds) {
      await payload.delete({ collection: 'pages', id, context: { disableRevalidate: true } })
    }
  })

  it('creates a page with a YouTube media block without an upload', async () => {
    const page = await payload.create({
      collection: 'pages',
      context: { disableRevalidate: true },
      data: {
        ...basePage('youtube'),
        layout: [
          {
            blockType: 'mediaBlock',
            mediaType: 'youtube',
            youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          },
        ],
      },
    })
    createdPageIds.push(page.id)

    const block = page.layout?.[0]
    expect(block?.blockType).toBe('mediaBlock')
    if (block?.blockType === 'mediaBlock') {
      expect(block.mediaType).toBe('youtube')
      expect(block.youtubeUrl).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
    }
  })

  it('accepts youtu.be and shorts URLs', async () => {
    const page = await payload.create({
      collection: 'pages',
      context: { disableRevalidate: true },
      data: {
        ...basePage('short-urls'),
        layout: [
          {
            blockType: 'mediaBlock',
            mediaType: 'youtube',
            youtubeUrl: 'https://youtu.be/dQw4w9WgXcQ',
          },
          {
            blockType: 'mediaBlock',
            mediaType: 'youtube',
            youtubeUrl: 'https://www.youtube.com/shorts/dQw4w9WgXcQ',
          },
        ],
      },
    })
    createdPageIds.push(page.id)

    expect(page.layout).toHaveLength(2)
  })

  it('rejects a non-YouTube URL', async () => {
    await expect(
      payload.create({
        collection: 'pages',
        data: {
          ...basePage('bad-url'),
          layout: [
            {
              blockType: 'mediaBlock',
              mediaType: 'youtube',
              youtubeUrl: 'https://vimeo.com/123456',
            },
          ],
        },
      }),
    ).rejects.toThrow()
  })

  it('still requires an upload for the default media type', async () => {
    await expect(
      payload.create({
        collection: 'pages',
        data: {
          ...basePage('no-media'),
          layout: [
            {
              blockType: 'mediaBlock',
              mediaType: 'upload',
            },
          ],
        },
      }),
    ).rejects.toThrow()
  })
})
