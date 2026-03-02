'use client'

import React from 'react'

type Labels = {
  quizPassed: string
  quizFailed: string
  quizScore: string
  quizCorrectAnswers: string
  quizOf: string
  quizAttemptNumber: string
  quizTryAgain: string
  quizBackToCourse: string
}

type Props = {
  score: number
  passed: boolean
  correctAnswers: number
  totalQuestions: number
  attemptNumber: number
  courseSlug: string
  labels: Labels
  onTryAgain: () => void
}

export const QuizResults: React.FC<Props> = ({
  score,
  passed,
  correctAnswers,
  totalQuestions,
  attemptNumber,
  courseSlug,
  labels,
  onTryAgain,
}) => {
  return (
    <div className="text-center py-8 space-y-6">
      <div
        className={`inline-flex items-center justify-center w-24 h-24 rounded-full ${
          passed ? 'bg-green-500/10' : 'bg-red-500/10'
        }`}
      >
        {passed ? (
          <svg className="w-12 h-12 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        ) : (
          <svg className="w-12 h-12 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        )}
      </div>

      <div>
        <h2 className={`text-2xl font-bold ${passed ? 'text-green-600' : 'text-red-600'}`}>
          {passed ? labels.quizPassed : labels.quizFailed}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {labels.quizAttemptNumber} #{attemptNumber}
        </p>
      </div>

      <div className="flex justify-center gap-8">
        <div>
          <p className="text-3xl font-bold">{score}%</p>
          <p className="text-sm text-muted-foreground">{labels.quizScore}</p>
        </div>
        <div>
          <p className="text-3xl font-bold">
            {correctAnswers}/{totalQuestions}
          </p>
          <p className="text-sm text-muted-foreground">{labels.quizCorrectAnswers}</p>
        </div>
      </div>

      <div className="flex justify-center gap-3 pt-4">
        <button
          onClick={onTryAgain}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-6 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          {labels.quizTryAgain}
        </button>
        <a
          href={`/courses/${courseSlug}`}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-6 border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          {labels.quizBackToCourse}
        </a>
      </div>
    </div>
  )
}
