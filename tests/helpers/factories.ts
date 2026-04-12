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
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'paragraph',
        version: 1,
      },
    ],
    direction: 'ltr',
    format: '',
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
