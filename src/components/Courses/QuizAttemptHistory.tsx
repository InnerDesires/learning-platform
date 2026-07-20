import React from 'react'
import { Zap } from 'lucide-react'
import type { QuizAttempt } from '@/payload-types'
import { QUIZ_XP } from '@/utilities/xp'

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
    return <p className="text-sm text-fog">{labels.quizNoAttempts}</p>
  }

  return (
    <div>
      <h3 className="heading-display mb-4 text-xl tracking-[0.06em]">{labels.quizAttemptHistory}</h3>
      <div className="grid gap-2.5">
        {attempts.map((attempt) => (
          <div
            key={attempt.id}
            className={`flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-xl border bg-card px-5 py-3.5 text-[13px] font-semibold ${
              attempt.passed ? 'border-line' : 'border-line opacity-90'
            }`}
          >
            <b
              className={`num min-w-[56px] font-display text-[19px] font-semibold ${
                attempt.passed ? 'text-success' : 'text-cloud'
              }`}
            >
              {attempt.score}%
            </b>
            <span
              className={`rounded-full px-3 py-1 font-display text-[11.5px] font-semibold uppercase tracking-[0.1em] ${
                attempt.passed ? 'bg-success/18 text-success' : 'bg-error/16 text-error'
              }`}
            >
              {attempt.passed ? labels.quizPassed : labels.quizFailed}
            </span>
            <span className="num text-fog">
              {labels.quizAttemptNumber} {attempt.attemptNumber}
            </span>
            <span className="num text-xs font-medium text-steel-dim">
              {new Date(attempt.createdAt).toLocaleDateString('uk-UA')}
            </span>
            {attempt.passed && (
              <span className="num ml-auto inline-flex items-center gap-1 font-display text-[11.5px] font-semibold text-amber">
                <Zap className="h-3 w-3" fill="currentColor" strokeWidth={0} />+{QUIZ_XP} XP
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
