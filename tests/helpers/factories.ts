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
