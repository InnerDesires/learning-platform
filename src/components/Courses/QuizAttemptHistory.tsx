import React from 'react'
import type { QuizAttempt } from '@/payload-types'

type Labels = {
  quizAttemptHistory: string
  quizAttemptNumber: string
  quizScore: string
  quizPassed: string
  quizFailed: string
  quizNoAttempts: string
}

type Props = {
  attempts: QuizAttempt[]
  labels: Labels
}

export const QuizAttemptHistory: React.FC<Props> = ({ attempts, labels }) => {
  if (attempts.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">{labels.quizNoAttempts}</p>
    )
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-muted-foreground">{labels.quizAttemptHistory}</h3>
      <div className="space-y-1.5">
        {attempts.map((attempt) => (
          <div
            key={attempt.id}
            className="flex items-center justify-between gap-3 text-sm px-3 py-2 rounded-lg bg-secondary/50"
          >
            <span className="text-muted-foreground">
              {labels.quizAttemptNumber} #{attempt.attemptNumber}
            </span>
            <div className="flex items-center gap-3">
              <span className="font-medium">{attempt.score}%</span>
              {attempt.passed ? (
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-green-500/10 text-green-600">
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {labels.quizPassed}
                </span>
              ) : (
                <span className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full bg-red-500/10 text-red-600">
                  {labels.quizFailed}
                </span>
              )}
              <span className="text-xs text-muted-foreground">
                {new Date(attempt.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
