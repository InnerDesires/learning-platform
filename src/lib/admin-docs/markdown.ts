import { Marked } from 'marked'
import slugify from 'slugify'

import type { DocHeading } from './types'

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

export const headingId = (text: string, used: Set<string>): string => {
  const base =
    slugify(text, { lower: true, strict: true, locale: 'uk' }) ||
    `rozdil-${used.size + 1}`
  let id = base
  let i = 2
  while (used.has(id)) {
    id = `${base}-${i}`
    i += 1
  }
  used.add(id)
  return id
}

const CALLOUT_KINDS: Record<string, string> = {
  danger: 'Небезпека',
  info: 'Примітка',
  tip: 'Порада',
  warning: 'Увага',
}

/**
 * Convert `:::kind Optional title` … `:::` blocks into callout divs before
 * handing the source to marked. Inner content is still markdown, so the
 * replacement keeps it in place and wraps it with raw-HTML markers that
 * marked passes through.
 */
const preprocessCallouts = (markdown: string): string =>
  markdown.replace(
    // The closing fence must match only its own line ([ \t]*, not \s*):
    // a greedy \s* would swallow the following blank line, glue the emitted
    // </div> to the next markdown block, and leave that block unparsed
    // inside the HTML block.
    /^:::(info|warning|danger|tip)([^\n]*)\n([\s\S]*?)^:::[ \t]*$/gm,
    (_match, kind: string, title: string, body: string) => {
      const heading = title.trim() || CALLOUT_KINDS[kind]
      return [
        `<div class="admin-docs-callout admin-docs-callout--${kind}">`,
        `<p class="admin-docs-callout__title">${escapeHtml(heading)}</p>`,
        '',
        body.trim(),
        '',
        '</div>',
      ].join('\n')
    },
  )

const stripHtml = (html: string): string =>
  html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()

export type RenderedMarkdown = {
  headings: DocHeading[]
  html: string
  plainText: string
}

export const renderMarkdown = (markdown: string): RenderedMarkdown => {
  const headings: DocHeading[] = []
  const usedIds = new Set<string>()

  const marked = new Marked({ gfm: true })

  marked.use({
    renderer: {
      heading({ tokens, depth }) {
        const inline = this.parser.parseInline(tokens)
        const text = stripHtml(inline)
        const id = headingId(text, usedIds)
        if (depth === 2 || depth === 3) {
          headings.push({ depth, id, text })
        }
        return [
          `<h${depth} id="${id}">`,
          inline,
          `<a class="admin-docs-anchor" href="#${id}" aria-label="Посилання на розділ «${escapeHtml(text)}»">#</a>`,
          `</h${depth}>\n`,
        ].join('')
      },
      link({ href, title, tokens }) {
        const inline = this.parser.parseInline(tokens)
        const isExternal = /^https?:\/\//.test(href)
        const attrs = [
          `href="${escapeHtml(href)}"`,
          title ? `title="${escapeHtml(title)}"` : '',
          isExternal ? 'target="_blank" rel="noopener noreferrer"' : '',
        ]
          .filter(Boolean)
          .join(' ')
        return `<a ${attrs}>${inline}</a>`
      },
      code({ text, lang }) {
        const language = (lang || '').split(/\s+/)[0]
        const classAttr = language ? ` class="language-${escapeHtml(language)}"` : ''
        return [
          '<div class="admin-docs-code">',
          language
            ? `<span class="admin-docs-code__lang">${escapeHtml(language)}</span>`
            : '',
          `<pre><code${classAttr}>${escapeHtml(text)}</code></pre>`,
          '</div>\n',
        ].join('')
      },
      table({ header, rows }) {
        const renderCell = (
          cell: { tokens: import('marked').Token[]; align: string | null },
          tag: 'td' | 'th',
        ): string => {
          const content = this.parser.parseInline(cell.tokens)
          const align = cell.align ? ` style="text-align:${cell.align}"` : ''
          return `<${tag}${align}>${content}</${tag}>`
        }
        const head = header.map((cell) => renderCell(cell, 'th')).join('')
        const body = rows
          .map((row) => `<tr>${row.map((cell) => renderCell(cell, 'td')).join('')}</tr>`)
          .join('\n')
        return [
          '<div class="admin-docs-table">',
          `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`,
          '</div>\n',
        ].join('')
      },
    },
  })

  const html = marked.parse(preprocessCallouts(markdown), { async: false })

  return {
    headings,
    html,
    plainText: stripHtml(html),
  }
}
