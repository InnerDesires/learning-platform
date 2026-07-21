'use client'

import React, { useRef, useState } from 'react'
import { Camera, Trash2 } from 'lucide-react'
import { authClient } from '@/lib/auth/client'
import { updateAvatar, removeAvatar } from '@/actions/accountSettings'
import { getFrontendMessages } from '@/utilities/i18n'
import type { SiteLocale } from '@/utilities/locales'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_BYTES = 5 * 1024 * 1024

/** The server action updates the user in the DB, but the session cookie cache
 *  (5 min) still holds the old snapshot. Force a fresh session read so the
 *  header and server components render the new image after reload. */
const refreshAndReload = async () => {
  await authClient.getSession({ query: { disableCookieCache: true } })
  window.location.reload()
}

export const AvatarForm: React.FC<{
  locale: SiteLocale
  image?: string | null
  initials: string
}> = ({ locale, image, initials }) => {
  const t = getFrontendMessages(locale)
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError(t.settingsAvatarErrorType)
      return
    }
    if (file.size > MAX_BYTES) {
      setError(t.settingsAvatarErrorSize)
      return
    }
    setError(null)
    setBusy(true)
    const formData = new FormData()
    formData.append('file', file)
    const result = await updateAvatar(formData)
    if (result.success) {
      await refreshAndReload()
    } else {
      setError(
        result.error === 'INVALID_TYPE'
          ? t.settingsAvatarErrorType
          : result.error === 'TOO_LARGE'
            ? t.settingsAvatarErrorSize
            : t.settingsErrorGeneric,
      )
      setBusy(false)
    }
  }

  const handleRemove = async () => {
    setError(null)
    setBusy(true)
    const result = await removeAvatar()
    if (result.success) {
      await refreshAndReload()
    } else {
      setError(t.settingsErrorGeneric)
      setBusy(false)
    }
  }

  return (
    <div className="rounded-2xl border border-line bg-card p-6">
      <div className="flex flex-wrap items-center gap-5">
        {image ? (
          <img
            src={image}
            alt=""
            className="h-20 w-20 flex-none rounded-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className="flex h-20 w-20 flex-none items-center justify-center rounded-full bg-navy-2 font-display text-2xl font-bold text-amber">
            {initials}
          </span>
        )}

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
            >
              <Camera className="h-4 w-4" />
              {busy ? t.settingsSaving : t.settingsAvatarChange}
            </button>
            {image && (
              <button
                type="button"
                disabled={busy}
                onClick={handleRemove}
                className="inline-flex items-center gap-2 rounded-lg border border-input px-4 py-2 text-sm font-medium text-fog transition hover:border-error hover:text-error disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                {t.settingsAvatarRemove}
              </button>
            )}
          </div>
          <p className="mt-2 text-xs text-steel">{t.settingsAvatarHint}</p>
        </div>
      </div>

      {error && (
        <p className="mt-4 rounded-md bg-error/10 px-3 py-2 text-sm text-error">{error}</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_TYPES.join(',')}
        onChange={handleFile}
        className="hidden"
      />
    </div>
  )
}
