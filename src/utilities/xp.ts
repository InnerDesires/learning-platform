/**
 * XP («досвід») conventions for the Iron Energy design.
 *
 * XP is derived from real progress data rather than stored:
 *  - every completed course step is worth STEP_XP
 *  - a passed final quiz is worth QUIZ_XP
 *  - a course's total reward = steps × STEP_XP (+ QUIZ_XP when it has a quiz)
 */
export const STEP_XP = 30
export const QUIZ_XP = 100

/** Total XP a course awards. */
export const courseXp = (stepsCount: number, hasQuiz: boolean): number =>
  stepsCount * STEP_XP + (hasQuiz ? QUIZ_XP : 0)

/** XP needed to go from `level` to `level + 1`. */
const levelSpan = (level: number): number => 300 + (level - 1) * 100

/** Level for a given XP total: 1 → 2 needs 300 XP, each next level +100 XP more. */
export const levelForXp = (xp: number): { level: number; intoLevel: number; span: number } => {
  let level = 1
  let rest = Math.max(0, xp)
  while (rest >= levelSpan(level)) {
    rest -= levelSpan(level)
    level += 1
  }
  return { level, intoLevel: rest, span: levelSpan(level) }
}

/** Format like «1 240 XP» (thin non-breaking spaces per uk convention). */
export const formatXp = (xp: number): string => `${xp.toLocaleString('uk-UA')} XP`
