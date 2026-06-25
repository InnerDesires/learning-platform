'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth/client'
import { getFrontendMessages } from '@/utilities/i18n'
import type { SiteLocale } from '@/utilities/locales'
import { OTPInput } from '@/components/Auth/OTPInput'

type Step = 'email' | 'reset'

export const ForgotPasswordForm: React.FC<{
  locale: SiteLocale
}> = ({ locale }) => {
  const t = getFrontendMessages(locale)
  const router = useRouter()
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)

  const loginHref = `/${locale === 'uk' ? '' : locale + '/'}login`

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [resendCooldown])

  const sendOtp = async (): Promise<boolean> => {
    const { error: sendError } = await authClient.forgetPassword.emailOtp({ email })
    if (sendError) {
      setError(t.otpSendError)
      return false
    }
    return true
  }

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    // Always advance to the reset step regardless of whether the email exists,
    // to avoid leaking which addresses are registered.
    const ok = await sendOtp()
    setLoading(false)
    if (ok) {
      setStep('reset')
      setResendCooldown(60)
    }
  }

  const handleResend = async () => {
    if (resendCooldown > 0) return
    setError(null)
    const ok = await sendOtp()
    if (ok) {
      setOtp('')
      setResendCooldown(60)
    }
  }

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (otp.length < 6 || password.length < 8) return
    setError(null)
    setLoading(true)

    const { error: resetError } = await authClient.emailOtp.resetPassword({
      email,
      otp,
      password,
    })

    if (resetError) {
      setError(t.forgotErrorGeneric)
      setLoading(false)
      return
    }

    router.push(`${loginHref}?reset=success`)
    router.refresh()
  }

  // Step 2: OTP + new password
  if (step === 'reset') {
    return (
      <div className="mx-auto w-full max-w-md">
        <h1 className="mb-2 text-center text-3xl font-bold tracking-tight">{t.forgotOtpTitle}</h1>
        <p className="mb-6 text-center text-sm text-muted-foreground">
          {t.forgotOtpDescription} <span className="font-medium text-foreground">{email}</span>
        </p>

        <form onSubmit={handleResetSubmit} className="space-y-6">
          <OTPInput value={otp} onChange={setOtp} disabled={loading} />

          <div>
            <label htmlFor="new-password" className="mb-1 block text-sm font-medium">
              {t.forgotNewPassword}
            </label>
            <input
              id="new-password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            <p className="mt-1 text-xs text-muted-foreground">{t.forgotNewPasswordHint}</p>
          </div>

          {error && (
            <p className="rounded-md bg-error/10 px-3 py-2 text-center text-sm text-error">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || otp.length < 6 || password.length < 8}
            className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
          >
            {loading ? t.forgotResetting : t.forgotReset}
          </button>
        </form>

        <div className="mt-4 flex items-center justify-between text-sm">
          <button
            type="button"
            onClick={() => {
              setStep('email')
              setOtp('')
              setPassword('')
              setError(null)
            }}
            className="text-primary hover:underline"
          >
            {t.otpChangeEmail}
          </button>

          <button
            type="button"
            onClick={handleResend}
            disabled={resendCooldown > 0}
            className="text-primary hover:underline disabled:text-muted-foreground disabled:no-underline"
          >
            {resendCooldown > 0 ? `${t.otpResendIn} ${resendCooldown}${t.otpSeconds}` : t.otpResend}
          </button>
        </div>
      </div>
    )
  }

  // Step 1: Email entry
  return (
    <div className="mx-auto w-full max-w-md">
      <h1 className="mb-2 text-center text-3xl font-bold tracking-tight">{t.forgotTitle}</h1>
      <p className="mb-6 text-center text-sm text-muted-foreground">{t.forgotDescription}</p>

      <form onSubmit={handleEmailSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium">
            {t.forgotEmail}
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

        {error && <p className="rounded-md bg-error/10 px-3 py-2 text-sm text-error">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
        >
          {loading ? t.forgotSubmitting : t.forgotSubmit}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        <Link href={loginHref} className="font-medium text-primary hover:underline">
          {t.forgotBackToLogin}
        </Link>
      </p>
    </div>
  )
}
