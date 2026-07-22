'use client'

import React, { useState } from 'react'
import { updateHideProfileComments } from '@/actions/accountSettings'
import { getFrontendMessages } from '@/utilities/i18n'
import type { SiteLocale } from '@/utilities/locales'

export const PrivacyForm: React.FC<{ locale: SiteLocale; initialHideComments: boolean }> = ({
  locale,
  initialHideComments,
}) => {
  const t = getFrontendMessages(locale)
  const [hidden, setHidden] = useState(initialHideComments)
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  const handleToggle = async (next: boolean) => {
    setHidden(next)
    setStatus('saving')
    const result = await updateHideProfileComments(next)
    if (result.success) {
      setStatus('saved')
    } else {
      setHidden(!next)
      setStatus('error')
    }
  }

  return (
    <div className="rounded-2xl border border-line bg-card p-6">
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={hidden}
          disabled={status === 'saving'}
          onChange={(e) => handleToggle(e.target.checked)}
          className="mt-0.5 h-4 w-4 accent-orange"
        />
        <span>
          <span className="block text-sm font-medium">{t.settingsPrivacyHideComments}</span>
          <span className="mt-0.5 block text-xs text-steel">
            {t.settingsPrivacyHideCommentsHint}
          </span>
        </span>
      </label>
      <p className="mt-3 min-h-5 text-sm" aria-live="polite">
        {status === 'saving' && <span className="text-steel">{t.settingsSaving}</span>}
        {status === 'saved' && <span className="text-success">{t.settingsSaved}</span>}
        {status === 'error' && <span className="text-error">{t.settingsErrorGeneric}</span>}
      </p>
    </div>
  )
}
