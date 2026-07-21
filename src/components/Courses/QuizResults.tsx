'use client'

import React from 'react'
import { CircleCheck, CircleX, Download, Zap } from 'lucide-react'
import { QUIZ_XP } from '@/utilities/xp'

type Labels = {
  quizPassed: string
  quizFailed: string
  quizScore: string
  quizCorrectAnswers: string
  quizOf: string
  quizAttemptNumber: string
  quizTryAgain: string
  quizBackToCourse: string
  certificateDownload: string
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
        className={`inline-flex h-24 w-24 items-center justify-center rounded-full ${
          passed
            ? 'bg-success/15 shadow-[0_0_0_12px_rgb(49_196_127/0.08)]'
            : 'bg-error/15 shadow-[0_0_0_12px_rgb(240_85_95/0.08)]'
        }`}
      >
        {passed ? (
          <CircleCheck className="h-12 w-12 text-success" strokeWidth={1.8} />
        ) : (
          <CircleX className="h-12 w-12 text-error" strokeWidth={1.8} />
        )}
      </div>

      <div>
        <h2
          className={`heading-display text-3xl ${passed ? 'text-success' : 'text-error'}`}
        >
          {passed ? labels.quizPassed : labels.quizFailed}
        </h2>
        <p className="num mt-1.5 text-sm text-fog">
          {labels.quizAttemptNumber} #{attemptNumber}
        </p>
        {passed && (
          <p className="num mt-3 inline-flex items-center gap-1.5 rounded-full border border-orange/34 bg-orange/12 px-4 py-1.5 font-display text-sm font-semibold text-amber">
            <Zap className="h-4 w-4" fill="currentColor" strokeWidth={0} />+{QUIZ_XP} XP
          </p>
        )}
      </div>

      <div className="flex justify-center gap-10">
        <div>
          <p className="num font-display text-4xl font-bold text-orange">{score}%</p>
          <p className="mt-1 text-xs font-bold uppercase tracking-[0.1em] text-fog">{labels.quizScore}</p>
        </div>
        <div>
          <p className="num font-display text-4xl font-bold text-cloud">
            {correctAnswers}/{totalQuestions}
          </p>
          <p className="mt-1 text-xs font-bold uppercase tracking-[0.1em] text-fog">{labels.quizCorrectAnswers}</p>
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-3 pt-4">
        {passed ? (
          <>
            <a
              href={`/courses/${courseSlug}/certificate`}
              download
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-orange px-7 font-display text-sm font-semibold uppercase tracking-[0.1em] text-[#1B1204] transition-all hover:-translate-y-px hover:bg-amber"
            >
              <Download className="h-4 w-4" />
              {labels.certificateDownload}
            </a>
            <a
              href={`/courses/${courseSlug}`}
              className="inline-flex h-11 items-center justify-center rounded-full border-[1.5px] border-line-2 px-7 font-display text-sm font-semibold uppercase tracking-[0.1em] text-cloud transition-colors hover:border-orange hover:text-orange"
            >
              {labels.quizBackToCourse}
            </a>
            <button
              onClick={onTryAgain}
              className="inline-flex h-11 items-center justify-center rounded-full border-[1.5px] border-line-2 px-7 font-display text-sm font-semibold uppercase tracking-[0.1em] text-fog transition-colors hover:border-orange hover:text-orange"
            >
              {labels.quizTryAgain}
            </button>
          </>
        ) : (
          <>
            <button
              onClick={onTryAgain}
              className="inline-flex h-11 items-center justify-center rounded-full bg-orange px-7 font-display text-sm font-semibold uppercase tracking-[0.1em] text-[#1B1204] transition-all hover:-translate-y-px hover:bg-amber"
            >
              {labels.quizTryAgain}
            </button>
            <a
              href={`/courses/${courseSlug}`}
              className="inline-flex h-11 items-center justify-center rounded-full border-[1.5px] border-line-2 px-7 font-display text-sm font-semibold uppercase tracking-[0.1em] text-cloud transition-colors hover:border-orange hover:text-orange"
            >
              {labels.quizBackToCourse}
            </a>
          </>
        )}
      </div>
    </div>
  )
}
