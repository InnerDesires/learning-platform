'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateAbout } from '@/actions/accountSettings'
import { getFrontendMessages } from '@/utilities/i18n'
import type { SiteLocale } from '@/utilities/locales'

const MAX_LENGTH = 500

export const AboutForm: React.FC<{ locale: SiteLocale; initialAbout: string }> = ({
  locale,
  initialAbout,
}) => {
  const t = getFrontendMessages(locale)
  const router = useRouter()
  const [about, setAbout] = useState(initialAbout)
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  const dirty = about.trim() !== initialAbout

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!dirty) return
    setStatus('saving')
    const result = await updateAbout(about)
    if (result.success) {
      setStatus('saved')
      router.refresh()
    } else {
      setStatus('error')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-line bg-card p-6">
      <div>
        <label htmlFor="settings-about" className="mb-1 block text-sm font-medium">
          {t.settingsAboutLabel}
        </label>
        <textarea
          id="settings-about"
          rows={4}
          maxLength={MAX_LENGTH}
          value={about}
          onChange={(e) => {
            setAbout(e.target.value)
            setStatus('idle')
          }}
          placeholder={t.settingsAboutPlaceholder}
          className="w-full resize-y rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        <p className="num mt-1 text-right text-xs text-steel">
          {about.length}/{MAX_LENGTH}
        </p>
      </div>

      {status === 'error' && (
        <p className="rounded-md bg-error/10 px-3 py-2 text-sm text-error">{t.settingsErrorGeneric}</p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={status === 'saving' || !dirty}
          className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
        >
          {status === 'saving' ? t.settingsSaving : t.settingsSave}
        </button>
        {status === 'saved' && <span className="text-sm text-success">{t.settingsSaved}</span>}
      </div>
    </form>
  )
}
