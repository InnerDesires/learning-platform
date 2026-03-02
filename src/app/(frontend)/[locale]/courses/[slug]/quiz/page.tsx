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
    redirect('/login')
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

  return (
    <div className="pt-14 pb-16">
      <div className="container max-w-3xl">
        <Link
          href={`/courses/${slug}`}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1.5 mb-6"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          {t.quizBackToCourse}
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            {course.quiz.title || t.quizTitle}
          </h1>
          {course.quiz.description && (
            <p className="mt-2 text-muted-foreground">{course.quiz.description}</p>
          )}
          <p className="mt-2 text-sm text-muted-foreground">
            {t.quizPassingScore}: {passingScore}%
          </p>
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
          }}
        />

        {attempts.length > 0 && (
          <div className="mt-10 pt-8 border-t">
            <QuizAttemptHistory
              attempts={attempts}
              labels={{
                quizAttemptHistory: t.quizAttemptHistory,
                quizAttemptNumber: t.quizAttemptNumber,
                quizScore: t.quizScore,
                quizPassed: t.quizPassed,
                quizFailed: t.quizFailed,
                quizNoAttempts: t.quizNoAttempts,
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
