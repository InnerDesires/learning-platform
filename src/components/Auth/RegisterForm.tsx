'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth/client'
import type { SiteLocale } from '@/utilities/locales'

const labels = {
  uk: {
    title: 'Реєстрація',
    name: "Ім'я",
    email: 'Електронна пошта',
    password: 'Пароль',
    submit: 'Зареєструватися',
    submitting: 'Реєструємо…',
    or: 'або',
    google: 'Зареєструватися через Google',
    hasAccount: 'Вже є акаунт?',
    login: 'Увійти',
    errorGeneric: 'Не вдалося зареєструватися. Спробуйте ще раз.',
    errorEmailTaken: 'Ця електронна пошта вже зайнята.',
    passwordHint: 'Мінімум 8 символів',
  },
  en: {
    title: 'Register',
    name: 'Name',
    email: 'Email',
    password: 'Password',
    submit: 'Register',
    submitting: 'Registering…',
    or: 'or',
    google: 'Sign up with Google',
    hasAccount: 'Already have an account?',
    login: 'Log in',
    errorGeneric: 'Could not register. Please try again.',
    errorEmailTaken: 'This email is already taken.',
    passwordHint: 'Minimum 8 characters',
  },
} as const

export const RegisterForm: React.FC<{
  locale: SiteLocale
  redirectTo?: string
  googleEnabled?: boolean
}> = ({ locale, redirectTo, googleEnabled = true }) => {
  const t = labels[locale]
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const callbackURL = redirectTo || '/'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error: signUpError } = await authClient.signUp.email({
      name,
      email,
      password,
      callbackURL,
    })

    if (signUpError) {
      if (signUpError.status === 422) {
        setError(t.errorEmailTaken)
      } else {
        setError(t.errorGeneric)
      }
      setLoading(false)
    } else {
      router.push(callbackURL)
      router.refresh()
    }
  }

  const handleGoogleSignUp = async () => {
    await authClient.signIn.social({
      provider: 'google',
      callbackURL,
    })
  }

  const loginHref = redirectTo
    ? `/${locale === 'uk' ? '' : locale + '/'}login?redirect=${encodeURIComponent(redirectTo)}`
    : `/${locale === 'uk' ? '' : locale + '/'}login`

  return (
    <div className="mx-auto w-full max-w-md">
      <h1 className="mb-2 text-center text-3xl font-bold tracking-tight">{t.title}</h1>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div>
          <label htmlFor="name" className="mb-1 block text-sm font-medium">
            {t.name}
          </label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium">
            {t.email}
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium">
            {t.password}
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <p className="mt-1 text-xs text-muted-foreground">{t.passwordHint}</p>
        </div>

        {error && (
          <p className="rounded-md bg-error/10 px-3 py-2 text-sm text-error">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
        >
          {loading ? t.submitting : t.submit}
        </button>
      </form>

      {googleEnabled && (
        <>
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-sm text-muted-foreground">{t.or}</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <button
            type="button"
            onClick={handleGoogleSignUp}
            className="flex w-full items-center justify-center gap-3 rounded-lg border border-input bg-background px-4 py-2.5 text-sm font-medium transition hover:bg-secondary"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            {t.google}
          </button>
        </>
      )}

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {t.hasAccount}{' '}
        <Link href={loginHref} className="font-medium text-primary hover:underline">
          {t.login}
        </Link>
      </p>
    </div>
  )
}
