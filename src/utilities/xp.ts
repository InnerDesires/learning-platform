// XP is derived from progress data rather than stored: STEP_XP per completed step,
// QUIZ_XP for a passed final quiz.
export const STEP_XP = 30
export const QUIZ_XP = 100

export const courseXp = (stepsCount: number, hasQuiz: boolean): number =>
  stepsCount * STEP_XP + (hasQuiz ? QUIZ_XP : 0)

const levelSpan = (level: number): number => 300 + (level - 1) * 100

export const levelForXp = (xp: number): { level: number; intoLevel: number; span: number } => {
  let level = 1
  let rest = Math.max(0, xp)
  while (rest >= levelSpan(level)) {
    rest -= levelSpan(level)
    level += 1
  }
  return { level, intoLevel: rest, span: levelSpan(level) }
}

export const formatXp = (xp: number): string => `${xp.toLocaleString('uk-UA')} XP`
