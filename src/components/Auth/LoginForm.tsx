'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth/client'
import { getFrontendMessages } from '@/utilities/i18n'
import type { SiteLocale } from '@/utilities/locales'

export const LoginForm: React.FC<{
  locale: SiteLocale
  redirectTo?: string
  googleEnabled?: boolean
}> = ({ locale, redirectTo, googleEnabled = true }) => {
  const t = getFrontendMessages(locale)
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const callbackURL = redirectTo || '/'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error: signInError } = await authClient.signIn.email({
      email,
      password,
      callbackURL,
    })

    if (signInError) {
      setError(t.loginErrorGeneric)
      setLoading(false)
    } else {
      router.push(callbackURL)
      router.refresh()
    }
  }

  const handleGoogleSignIn = async () => {
    await authClient.signIn.social({
      provider: 'google',
      callbackURL,
    })
  }

  const registerHref = redirectTo
    ? `/${locale === 'uk' ? '' : locale + '/'}register?redirect=${encodeURIComponent(redirectTo)}`
    : `/${locale === 'uk' ? '' : locale + '/'}register`

  return (
    <div className="mx-auto w-full max-w-md">
      <h1 className="mb-2 text-center text-3xl font-bold tracking-tight">
        {redirectTo ? t.loginContinueTo : t.loginTitle}
      </h1>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium">
            {t.loginEmail}
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
            {t.loginPassword}
          </label>
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {error && (
          <p className="rounded-md bg-error/10 px-3 py-2 text-sm text-error">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
        >
          {loading ? t.loginSubmitting : t.loginSubmit}
        </button>
      </form>

      {googleEnabled && (
        <>
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-sm text-muted-foreground">{t.loginOr}</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
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
            {t.loginGoogle}
          </button>
        </>
      )}

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {t.loginNoAccount}{' '}
        <Link href={registerHref} className="font-medium text-primary hover:underline">
          {t.loginRegister}
        </Link>
      </p>
    </div>
  )
}
