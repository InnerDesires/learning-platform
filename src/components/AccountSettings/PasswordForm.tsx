'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth/client'
import { setInitialPassword } from '@/actions/accountSettings'
import { PasswordInput } from '@/components/Auth/PasswordInput'
import { getFrontendMessages } from '@/utilities/i18n'
import type { SiteLocale } from '@/utilities/locales'

export const PasswordForm: React.FC<{
  locale: SiteLocale
  hasCredential: boolean
}> = ({ locale, hasCredential }) => {
  const t = getFrontendMessages(locale)
  const router = useRouter()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (newPassword !== confirmPassword) {
      setError(t.settingsPasswordMismatch)
      return
    }

    setStatus('saving')

    if (hasCredential) {
      const { error: changeError } = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      })
      if (changeError) {
        setStatus('idle')
        setError(
          changeError.code === 'INVALID_PASSWORD'
            ? t.settingsPasswordWrongCurrent
            : t.settingsErrorGeneric,
        )
        return
      }
    } else {
      const result = await setInitialPassword(newPassword)
      if (!result.success) {
        setStatus('idle')
        setError(t.settingsErrorGeneric)
        return
      }
    }

    setStatus('saved')
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-line bg-card p-6">
      {!hasCredential && <p className="text-sm text-fog">{t.settingsPasswordSetHint}</p>}

      {hasCredential && (
        <div>
          <label htmlFor="settings-current-password" className="mb-1 block text-sm font-medium">
            {t.settingsPasswordCurrent}
          </label>
          <PasswordInput
            id="settings-current-password"
            required
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            showLabel={t.passwordShow}
            hideLabel={t.passwordHide}
          />
        </div>
      )}

      <div>
        <label htmlFor="settings-new-password" className="mb-1 block text-sm font-medium">
          {t.settingsPasswordNew}
        </label>
        <PasswordInput
          id="settings-new-password"
          required
          minLength={8}
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          showLabel={t.passwordShow}
          hideLabel={t.passwordHide}
        />
        <p className="mt-1 text-xs text-steel">{t.registerPasswordHint}</p>
      </div>

      <div>
        <label htmlFor="settings-confirm-password" className="mb-1 block text-sm font-medium">
          {t.settingsPasswordConfirm}
        </label>
        <PasswordInput
          id="settings-confirm-password"
          required
          minLength={8}
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          showLabel={t.passwordShow}
          hideLabel={t.passwordHide}
        />
      </div>

      {error && <p className="rounded-md bg-error/10 px-3 py-2 text-sm text-error">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={status === 'saving'}
          className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
        >
          {status === 'saving'
            ? t.settingsSaving
            : hasCredential
              ? t.settingsPasswordChange
              : t.settingsPasswordSet}
        </button>
        {status === 'saved' && (
          <span className="text-sm text-success">{t.settingsPasswordChanged}</span>
        )}
      </div>
    </form>
  )
}
