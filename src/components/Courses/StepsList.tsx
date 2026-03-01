import React from 'react'
import Link from 'next/link'
import { cn } from '@/utilities/ui'

type Step = {
  id?: string | null
  blockType: string
  title?: string
  [key: string]: unknown
}

function getStepIcon(blockType: string) {
  switch (blockType) {
    case 'richTextStep':
      return (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      )
    case 'youtubeVideoStep':
      return (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="5 3 19 12 5 21 5 3" />
        </svg>
      )
    case 'fileStep':
      return (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      )
    default:
      return <span className="w-4 h-4 inline-block text-center">•</span>
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
  className,
}) => {
  return (
    <nav className={cn('space-y-1', className)}>
      {steps.map((step, i) => {
        const isActive = i === activeStepIndex
        const isComplete = completedSteps.includes(step.id ?? '')
        const title = step.title || `${stepsLabel} ${i + 1}`

        const content = (
          <>
            <span
              className={cn(
                'flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors',
                isComplete
                  ? 'bg-green-500 text-white'
                  : isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground',
              )}
            >
              {isComplete ? '✓' : i + 1}
            </span>
            <span className="flex-shrink-0 text-muted-foreground">
              {getStepIcon(step.blockType)}
            </span>
            <span className="flex-1 text-sm font-medium truncate">{title}</span>
            {isComplete && (
              <span className="text-green-600 text-xs font-medium hidden sm:inline">
                {completedLabel}
              </span>
            )}
          </>
        )

        if (linked) {
          return (
            <Link
              key={step.id ?? i}
              href={`/courses/${courseSlug}/steps/${i + 1}`}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'hover:bg-muted/50',
              )}
            >
              {content}
            </Link>
          )
        }

        return (
          <div
            key={step.id ?? i}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border/50 bg-card/50"
          >
            {content}
          </div>
        )
      })}
    </nav>
  )
}
