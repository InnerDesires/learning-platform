import React from 'react'
import Link from 'next/link'
import { ArrowRight, Check, ClipboardCheck, Download, FileText, Lock, Play } from 'lucide-react'
import { cn } from '@/utilities/ui'
import { XpChip } from '@/components/brand'
import { STEP_XP, QUIZ_XP } from '@/utilities/xp'

type Step = {
  id?: string | null
  blockType: string
  title?: string
  [key: string]: unknown
}

function getStepIcon(blockType: string) {
  switch (blockType) {
    case 'richTextStep':
      return <FileText className="h-4 w-4" />
    case 'youtubeVideoStep':
      return <Play className="h-4 w-4" />
    case 'fileStep':
      return <Download className="h-4 w-4" />
    default:
      return <span className="inline-block h-4 w-4 text-center">•</span>
  }
}

type Props = {
  steps: Step[]
  courseSlug: string
  completedSteps: string[]
  activeStepIndex?: number
  linked?: boolean
  completedLabel: string
  stepsLabel: string
  localePrefix?: string
  compact?: boolean
  typeLabels?: { richTextStep: string; youtubeVideoStep: string; fileStep: string }
  minutesLabel?: string
  quiz?: {
    enabled: boolean
    passed: boolean
    allStepsCompleted: boolean
    label: string
    lockedLabel: string
    passedLabel: string
  }
  className?: string
}

export const StepsList: React.FC<Props> = ({
  steps,
  courseSlug,
  completedSteps,
  activeStepIndex,
  linked = false,
  completedLabel,
  stepsLabel,
  localePrefix = '',
  compact = false,
  typeLabels,
  minutesLabel,
  quiz,
  className,
}) => {
  return (
    <nav className={cn('grid gap-2.5', className)}>
      {steps.map((step, i) => {
        const isActive = i === activeStepIndex
        const isComplete = completedSteps.includes(step.id ?? '')
        const title = step.title || `${stepsLabel} ${i + 1}`
        const typeLabel = typeLabels?.[step.blockType as keyof typeof typeLabels]
        const duration = typeof step.duration === 'number' && step.duration > 0 ? step.duration : null

        const rowClass = compact
          ? cn(
              'flex items-center gap-3 rounded-[10px] px-2.5 py-2 transition-colors',
              isActive ? 'bg-orange/12 text-cloud' : 'text-fog',
              linked && 'hover:bg-steel/10 hover:text-cloud',
            )
          : cn(
              'flex items-center gap-4 rounded-xl border bg-card px-5 py-3.5 transition-colors',
              isActive
                ? 'border-orange bg-[linear-gradient(120deg,rgb(249_140_31/0.12),var(--navy))]'
                : 'border-line',
              linked && 'hover:border-orange/55',
            )

        const content = (
          <>
            <span
              className={cn(
                'num grid flex-none place-items-center rounded-full border-2 font-display font-semibold',
                compact ? 'h-6 w-6 text-[10.5px]' : 'h-9 w-9 text-[15px]',
                isComplete
                  ? 'border-orange bg-orange text-[#1B1204]'
                  : isActive
                    ? 'border-orange text-orange'
                    : 'border-line-2 text-fog',
              )}
            >
              {isComplete ? (
                <Check className={compact ? 'h-3 w-3' : 'h-4 w-4'} strokeWidth={3.5} />
              ) : (
                i + 1
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span
                className={cn(
                  'block truncate font-semibold',
                  compact ? 'text-[12.5px]' : 'text-sm text-cloud',
                )}
              >
                {title}
              </span>
              {!compact && (
                <span className="mt-0.5 flex items-center gap-2 text-[11px] text-steel">
                  <span className="flex items-center gap-1.5">
                    {getStepIcon(step.blockType)}
                    {typeLabel}
                    {duration && minutesLabel && (
                      <span className="num">
                        · {duration} {minutesLabel}
                      </span>
                    )}
                  </span>
                  <XpChip xp={STEP_XP} className="!text-[10.5px]" />
                </span>
              )}
            </span>
            {isComplete && !compact && (
              <span className="hidden items-center gap-1.5 whitespace-nowrap text-[11px] font-bold uppercase tracking-[0.1em] text-success sm:flex">
                {completedLabel}
              </span>
            )}
            {isActive && !isComplete && !compact && (
              <span className="hidden items-center gap-1.5 whitespace-nowrap text-[11px] font-bold uppercase tracking-[0.1em] text-orange sm:flex">
                <ArrowRight className="h-3.5 w-3.5" />
              </span>
            )}
          </>
        )

        if (linked) {
          return (
            <Link key={step.id ?? i} href={`${localePrefix}/courses/${courseSlug}/steps/${i + 1}`} className={rowClass}>
              {content}
            </Link>
          )
        }

        return (
          <div key={step.id ?? i} className={rowClass}>
            {content}
          </div>
        )
      })}
      {quiz?.enabled &&
        (() => {
          const isQuizLocked = !quiz.allStepsCompleted
          const isQuizPassed = quiz.passed

          const quizContent = (
            <>
              <span
                className={cn(
                  'grid flex-none place-items-center rounded-full border-2',
                  compact ? 'h-6 w-6' : 'h-9 w-9',
                  isQuizPassed
                    ? 'border-orange bg-orange text-[#1B1204]'
                    : isQuizLocked
                      ? 'border-line-2 text-steel'
                      : 'border-amber text-amber',
                )}
              >
                {isQuizPassed ? (
                  <Check className={compact ? 'h-3 w-3' : 'h-4 w-4'} strokeWidth={3.5} />
                ) : isQuizLocked ? (
                  <Lock className={compact ? 'h-3 w-3' : 'h-4 w-4'} />
                ) : (
                  <ClipboardCheck className={compact ? 'h-3 w-3' : 'h-4 w-4'} />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span
                  className={cn(
                    'block truncate font-semibold',
                    compact ? 'text-[12.5px]' : 'text-sm',
                    isQuizLocked ? 'text-steel' : compact ? undefined : 'text-cloud',
                  )}
                >
                  {quiz.label}
                </span>
                {!compact && (
                  <span className="mt-0.5 flex items-center gap-2 text-[11px] text-steel">
                    <XpChip xp={QUIZ_XP} className="!text-[10.5px]" />
                  </span>
                )}
              </span>
              {isQuizPassed && !compact && (
                <span className="hidden whitespace-nowrap text-[11px] font-bold uppercase tracking-[0.1em] text-success sm:inline">
                  {quiz.passedLabel}
                </span>
              )}
              {isQuizLocked && !compact && (
                <span className="hidden whitespace-nowrap text-[11px] font-bold uppercase tracking-[0.1em] text-steel sm:inline">
                  {quiz.lockedLabel}
                </span>
              )}
            </>
          )

          const quizRowClass = compact
            ? cn(
                'flex items-center gap-3 rounded-[10px] px-2.5 py-2 transition-colors',
                isQuizLocked ? 'opacity-60' : 'text-fog hover:bg-steel/10 hover:text-cloud',
              )
            : cn(
                'flex items-center gap-4 rounded-xl border bg-card px-5 py-3.5 transition-colors',
                isQuizLocked ? 'border-line opacity-70' : 'border-line hover:border-orange/55',
              )

          if (linked && !isQuizLocked) {
            return (
              <Link href={`${localePrefix}/courses/${courseSlug}/quiz`} className={quizRowClass}>
                {quizContent}
              </Link>
            )
          }

          return <div className={quizRowClass}>{quizContent}</div>
        })()}
    </nav>
  )
}
