import { getPayload } from 'payload'
import configPromise from '@payload-config'
import React from 'react'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import type { SiteLocale } from '@/utilities/locales'
import { getFrontendMessages } from '@/utilities/i18n'
import { getSession } from '@/lib/auth/getSession'
import { getEnrollment, getQuizAttempts } from '../../actions'
import { QuizForm } from '@/components/Courses/QuizForm'
import { QuizAttemptHistory } from '@/components/Courses/QuizAttemptHistory'
import type { Course } from '@/payload-types'
import { ArrowLeft, Zap } from 'lucide-react'
import { QUIZ_XP } from '@/utilities/xp'

type Args = {
  params: Promise<{ locale: SiteLocale; slug: string }>
}

export default async function QuizPage({ params: paramsPromise }: Args) {
  const { locale, slug } = await paramsPromise
  const t = getFrontendMessages(locale)

  const payload = await getPayload({ config: configPromise })

  const [session, result] = await Promise.all([
    getSession(),
    payload.find({
      collection: 'courses',
      locale,
      depth: 0,
      where: {
        slug: { equals: slug },
        _status: { equals: 'published' },
      },
      limit: 1,
    }),
  ])

  if (!session?.user) {
    const prefix = locale === 'en' ? '/en' : ''
    redirect(`${prefix}/login?redirect=${encodeURIComponent(`${prefix}/courses/${slug}/quiz`)}`)
  }

  const course = result.docs[0] as Course | undefined
  if (!course) notFound()

  if (!course.quiz?.enabled) {
    redirect(`/courses/${slug}`)
  }

  const enrollment = await getEnrollment(course.id)
  if (!enrollment) {
    redirect(`/courses/${slug}`)
  }

  const completedSteps: string[] = Array.isArray(enrollment.completedSteps)
    ? (enrollment.completedSteps as string[])
    : []
  const totalSteps = course.steps?.length ?? 0
  const allStepsComplete = completedSteps.length >= totalSteps

  if (!allStepsComplete) {
    redirect(`/courses/${slug}`)
  }

  const attempts = await getQuizAttempts(course.id)
  const questions = course.quiz.questions ?? []
  const passingScore = course.quiz.passingScore ?? 70

  const prefix = locale === 'en' ? '/en' : ''
  return (
    <div className="pt-10 pb-16">
      <div className="container max-w-3xl">
        <Link
          href={`${prefix}/courses/${slug}`}
          className="mb-6 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.08em] text-fog transition-colors hover:text-orange"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {t.quizBackToCourse}
        </Link>

        <div className="mb-8">
          <h1 className="heading-display text-[clamp(32px,4vw,46px)] font-bold">
            {course.quiz.title || t.quizTitle}
          </h1>
          {course.quiz.description && (
            <p className="mt-2.5 text-fog">{course.quiz.description}</p>
          )}
          <div className="mt-4.5 flex flex-wrap gap-2.5">
            <span className="num inline-flex items-center gap-1.5 rounded-full border border-line-2 px-3.5 py-1.5 text-[11.5px] font-bold uppercase tracking-[0.08em] text-fog">
              {t.quizPassingScore} <b className="text-amber">{passingScore}%</b>
            </span>
            <span className="num inline-flex items-center gap-1.5 rounded-full border border-line-2 px-3.5 py-1.5 text-[11.5px] font-bold uppercase tracking-[0.08em] text-fog">
              {t.quizQuestion} <b className="text-amber">{questions.length}</b>
            </span>
            {attempts.length > 0 ? (
              <span className="num inline-flex items-center gap-1.5 rounded-full border border-line-2 px-3.5 py-1.5 text-[11.5px] font-bold uppercase tracking-[0.08em] text-fog">
                {t.quizAttemptsUsed} <b className="text-amber">{attempts.length}</b>
              </span>
            ) : (
              <span className="num inline-flex items-center gap-1.5 rounded-full border border-line-2 px-3.5 py-1.5 text-[11.5px] font-bold uppercase tracking-[0.08em] text-fog">
                {t.quizAttemptNumber} <b className="text-amber">№1</b>
              </span>
            )}
            <span className="num inline-flex items-center gap-1.5 rounded-full border border-orange/34 bg-orange/12 px-3.5 py-1.5 text-[11.5px] font-bold uppercase tracking-[0.08em] text-amber">
              <Zap className="h-3 w-3" fill="currentColor" strokeWidth={0} />
              {t.courseRewardLabel} <b>+{QUIZ_XP} XP</b>
            </span>
          </div>
        </div>

        <QuizForm
          courseId={course.id}
          courseSlug={course.slug}
          questions={questions.map((q) => ({
            id: q.id,
            question: q.question,
            answers: (q.answers ?? []).map((a) => ({
              id: a.id,
              text: a.text,
              isCorrect: a.isCorrect,
            })),
          }))}
          labels={{
            quizSubmit: t.quizSubmit,
            quizTryAgain: t.quizTryAgain,
            quizBackToCourse: t.quizBackToCourse,
            quizPassed: t.quizPassed,
            quizFailed: t.quizFailed,
            quizScore: t.quizScore,
            quizCorrectAnswers: t.quizCorrectAnswers,
            quizOf: t.quizOf,
            quizAttemptNumber: t.quizAttemptNumber,
            quizQuestion: t.quizQuestion,
            quizSelectAnswer: t.quizSelectAnswer,
            quizAttemptWarning: t.quizAttemptWarning,
            certificateDownload: t.certificateDownload,
          }}
        />

        {attempts.length > 0 && (
          <div className="mt-10 border-t border-line pt-8">
            <QuizAttemptHistory
              attempts={attempts}
              locale={locale}
              certificateHref={`/courses/${slug}/certificate`}
              labels={{
                quizAttemptHistory: t.quizAttemptHistory,
                quizAttemptNumber: t.quizAttemptNumber,
                quizScore: t.quizScore,
                quizPassed: t.quizPassed,
                quizFailed: t.quizFailed,
                quizNoAttempts: t.quizNoAttempts,
                certificateDownload: t.certificateDownload,
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
