/**
 * Parsing and normalisation for the "import from JSON" panels in the course editor
 * (`src/components/admin/CourseJsonImport`).
 *
 * The JSON is meant to be produced by an LLM from the prompt the panel copies, so the
 * parser is deliberately lenient about shape (wrapper object or bare array, a few field
 * aliases, plain-text rich content) and strict about anything the collection itself would
 * reject later — a step without a title, a bad YouTube URL, a question without a correct
 * answer. Failing here produces a readable Ukrainian message; failing on save produces a
 * field error buried three levels deep in the form.
 */

export const YOUTUBE_URL_REGEX =
  /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/|shorts\/)|youtu\.be\/)/

const MAX_DURATION = 600

// ---------------------------------------------------------------------------
// Lexical
// ---------------------------------------------------------------------------

export type LexicalNode = {
  children?: LexicalNode[]
  type: string
  version: number
  [key: string]: unknown
}

export type LexicalRoot = {
  root: LexicalNode
}

const textNode = (text: string): LexicalNode => ({
  detail: 0,
  format: 0,
  mode: 'normal',
  style: '',
  text,
  type: 'text',
  version: 1,
})

const elementNode = (type: string, children: LexicalNode[]) =>
  ({
    children,
    direction: 'ltr',
    format: '',
    indent: 0,
    type,
    version: 1,
  }) satisfies LexicalNode

const paragraphNode = (lines: string[]): LexicalNode => {
  const children: LexicalNode[] = []

  lines.forEach((line, index) => {
    if (index > 0) children.push({ type: 'linebreak', version: 1 })
    children.push(textNode(line))
  })

  return elementNode('paragraph', children)
}

/**
 * Converts plain text into a Lexical editor state: a blank line starts a new
 * paragraph, a single newline is a line break inside one.
 *
 * Plain text only — no markdown. Formatting is the editor's job, and guessing
 * at lists/headings/bold produced nodes that did not always match what the
 * course editor's feature set can render.
 */
export function textToLexical(input: string | string[]): LexicalRoot {
  const source = (Array.isArray(input) ? input.join('\n\n') : input).replace(/\r\n/g, '\n')

  const children: LexicalNode[] = source
    .split(/\n\s*\n/)
    .map((block) =>
      block
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean),
    )
    .filter((lines) => lines.length > 0)
    .map(paragraphNode)

  // Payload rejects an empty root — always keep at least one paragraph.
  if (children.length === 0) children.push(paragraphNode(['']))

  return { root: elementNode('root', children) }
}

const isLexicalState = (value: unknown): value is LexicalRoot => {
  if (!isRecord(value)) return false
  const root = value.root
  return isRecord(root) && Array.isArray(root.children)
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

export type ParseResult<T> = { ok: true; value: T } | { errors: string[]; ok: false }

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const readString = (source: Record<string, unknown>, keys: string[]): string | undefined => {
  for (const key of keys) {
    const value = source[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return undefined
}

/** LLM output regularly arrives wrapped in a ```json fence — strip it before parsing. */
const stripCodeFence = (raw: string): string => {
  const trimmed = raw.trim()
  if (!trimmed.startsWith('```')) return trimmed
  return trimmed
    .replace(/^```[a-zA-Z]*\s*/, '')
    .replace(/```$/, '')
    .trim()
}

const parseRawJson = (raw: string): ParseResult<unknown> => {
  const source = stripCodeFence(raw)
  if (!source) return { errors: ['Вставте JSON.'], ok: false }

  try {
    return { ok: true, value: JSON.parse(source) }
  } catch (err) {
    return { errors: [`Некоректний JSON: ${(err as Error).message}`], ok: false }
  }
}

const parseDuration = (source: Record<string, unknown>, label: string): ParseResult<number | undefined> => {
  const raw = source.duration ?? source.durationMinutes ?? source.minutes
  if (raw === undefined || raw === null || raw === '') return { ok: true, value: undefined }

  const value = typeof raw === 'string' ? Number(raw) : raw
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 1 || value > MAX_DURATION) {
    return { errors: [`${label}: «duration» має бути числом від 1 до ${MAX_DURATION}.`], ok: false }
  }

  return { ok: true, value: Math.round(value) }
}

// ---------------------------------------------------------------------------
// Steps
// ---------------------------------------------------------------------------

export type ImportedStep =
  | {
      blockType: 'fileStep'
      description?: string
      duration?: number
      file: number | string
      title: string
    }
  | {
      blockType: 'richTextStep'
      content: LexicalRoot
      duration?: number
      title: string
    }
  | {
      blockType: 'youtubeVideoStep'
      description?: string
      duration?: number
      title: string
      youtubeUrl: string
    }

export type ImportedCourse = {
  description?: string
  steps: ImportedStep[]
  title?: string
}

const STEP_TYPE_ALIASES: Record<string, ImportedStep['blockType']> = {
  file: 'fileStep',
  filestep: 'fileStep',
  pdf: 'fileStep',
  presentation: 'fileStep',
  rich: 'richTextStep',
  richtext: 'richTextStep',
  richtextstep: 'richTextStep',
  text: 'richTextStep',
  textstep: 'richTextStep',
  video: 'youtubeVideoStep',
  videostep: 'youtubeVideoStep',
  youtube: 'youtubeVideoStep',
  youtubevideostep: 'youtubeVideoStep',
}

const resolveStepType = (source: Record<string, unknown>): ImportedStep['blockType'] | undefined => {
  const declared = readString(source, ['type', 'blockType', 'kind'])
  if (declared) return STEP_TYPE_ALIASES[declared.toLowerCase().replace(/[\s_-]/g, '')]

  // No type given — infer it from the fields that are present.
  if (source.youtubeUrl || source.videoUrl) return 'youtubeVideoStep'
  if (source.file || source.fileId) return 'fileStep'
  if (source.content || source.body) return 'richTextStep'
  return undefined
}

const parseStep = (entry: unknown, index: number): ParseResult<ImportedStep> => {
  const label = `Крок ${index}`

  if (!isRecord(entry)) return { errors: [`${label}: очікується обʼєкт.`], ok: false }

  const blockType = resolveStepType(entry)
  if (!blockType) {
    return {
      errors: [`${label}: невідомий тип кроку. Дозволено «text», «video», «file».`],
      ok: false,
    }
  }

  const title = readString(entry, ['title', 'name', 'heading'])
  if (!title) return { errors: [`${label}: відсутнє поле «title».`], ok: false }

  const duration = parseDuration(entry, label)
  if (!duration.ok) return duration

  const description = readString(entry, ['description', 'summary'])

  if (blockType === 'richTextStep') {
    const rawContent = entry.content ?? entry.body ?? entry.text

    if (isLexicalState(rawContent)) {
      return { ok: true, value: { blockType, content: rawContent, duration: duration.value, title } }
    }

    const isStringArray = Array.isArray(rawContent) && rawContent.every((it) => typeof it === 'string')
    if (typeof rawContent !== 'string' && !isStringArray) {
      return { errors: [`${label}: відсутнє поле «content» (текст кроку).`], ok: false }
    }

    const asText = (isStringArray ? (rawContent as string[]).join('\n\n') : (rawContent as string)).trim()
    if (!asText) return { errors: [`${label}: поле «content» порожнє.`], ok: false }

    return {
      ok: true,
      value: { blockType, content: textToLexical(asText), duration: duration.value, title },
    }
  }

  if (blockType === 'youtubeVideoStep') {
    const youtubeUrl = readString(entry, ['youtubeUrl', 'url', 'videoUrl', 'link'])
    if (!youtubeUrl) return { errors: [`${label}: відсутнє поле «youtubeUrl».`], ok: false }
    if (!YOUTUBE_URL_REGEX.test(youtubeUrl)) {
      return { errors: [`${label}: «${youtubeUrl}» не є коректним YouTube-посиланням.`], ok: false }
    }

    return {
      ok: true,
      value: { blockType, description, duration: duration.value, title, youtubeUrl },
    }
  }

  const rawFile = entry.file ?? entry.fileId
  const file =
    typeof rawFile === 'number'
      ? rawFile
      : typeof rawFile === 'string' && rawFile.trim()
        ? Number.isNaN(Number(rawFile))
          ? rawFile.trim()
          : Number(rawFile)
        : undefined

  if (file === undefined) {
    return {
      errors: [`${label}: відсутнє поле «file» — ID файлу з колекції «Файли курсів».`],
      ok: false,
    }
  }

  return { ok: true, value: { blockType, description, duration: duration.value, file, title } }
}

/** Accepts `[...]`, `{ "steps": [...] }` or `{ "course": { "steps": [...] } }`. */
export function parseStepsJson(raw: string): ParseResult<ImportedCourse> {
  const parsed = parseRawJson(raw)
  if (!parsed.ok) return parsed

  const container = isRecord(parsed.value) && isRecord(parsed.value.course) ? parsed.value.course : parsed.value
  const list = Array.isArray(container)
    ? container
    : isRecord(container) && Array.isArray(container.steps)
      ? container.steps
      : undefined

  if (!list) {
    return { errors: ['Очікується масив кроків або обʼєкт з полем «steps».'], ok: false }
  }
  if (list.length === 0) return { errors: ['Список кроків порожній.'], ok: false }

  const errors: string[] = []
  const steps: ImportedStep[] = []

  list.forEach((entry, index) => {
    const result = parseStep(entry, index + 1)
    if (result.ok) steps.push(result.value)
    else errors.push(...result.errors)
  })

  if (errors.length > 0) return { errors, ok: false }

  const course: ImportedCourse = { steps }

  // Course-level fields are optional — a bare array of steps stays valid, and the
  // quiz keeps its own panel.
  if (isRecord(container)) {
    course.title = readString(container, ['title', 'name'])
    course.description = readString(container, ['description', 'summary'])
  }

  return { ok: true, value: course }
}

// ---------------------------------------------------------------------------
// Quiz
// ---------------------------------------------------------------------------

export type ImportedAnswer = { isCorrect: boolean; text: string }
export type ImportedQuestion = { answers: ImportedAnswer[]; question: string }
export type ImportedQuiz = {
  description?: string
  passingScore?: number
  questions: ImportedQuestion[]
  title?: string
}

const readCorrectMarkers = (source: Record<string, unknown>): (number | string)[] => {
  const raw = source.correct ?? source.correctIndex ?? source.correctIndexes ?? source.correctAnswer ?? source.answer
  if (raw === undefined || raw === null) return []
  const list = Array.isArray(raw) ? raw : [raw]
  return list.filter((it): it is number | string => typeof it === 'number' || typeof it === 'string')
}

const parseAnswers = (entry: Record<string, unknown>, label: string): ParseResult<ImportedAnswer[]> => {
  const raw = entry.answers ?? entry.options ?? entry.variants ?? entry.choices

  if (!Array.isArray(raw) || raw.length === 0) {
    return { errors: [`${label}: відсутній масив «answers».`], ok: false }
  }
  if (raw.length < 2) {
    return { errors: [`${label}: потрібно щонайменше 2 варіанти відповіді.`], ok: false }
  }

  // Answers given as plain strings mark the correct ones on the question itself,
  // either by 0-based index or by repeating the answer text.
  const markers = readCorrectMarkers(entry)
  const answers: ImportedAnswer[] = []

  for (const [index, item] of raw.entries()) {
    if (typeof item === 'string') {
      const text = item.trim()
      if (!text) return { errors: [`${label}: варіант ${index + 1} порожній.`], ok: false }
      answers.push({
        isCorrect: markers.some((marker) =>
          typeof marker === 'number' ? marker === index : marker.trim() === text,
        ),
        text,
      })
      continue
    }

    if (!isRecord(item)) {
      return { errors: [`${label}: варіант ${index + 1} має бути рядком або обʼєктом.`], ok: false }
    }

    const text = readString(item, ['text', 'answer', 'label', 'title'])
    if (!text) return { errors: [`${label}: варіант ${index + 1} без тексту.`], ok: false }

    const flag = item.isCorrect ?? item.correct ?? item.right ?? item.is_correct
    const isCorrect =
      flag === true ||
      flag === 'true' ||
      markers.some((marker) => (typeof marker === 'number' ? marker === index : marker.trim() === text))

    answers.push({ isCorrect, text })
  }

  if (!answers.some((answer) => answer.isCorrect)) {
    return { errors: [`${label}: не позначено жодної правильної відповіді.`], ok: false }
  }

  return { ok: true, value: answers }
}

const parseQuestion = (entry: unknown, index: number): ParseResult<ImportedQuestion> => {
  const label = `Питання ${index}`

  if (!isRecord(entry)) return { errors: [`${label}: очікується обʼєкт.`], ok: false }

  const question = readString(entry, ['question', 'text', 'title', 'prompt'])
  if (!question) return { errors: [`${label}: відсутнє поле «question».`], ok: false }

  const answers = parseAnswers(entry, label)
  if (!answers.ok) return answers

  return { ok: true, value: { answers: answers.value, question } }
}

/** Accepts `[...]`, `{ "questions": [...] }` or `{ "quiz": { "questions": [...] } }`. */
export function parseQuizJson(raw: string): ParseResult<ImportedQuiz> {
  const parsed = parseRawJson(raw)
  if (!parsed.ok) return parsed

  const container =
    isRecord(parsed.value) && isRecord(parsed.value.quiz) ? parsed.value.quiz : parsed.value
  const list = Array.isArray(container)
    ? container
    : isRecord(container) && Array.isArray(container.questions)
      ? container.questions
      : undefined

  if (!list) {
    return { errors: ['Очікується масив питань або обʼєкт з полем «questions».'], ok: false }
  }
  if (list.length === 0) return { errors: ['Список питань порожній.'], ok: false }

  const errors: string[] = []
  const questions: ImportedQuestion[] = []

  list.forEach((entry, index) => {
    const result = parseQuestion(entry, index + 1)
    if (result.ok) questions.push(result.value)
    else errors.push(...result.errors)
  })

  if (errors.length > 0) return { errors, ok: false }

  const quiz: ImportedQuiz = { questions }

  if (isRecord(container)) {
    quiz.title = readString(container, ['title', 'name'])
    quiz.description = readString(container, ['description'])

    const rawScore = container.passingScore ?? container.passing_score
    const score = typeof rawScore === 'string' ? Number(rawScore) : rawScore
    if (typeof score === 'number' && Number.isFinite(score) && score >= 0 && score <= 100) {
      quiz.passingScore = Math.round(score)
    }
  }

  return { ok: true, value: quiz }
}

// ---------------------------------------------------------------------------
// Prompts (copied to the clipboard for use with an LLM)
// ---------------------------------------------------------------------------

export const STEPS_PROMPT = `Ти — методист онлайн-курсів. Згенеруй кроки курсу у форматі JSON для імпорту в адмінку навчальної платформи.

ТЕМА КУРСУ: <опиши тут тему, цільову аудиторію та бажану кількість кроків>

Поверни ЛИШЕ валідний JSON без пояснень, коментарів та без огорожі \`\`\`.

Схема:
{
  "title": "Назва курсу",
  "description": "Короткий опис курсу (2–3 речення)",
  "steps": [
    {
      "type": "text",
      "title": "Заголовок текстового кроку",
      "content": "Перший абзац.\\n\\nДругий абзац.",
      "duration": 8
    },
    {
      "type": "video",
      "title": "Заголовок відео-кроку",
      "description": "Короткий опис відео",
      "youtubeUrl": "https://www.youtube.com/watch?v=XXXXXXXXXXX",
      "duration": 12
    }
  ]
}

Правила:
- "title" і "description" курсу — заповнюють назву та опис курсу. Якщо їх не вказати, поточні значення залишаться без змін.
- "type" — лише "text" або "video". Поле "title" кроку обовʼязкове.
- "content" (обовʼязкове для "text") — ЛИШЕ звичайний текст, без markdown-розмітки: без заголовків (#), списків ("- ", "1. "), цитат (">") та виділення (**). Абзаци розділяй порожнім рядком (\\n\\n). Форматування редагується вже в адмінці.
- "duration" — необовʼязкове, ціле число хвилин від 1 до 600.
- Крок "video" додавай лише з реальним YouTube-посиланням, яке тобі надали. Не вигадуй URL.
- Питання фінального тесту сюди НЕ додавай — для них є окрема панель імпорту.
- Уся мова контенту — українська.`

export const QUIZ_PROMPT = `Ти — методист онлайн-курсів. Згенеруй питання фінального тесту у форматі JSON для імпорту в адмінку навчальної платформи.

ТЕМА ТЕСТУ: <опиши тут тему курсу, матеріал, який перевіряємо, та бажану кількість питань>

Поверни ЛИШЕ валідний JSON без пояснень, коментарів та без огорожі \`\`\`.

Схема:
{
  "quiz": {
    "title": "Назва тесту",
    "description": "Короткий опис тесту",
    "passingScore": 70,
    "questions": [
      {
        "question": "Текст питання?",
        "answers": [
          { "text": "Правильний варіант", "isCorrect": true },
          { "text": "Хибний варіант", "isCorrect": false },
          { "text": "Ще один хибний варіант", "isCorrect": false }
        ]
      }
    ]
  }
}

Правила:
- Кожне питання має щонайменше 2 варіанти відповіді та ЩОНАЙМЕНШЕ ОДНУ правильну (isCorrect: true) — інакше імпорт буде відхилено.
- Якщо правильних відповідей кілька, познач "isCorrect": true для кожної з них.
- "passingScore" — ціле число від 0 до 100 (відсоток).
- "title", "description" і "passingScore" необовʼязкові: якщо їх не вказати, поточні налаштування тесту залишаться без змін.
- Формулюй питання однозначно, без варіантів «усі відповіді правильні».
- Уся мова контенту — українська.`
