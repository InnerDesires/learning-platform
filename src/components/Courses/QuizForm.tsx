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
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-700 dark:text-amber-400">
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
          <div key={qId} className="rounded-xl border border-border/60 bg-card/50 overflow-hidden">
            <div className="px-5 pt-5 pb-4">
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                  {qIndex + 1}
                </span>
                <h3 className="font-medium text-[15px] leading-snug pt-0.5">{question.question}</h3>
              </div>
            </div>
            <div className="px-5 pb-5 space-y-2">
              {question.answers?.map((answer) => {
                const aId = answer.id ?? ''
                const isSelected = selected.includes(aId)

                if (isMultiple) {
                  return (
                    <label
                      key={aId}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        isSelected
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleMultiSelect(qId, aId)}
                        className="w-4 h-4 rounded border-border"
                      />
                      <span className="text-sm">{answer.text}</span>
                    </label>
                  )
                }

                return (
                  <label
                    key={aId}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question-${qId}`}
                      checked={isSelected}
                      onChange={() => handleSingleSelect(qId, aId)}
                      className="w-4 h-4 border-border"
                    />
                    <span className="text-sm">{answer.text}</span>
                  </label>
                )
              })}
            </div>
          </div>
        )
      })}

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending || !allAnswered}
        className="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium h-11 px-8 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:pointer-events-none"
      >
        {isPending && <LoaderCircle className="w-4 h-4 animate-spin" />}
        {labels.quizSubmit}
      </button>
    </form>
  )
}
