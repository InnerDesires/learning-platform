import React from 'react'
import { Download, Zap } from 'lucide-react'
import type { QuizAttempt } from '@/payload-types'
import type { SiteLocale } from '@/utilities/locales'
import { QUIZ_XP } from '@/utilities/xp'
import { formatDateTime } from '@/utilities/formatDateTime'

type Labels = {
  quizAttemptHistory: string
  quizAttemptNumber: string
  quizScore: string
  quizPassed: string
  quizFailed: string
  quizNoAttempts: string
  certificateDownload?: string
}

type Props = {
  attempts: QuizAttempt[]
  labels: Labels
  locale?: SiteLocale
  /** When set, passed attempts get a certificate download link. */
  certificateHref?: string
}

export const QuizAttemptHistory: React.FC<Props> = ({
  attempts,
  labels,
  locale = 'uk',
  certificateHref,
}) => {
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
              {formatDateTime(attempt.createdAt, locale)}
            </span>
            {attempt.passed && (
              <span className="num ml-auto inline-flex items-center gap-3 font-display text-[11.5px] font-semibold text-amber">
                <span className="inline-flex items-center gap-1">
                  <Zap className="h-3 w-3" fill="currentColor" strokeWidth={0} />+{QUIZ_XP} XP
                </span>
                {certificateHref && labels.certificateDownload && (
                  <a
                    href={certificateHref}
                    download
                    className="inline-flex items-center gap-1.5 rounded-full border border-line-2 px-3 py-1 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-fog transition-colors hover:border-orange hover:text-orange"
                  >
                    <Download className="h-3 w-3" />
                    {labels.certificateDownload}
                  </a>
                )}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
