'use client'

import React, { useState, useMemo, useCallback } from 'react'
import { LoaderCircle } from 'lucide-react'
import { submitQuizAttempt } from '@/app/(frontend)/[locale]/courses/actions'
import { QuizResults } from './QuizResults'

type Answer = {
  id?: string | null
  text: string
  isCorrect?: boolean | null
}

type Question = {
  id?: string | null
  question: string
  answers?: Answer[] | null
}

type Labels = {
  quizSubmit: string
  quizTryAgain: string
  quizBackToCourse: string
  quizPassed: string
  quizFailed: string
  quizScore: string
  quizCorrectAnswers: string
  quizOf: string
  quizAttemptNumber: string
  quizQuestion: string
  quizSelectAnswer: string
  quizAttemptWarning: string
}

type Props = {
  courseId: number
  courseSlug: string
  questions: Question[]
  labels: Labels
}

function fisherYatesShuffle<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

type AttemptResult = {
  score: number
  passed: boolean
  correctAnswers: number
  totalQuestions: number
  attemptNumber: number
}

export const QuizForm: React.FC<Props> = ({
  courseId,
  courseSlug,
  questions,
  labels,
}) => {
  const [seed, setSeed] = useState(() => Date.now())
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string[]>>({})
  const [isPending, setIsPending] = useState(false)
  const [result, setResult] = useState<AttemptResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const shuffledQuestions = useMemo(() => {
    void seed
    return fisherYatesShuffle(questions).map((q) => ({
      ...q,
      answers: fisherYatesShuffle(q.answers ?? []),
    }))
  }, [questions, seed])

  const hasMultipleCorrect = useCallback(
    (question: Question): boolean => {
      const correctCount = (question.answers ?? []).filter((a) => a.isCorrect).length
      return correctCount > 1
    },
    [],
  )

  const handleSingleSelect = (questionId: string, answerId: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: [answerId],
    }))
  }

  const handleMultiSelect = (questionId: string, answerId: string) => {
    setSelectedAnswers((prev) => {
      const current = prev[questionId] ?? []
      const isSelected = current.includes(answerId)
      return {
        ...prev,
        [questionId]: isSelected
          ? current.filter((id) => id !== answerId)
          : [...current, answerId],
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsPending(true)
    setError(null)

    const answers = shuffledQuestions.map((q) => ({
      questionId: q.id ?? '',
      selectedAnswerIds: selectedAnswers[q.id ?? ''] ?? [],
    }))

    const response = await submitQuizAttempt(courseId, answers)
    setIsPending(false)

    if (response.success && response.attempt) {
      setResult(response.attempt)
    } else {
      setError(response.error ?? 'Something went wrong')
    }
  }

  const handleTryAgain = () => {
    setResult(null)
    setSelectedAnswers({})
    setError(null)
    setSeed(Date.now())
  }

  if (result) {
    return (
      <QuizResults
        score={result.score}
        passed={result.passed}
        correctAnswers={result.correctAnswers}
        totalQuestions={result.totalQuestions}
        attemptNumber={result.attemptNumber}
        courseSlug={courseSlug}
        labels={labels}
        onTryAgain={handleTryAgain}
      />
    )
  }

  const allAnswered = shuffledQuestions.every(
    (q) => (selectedAnswers[q.id ?? ''] ?? []).length > 0,
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="rounded-xl border border-orange/34 bg-orange/8 p-4 text-sm text-amber">
        <div className="flex gap-2">
          <svg className="w-5 h-5 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <span>{labels.quizAttemptWarning}</span>
        </div>
      </div>

      {shuffledQuestions.map((question, qIndex) => {
        const qId = question.id ?? ''
        const isMultiple = hasMultipleCorrect(question)
        const selected = selectedAnswers[qId] ?? []

        return (
          <div key={qId} className="overflow-hidden rounded-2xl border border-line bg-card">
            <div className="px-6 pb-4 pt-6">
              <span className="num font-display text-xs font-semibold uppercase tracking-[0.2em] text-orange">
                {labels.quizQuestion} {qIndex + 1} / {shuffledQuestions.length}
              </span>
              <h3 className="mt-2 text-[16.5px] font-bold leading-snug">{question.question}</h3>
            </div>
            <div className="space-y-2.5 px-6 pb-6">
              {question.answers?.map((answer) => {
                const aId = answer.id ?? ''
                const isSelected = selected.includes(aId)

                if (isMultiple) {
                  return (
                    <label
                      key={aId}
                      className={`flex cursor-pointer items-center gap-3.5 rounded-xl border px-4 py-3.5 text-sm font-medium transition-colors ${
                        isSelected
                          ? 'border-orange bg-orange/10'
                          : 'border-line-2 hover:border-steel'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleMultiSelect(qId, aId)}
                        className="h-5 w-5 flex-none cursor-pointer rounded border-steel accent-[--orange]"
                      />
                      <span>{answer.text}</span>
                    </label>
                  )
                }

                return (
                  <label
                    key={aId}
                    className={`flex cursor-pointer items-center gap-3.5 rounded-xl border px-4 py-3.5 text-sm font-medium transition-colors ${
                      isSelected
                        ? 'border-orange bg-orange/10'
                        : 'border-line-2 hover:border-steel'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question-${qId}`}
                      checked={isSelected}
                      onChange={() => handleSingleSelect(qId, aId)}
                      className="h-5 w-5 flex-none cursor-pointer accent-[--orange]"
                    />
                    <span>{answer.text}</span>
                  </label>
                )
              })}
            </div>
          </div>
        )
      })}

      {error && (
        <div className="rounded-xl border border-error/30 bg-error/10 p-3 text-sm text-error">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending || !allAnswered}
        className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-orange px-8 font-display text-sm font-semibold uppercase tracking-[0.1em] text-[#1B1204] shadow-[0_6px_20px_-8px_rgb(249_140_31/0.6)] transition-all hover:-translate-y-px hover:bg-amber disabled:pointer-events-none disabled:opacity-50"
      >
        {isPending && <LoaderCircle className="h-4 w-4 animate-spin" />}
        {labels.quizSubmit}
      </button>
    </form>
  )
}
