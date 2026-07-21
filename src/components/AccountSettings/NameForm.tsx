'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth/client'
import { getFrontendMessages } from '@/utilities/i18n'
import type { SiteLocale } from '@/utilities/locales'

export const NameForm: React.FC<{ locale: SiteLocale; initialName: string }> = ({
  locale,
  initialName,
}) => {
  const t = getFrontendMessages(locale)
  const router = useRouter()
  const [name, setName] = useState(initialName)
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  const trimmed = name.trim()
  const dirty = trimmed !== initialName

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!trimmed || !dirty) return
    setStatus('saving')
    const { error } = await authClient.updateUser({ name: trimmed })
    if (error) {
      setStatus('error')
    } else {
      setStatus('saved')
      router.refresh()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-line bg-card p-6">
      <div>
        <label htmlFor="settings-name" className="mb-1 block text-sm font-medium">
          {t.settingsNameLabel}
        </label>
        <input
          id="settings-name"
          type="text"
          required
          maxLength={100}
          autoComplete="name"
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            setStatus('idle')
          }}
          className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {status === 'error' && (
        <p className="rounded-md bg-error/10 px-3 py-2 text-sm text-error">{t.settingsErrorGeneric}</p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={status === 'saving' || !trimmed || !dirty}
          className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
        >
          {status === 'saving' ? t.settingsSaving : t.settingsSave}
        </button>
        {status === 'saved' && <span className="text-sm text-success">{t.settingsSaved}</span>}
      </div>
    </form>
  )
}
