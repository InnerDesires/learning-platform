import React from 'react'
import { Zap } from 'lucide-react'
import { cn } from '@/utilities/ui'

/** Railway-track motif shown under section headings. */
export const Rails: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('rails', className)} aria-hidden="true">
    <i />
  </div>
)

/** Orange overline label above a section heading. */
export const Eyebrow: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => <span className={cn('eyebrow', className)}>{children}</span>

/** Scoreboard XP chip: ⚡ +NNN XP */
export const XpChip: React.FC<{ xp: number; className?: string }> = ({ xp, className }) => (
  <span className={cn('xp-chip num', className)}>
    <Zap fill="currentColor" strokeWidth={0} aria-hidden="true" />+{xp} XP
  </span>
)

/** Reward pill shown on course/quiz heroes: ⚡ label · +NNN XP */
export const RewardPill: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => (
  <span className={cn('reward-pill num', className)}>
    <Zap fill="currentColor" strokeWidth={0} aria-hidden="true" />
    {children}
  </span>
)

/**
 * Standard section header: eyebrow + Oswald heading + rails, with an
 * optional action slot on the right.
 */
export const SectionHead: React.FC<{
  eyebrow?: React.ReactNode
  title: React.ReactNode
  action?: React.ReactNode
  center?: boolean
  className?: string
  headingClassName?: string
}> = ({ eyebrow, title, action, center, className, headingClassName }) => (
  <div
    className={cn(
      'mb-9 flex flex-wrap items-end justify-between gap-6',
      center && 'flex-col items-center text-center',
      className,
    )}
  >
    <div className={cn(center && 'flex flex-col items-center')}>
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <h2
        className={cn(
          'heading-display mt-2.5 text-[clamp(26px,3.4vw,38px)]',
          headingClassName,
        )}
      >
        {title}
      </h2>
      <Rails className="mt-4" />
    </div>
    {action}
  </div>
)
