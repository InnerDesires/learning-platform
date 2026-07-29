import { describe, expect, it } from 'vitest'

import type { ImportedQuiz, ImportedStep } from '@/utilities/courseJsonImport'

import { parseQuizJson, parseStepsJson, textToLexical } from '@/utilities/courseJsonImport'

const expectOk = <T>(result: { ok: true; value: T } | { errors: string[]; ok: false }): T => {
  if (!result.ok) throw new Error(`expected success, got: ${result.errors.join(' | ')}`)
  return result.value
}

const expectErrors = <T>(result: { ok: true; value: T } | { errors: string[]; ok: false }) => {
  if (result.ok) throw new Error('expected failure, got success')
  return result.errors
}

describe('textToLexical', () => {
  it('splits blank-line-separated blocks into paragraphs', () => {
    const { root } = textToLexical('Перший абзац.\n\nДругий абзац.')

    expect(root.children).toHaveLength(2)
    expect(root.children?.[0].type).toBe('paragraph')
    expect(root.children?.[1].children?.[0].text).toBe('Другий абзац.')
  })

  it('never produces an empty root (Payload rejects one)', () => {
    const { root } = textToLexical('   ')

    expect(root.children).toHaveLength(1)
    expect(root.children?.[0].type).toBe('paragraph')
  })

  it('converts "- " blocks into a bullet list', () => {
    const { root } = textToLexical('- перший\n- другий')
    const list = root.children?.[0]

    expect(list?.type).toBe('list')
    expect(list?.listType).toBe('bullet')
    expect(list?.tag).toBe('ul')
    expect(list?.children).toHaveLength(2)
    expect(list?.children?.[0].type).toBe('listitem')
    expect(list?.children?.[1].children?.[0].text).toBe('другий')
  })

  it('converts "1. " blocks into a numbered list', () => {
    const { root } = textToLexical('1. перший\n2. другий')

    expect(root.children?.[0].listType).toBe('number')
    expect(root.children?.[0].tag).toBe('ol')
  })

  it('converts "> " blocks into a quote', () => {
    const { root } = textToLexical('> цитата')

    expect(root.children?.[0].type).toBe('quote')
  })

  it('marks **bold** spans with format 1', () => {
    const { root } = textToLexical('звичайний **жирний** текст')
    const children = root.children?.[0].children ?? []

    expect(children.map((node) => node.text)).toEqual(['звичайний ', 'жирний', ' текст'])
    expect(children.map((node) => node.format)).toEqual([0, 1, 0])
  })

  it('renders markdown headings as bold paragraphs (no heading feature in the editor)', () => {
    const { root } = textToLexical('## Заголовок')

    expect(root.children?.[0].type).toBe('paragraph')
    expect(root.children?.[0].children?.[0]).toMatchObject({ format: 1, text: 'Заголовок' })
  })

  it('keeps single newlines inside a block as line breaks', () => {
    const { root } = textToLexical('рядок один\nрядок два')

    expect(root.children).toHaveLength(1)
    expect(root.children?.[0].children?.[1].type).toBe('linebreak')
  })

  it('joins an array of strings into separate paragraphs', () => {
    const { root } = textToLexical(['один', 'два'])

    expect(root.children).toHaveLength(2)
  })
})

describe('parseStepsJson', () => {
  it('parses a text step from the documented schema', () => {
    const steps = expectOk(
      parseStepsJson(
        JSON.stringify({
          steps: [{ content: 'Тіло кроку.', duration: 8, title: 'Вступ', type: 'text' }],
        }),
      ),
    ) as ImportedStep[]

    expect(steps).toHaveLength(1)
    expect(steps[0]).toMatchObject({ blockType: 'richTextStep', duration: 8, title: 'Вступ' })
    expect((steps[0] as { content: { root: unknown } }).content.root).toBeDefined()
  })

  it('accepts a bare array as well as a { steps } wrapper', () => {
    const steps = expectOk(
      parseStepsJson(JSON.stringify([{ content: 'Текст', title: 'Крок', type: 'text' }])),
    )

    expect(steps).toHaveLength(1)
  })

  it('strips a ```json code fence', () => {
    const steps = expectOk(
      parseStepsJson('```json\n{"steps":[{"type":"text","title":"Крок","content":"Текст"}]}\n```'),
    )

    expect(steps).toHaveLength(1)
  })

  it('passes an already-Lexical content object through untouched', () => {
    const content = { root: { children: [], direction: 'ltr', format: '', indent: 0, type: 'root', version: 1 } }
    const steps = expectOk(
      parseStepsJson(JSON.stringify({ steps: [{ content, title: 'Крок', type: 'text' }] })),
    )

    expect((steps[0] as { content: unknown }).content).toEqual(content)
  })

  it('parses a video step and rejects a non-YouTube URL', () => {
    const steps = expectOk(
      parseStepsJson(
        JSON.stringify({
          steps: [
            {
              title: 'Відео',
              type: 'video',
              youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            },
          ],
        }),
      ),
    )
    expect(steps[0]).toMatchObject({ blockType: 'youtubeVideoStep' })

    const errors = expectErrors(
      parseStepsJson(
        JSON.stringify({ steps: [{ title: 'Відео', type: 'video', youtubeUrl: 'https://vimeo.com/1' }] }),
      ),
    )
    expect(errors[0]).toContain('YouTube')
  })

  it('infers the block type when "type" is missing', () => {
    const steps = expectOk(
      parseStepsJson(
        JSON.stringify([
          { title: 'Текст', content: 'Абзац' },
          { title: 'Відео', youtubeUrl: 'https://youtu.be/dQw4w9WgXcQ' },
          { title: 'Файл', file: 12 },
        ]),
      ),
    )

    expect(steps.map((step) => step.blockType)).toEqual([
      'richTextStep',
      'youtubeVideoStep',
      'fileStep',
    ])
  })

  it('reports every invalid step, not just the first', () => {
    const errors = expectErrors(
      parseStepsJson(
        JSON.stringify([
          { content: 'Текст', type: 'text' },
          { title: 'Без контенту', type: 'text' },
        ]),
      ),
    )

    expect(errors).toHaveLength(2)
    expect(errors[0]).toContain('Крок 1')
    expect(errors[1]).toContain('Крок 2')
  })

  it('rejects a duration outside 1–600', () => {
    expect(
      expectErrors(
        parseStepsJson(JSON.stringify([{ content: 'Т', duration: 900, title: 'Крок', type: 'text' }])),
      )[0],
    ).toContain('duration')
  })

  it('rejects malformed JSON, a wrong shape and an empty list', () => {
    expect(expectErrors(parseStepsJson('{ not json'))[0]).toContain('Некоректний JSON')
    expect(expectErrors(parseStepsJson('{"foo":1}'))[0]).toContain('steps')
    expect(expectErrors(parseStepsJson('[]'))[0]).toContain('порожній')
  })
})

describe('parseQuizJson', () => {
  it('parses the documented quiz schema including its settings', () => {
    const quiz = expectOk(
      parseQuizJson(
        JSON.stringify({
          quiz: {
            description: 'Опис',
            passingScore: 80,
            questions: [
              {
                answers: [
                  { isCorrect: true, text: 'Так' },
                  { isCorrect: false, text: 'Ні' },
                ],
                question: 'Питання?',
              },
            ],
            title: 'Фінальний тест',
          },
        }),
      ),
    ) as ImportedQuiz

    expect(quiz).toMatchObject({ description: 'Опис', passingScore: 80, title: 'Фінальний тест' })
    expect(quiz.questions[0].answers).toEqual([
      { isCorrect: true, text: 'Так' },
      { isCorrect: false, text: 'Ні' },
    ])
  })

  it('accepts a bare array of questions', () => {
    const quiz = expectOk(
      parseQuizJson(
        JSON.stringify([
          { answers: [{ isCorrect: true, text: 'A' }, { text: 'B' }], question: 'Q' },
        ]),
      ),
    )

    expect(quiz.questions).toHaveLength(1)
    expect(quiz.questions[0].answers[1].isCorrect).toBe(false)
  })

  it('marks string answers correct by index or by text', () => {
    const byIndex = expectOk(
      parseQuizJson(JSON.stringify([{ answers: ['A', 'B'], correct: 1, question: 'Q' }])),
    )
    expect(byIndex.questions[0].answers.map((a) => a.isCorrect)).toEqual([false, true])

    const byText = expectOk(
      parseQuizJson(JSON.stringify([{ answers: ['A', 'B'], correct: ['A'], question: 'Q' }])),
    )
    expect(byText.questions[0].answers.map((a) => a.isCorrect)).toEqual([true, false])
  })

  it('rejects a question with no correct answer', () => {
    const errors = expectErrors(
      parseQuizJson(
        JSON.stringify([
          {
            answers: [
              { isCorrect: false, text: 'A' },
              { isCorrect: false, text: 'B' },
            ],
            question: 'Q',
          },
        ]),
      ),
    )

    expect(errors[0]).toContain('правильної відповіді')
  })

  it('rejects a question with fewer than two answers', () => {
    expect(
      expectErrors(
        parseQuizJson(JSON.stringify([{ answers: [{ isCorrect: true, text: 'A' }], question: 'Q' }])),
      )[0],
    ).toContain('щонайменше 2')
  })

  it('rejects a question without text and an empty list', () => {
    expect(
      expectErrors(parseQuizJson(JSON.stringify([{ answers: ['A', 'B'], correct: 0 }])))[0],
    ).toContain('question')
    expect(expectErrors(parseQuizJson('[]'))[0]).toContain('порожній')
  })

  it('ignores a passing score outside 0–100', () => {
    const quiz = expectOk(
      parseQuizJson(
        JSON.stringify({
          passingScore: 140,
          questions: [{ answers: ['A', 'B'], correct: 0, question: 'Q' }],
        }),
      ),
    )

    expect(quiz.passingScore).toBeUndefined()
  })
})
