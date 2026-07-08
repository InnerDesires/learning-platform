import { describe, it, expect } from 'vitest'
import { cyrillicSlugify } from '@/utilities/cyrillicSlugify'

// The function signature requires data and req for Payload's slugField API compatibility,
// but neither is used in the implementation — only valueToSlugify matters.
function slugify(value: string | undefined) {
  return cyrillicSlugify({ data: {}, req: {} as any, valueToSlugify: value })
}

describe('cyrillicSlugify', () => {
  // Empty input must yield `undefined` (stored as NULL), not `''`. Payload's slug
  // generator writes the returned value on autosaved draft creation; an empty string
  // collides on the unique `slug` index (valueMustBeUnique) whereas NULL does not.
  it('returns undefined for empty input', () => {
    expect(slugify('')).toBeUndefined()
  })

  it('returns undefined when valueToSlugify is undefined', () => {
    expect(slugify(undefined)).toBeUndefined()
  })

  it('returns undefined for whitespace-only input', () => {
    expect(slugify('   ')).toBeUndefined()
  })

  it('lowercases ASCII text', () => {
    expect(slugify('Hello World')).toBe('hello-world')
  })

  it('replaces spaces with hyphens', () => {
    expect(slugify('hello world')).toBe('hello-world')
  })

  it('collapses multiple spaces into a single hyphen', () => {
    expect(slugify('hello   world')).toBe('hello-world')
  })

  it('strips special characters in strict mode', () => {
    expect(slugify('hello! world?')).toBe('hello-world')
  })

  it('transliterates Ukrainian "тест" to "test"', () => {
    expect(slugify('тест')).toBe('test')
  })

  it('transliterates Ukrainian "курс" to "kurs"', () => {
    expect(slugify('курс')).toBe('kurs')
  })

  it('produces only lowercase ASCII + hyphens for mixed Ukrainian/Latin input', () => {
    const result = slugify('онлайн курс online')
    expect(result).toMatch(/^[a-z0-9-]+$/)
    expect(result).toContain('kurs')
    expect(result).toContain('online')
  })
})
