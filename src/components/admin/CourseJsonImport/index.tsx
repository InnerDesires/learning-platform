'use client'

import { toast, useForm } from '@payloadcms/ui'
import { useCallback, useMemo, useState } from 'react'

import type { ImportedCourse, ImportedQuiz } from '@/utilities/courseJsonImport'

import {
  parseQuizJson,
  parseStepsJson,
  QUIZ_PROMPT,
  STEPS_PROMPT,
} from '@/utilities/courseJsonImport'
import './index.scss'

const baseClass = 'course-json-import'

type Target = 'quiz' | 'steps'

type Props = {
  target?: Target
}

const COPY: Record<
  Target,
  { description: string; forms: [string, string, string]; title: string }
> = {
  quiz: {
    description:
      'Згенеруйте питання тесту за допомогою AI та вставте отриманий JSON, щоб додати їх до наявних або замінити їх повністю.',
    forms: ['питання', 'питання', 'питань'],
    title: 'Питання тесту з JSON',
  },
  steps: {
    description:
      'Згенеруйте кроки за допомогою AI та вставте отриманий JSON, щоб додати їх до наявних або замінити їх повністю.',
    forms: ['крок', 'кроки', 'кроків'],
    title: 'Кроки курсу з JSON',
  },
}

/** Ukrainian plural: 1 крок, 2 кроки, 5 кроків. */
const plural = (count: number, [one, few, many]: [string, string, string]): string => {
  const mod100 = count % 100
  if (mod100 >= 11 && mod100 <= 14) return many
  const mod10 = count % 10
  if (mod10 === 1) return one
  if (mod10 >= 2 && mod10 <= 4) return few
  return many
}

const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // The Clipboard API needs a secure context and permission — fall back to the
    // execCommand recipe, which works in more places but can also be refused.
    try {
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.setAttribute('readonly', '')
      textarea.style.position = 'fixed'
      textarea.style.top = '0'
      textarea.style.left = '-9999px'
      document.body.appendChild(textarea)
      textarea.select()
      textarea.setSelectionRange(0, text.length)
      const copied = document.execCommand('copy')
      document.body.removeChild(textarea)
      return copied
    } catch {
      return false
    }
  }
}

export const CourseJsonImport: React.FC<Props> = ({ target = 'steps' }) => {
  const { getData, reset, setModified } = useForm()
  const [open, setOpen] = useState(false)
  const [raw, setRaw] = useState('')
  const [busy, setBusy] = useState(false)
  const [confirmingReplace, setConfirmingReplace] = useState(false)

  const copy = COPY[target]

  const parsed = useMemo(() => {
    if (!raw.trim()) return null
    return target === 'steps' ? parseStepsJson(raw) : parseQuizJson(raw)
  }, [raw, target])

  const importedCount = parsed?.ok
    ? target === 'steps'
      ? (parsed.value as ImportedCourse).steps.length
      : (parsed.value as ImportedQuiz).questions.length
    : 0

  const existingCount = (): number => {
    const data = getData() as Record<string, unknown>
    if (target === 'steps') return Array.isArray(data.steps) ? data.steps.length : 0
    const quiz = data.quiz
    const questions = quiz && typeof quiz === 'object' ? (quiz as Record<string, unknown>).questions : undefined
    return Array.isArray(questions) ? questions.length : 0
  }

  const handleCopyPrompt = useCallback(async () => {
    const copied = await copyToClipboard(target === 'steps' ? STEPS_PROMPT : QUIZ_PROMPT)
    if (copied) toast.success('Промпт скопійовано — вставте його в AI-чат.')
    else toast.error('Не вдалося скопіювати промпт.')
  }, [target])

  const applyImport = useCallback(
    async (mode: 'append' | 'replace') => {
      if (!parsed?.ok) return

      setBusy(true)

      try {
        const data = getData() as Record<string, unknown>
        let nextData: Record<string, unknown>

        if (target === 'steps') {
          const imported = parsed.value as ImportedCourse
          const existing = Array.isArray(data.steps) ? data.steps : []
          nextData = {
            ...data,
            // Course title/description are optional in the JSON — only overwrite
            // what was actually provided.
            ...(imported.title ? { title: imported.title } : {}),
            ...(imported.description ? { description: imported.description } : {}),
            steps: mode === 'append' ? [...existing, ...imported.steps] : imported.steps,
          }
        } else {
          const imported = parsed.value as ImportedQuiz
          const quiz = (typeof data.quiz === 'object' && data.quiz !== null
            ? data.quiz
            : {}) as Record<string, unknown>
          const existing = Array.isArray(quiz.questions) ? quiz.questions : []

          nextData = {
            ...data,
            quiz: {
              ...quiz,
              // Importing questions is only ever meaningful with the quiz turned on.
              enabled: true,
              ...(imported.title ? { title: imported.title } : {}),
              ...(imported.description ? { description: imported.description } : {}),
              ...(imported.passingScore !== undefined
                ? { passingScore: imported.passingScore }
                : {}),
              questions:
                mode === 'append' ? [...existing, ...imported.questions] : imported.questions,
            },
          }
        }

        // `reset` rebuilds the whole form state from the given data on the server, which is
        // the only reliable way to add rich-text/blocks rows that render correctly. It also
        // clears the modified flag, so re-set it to keep the save button live.
        await reset(nextData)
        setModified(true)

        const noun = plural(importedCount, copy.forms)
        toast.success(
          mode === 'append'
            ? `Додано ${importedCount} ${noun}.`
            : `Замінено на ${importedCount} ${noun}.`,
        )
        setRaw('')
        setOpen(false)
        setConfirmingReplace(false)
      } catch {
        toast.error('Не вдалося застосувати JSON.')
      } finally {
        setBusy(false)
      }
    },
    [copy.forms, getData, importedCount, parsed, reset, setModified, target],
  )

  return (
    <div className={baseClass}>
      <div className={`${baseClass}__header`}>
        <span className={`${baseClass}__title`}>{copy.title}</span>
        <div className={`${baseClass}__header-actions`}>
          <button className={`${baseClass}__ghost`} onClick={handleCopyPrompt} type="button">
            Скопіювати промпт для AI
          </button>
          <button
            className={`${baseClass}__ghost`}
            onClick={() => {
              setOpen((prev) => !prev)
              setConfirmingReplace(false)
            }}
            type="button"
          >
            {open ? 'Сховати' : 'Імпорт з JSON'}
          </button>
        </div>
      </div>

      {open && (
        <div className={`${baseClass}__panel`}>
          <p className={`${baseClass}__description`}>{copy.description}</p>

          <textarea
            className={`${baseClass}__textarea`}
            onChange={(e) => {
              setRaw(e.target.value)
              setConfirmingReplace(false)
            }}
            placeholder={
              target === 'steps'
                ? '{ "steps": [ { "type": "text", "title": "...", "content": "..." } ] }'
                : '{ "quiz": { "questions": [ { "question": "...", "answers": [...] } ] } }'
            }
            rows={10}
            spellCheck={false}
            value={raw}
          />

          {parsed && !parsed.ok && (
            <ul className={`${baseClass}__errors`}>
              {parsed.errors.slice(0, 10).map((error, index) => (
                <li key={index}>{error}</li>
              ))}
              {parsed.errors.length > 10 && <li>…та ще {parsed.errors.length - 10}.</li>}
            </ul>
          )}

          {parsed?.ok && (
            <p className={`${baseClass}__ok`}>
              Розпізнано {importedCount} {plural(importedCount, copy.forms)}.
            </p>
          )}

          {confirmingReplace ? (
            <div className={`${baseClass}__confirm`}>
              <span>
                Замінити наявні ({existingCount()}) на {importedCount}? Поточні дані буде втрачено.
              </span>
              <div className={`${baseClass}__actions`}>
                <button
                  className={`${baseClass}__button ${baseClass}__button--secondary`}
                  disabled={busy}
                  onClick={() => setConfirmingReplace(false)}
                  type="button"
                >
                  Скасувати
                </button>
                <button
                  className={`${baseClass}__button ${baseClass}__button--danger`}
                  disabled={busy}
                  onClick={() => applyImport('replace')}
                  type="button"
                >
                  Так, замінити
                </button>
              </div>
            </div>
          ) : (
            <div className={`${baseClass}__actions`}>
              <button
                className={`${baseClass}__button`}
                disabled={!parsed?.ok || busy}
                onClick={() => applyImport('append')}
                type="button"
              >
                Додати за допомогою JSON
              </button>
              <button
                className={`${baseClass}__button ${baseClass}__button--secondary`}
                disabled={!parsed?.ok || busy}
                onClick={() => {
                  if (existingCount() === 0) void applyImport('replace')
                  else setConfirmingReplace(true)
                }}
                type="button"
              >
                Замінити за допомогою JSON
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default CourseJsonImport
