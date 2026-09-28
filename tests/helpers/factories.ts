/**
 * Minimal valid Lexical rich-text content for use in test fixtures.
 * Payload requires at least one paragraph child — an empty root fails validation.
 */
export const minimalLexicalContent = {
  root: {
    children: [
      {
        children: [
          { detail: 0, format: 0, mode: 'normal', style: '', text: 'content', type: 'text', version: 1 },
        ],
        direction: 'ltr' as const,
        format: '' as const,
        indent: 0,
        type: 'paragraph',
        version: 1,
      },
    ],
    direction: 'ltr' as const,
    format: '' as const,
    indent: 0,
    type: 'root',
    version: 1,
  },
}

export function minimalRichTextStep(title = 'Test Step') {
  return {
    blockType: 'richTextStep' as const,
    title,
    content: minimalLexicalContent,
  }
}

/**
 * Generates minimal course data with a unique slug to avoid DB unique constraint
 * violations when multiple test suites create courses in the same database.
 */
export function minimalCourseData(titlePrefix: string, stepCount = 1) {
  const uid = Date.now().toString(36)
  return {
    title: titlePrefix,
    slug: `${titlePrefix.toLowerCase().replace(/\s+/g, '-')}-${uid}`,
    steps: Array.from({ length: stepCount }, (_, i) => minimalRichTextStep(`Step ${i + 1}`)),
  }
}

/**
 * Minimal published event data with a unique slug. Defaults to an offline
 * event starting tomorrow; override any field (e.g. `_status: 'draft'`,
 * `locationType: 'virtual'`, a past `startDate`).
 */
export function minimalEventData(
  titlePrefix: string,
  overrides: Record<string, unknown> = {},
) {
  const uid = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)
  return {
    title: titlePrefix,
    slug: `${titlePrefix.toLowerCase().replace(/\s+/g, '-')}-${uid}`,
    startDate: tomorrow.toISOString(),
    locationType: 'local' as const,
    address: 'Київ, вул. Тестова, 1',
    _status: 'published' as const,
    ...overrides,
  }
}
