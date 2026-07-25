'use client'

import React, { useRef, useState } from 'react'
import { Camera, Trash2 } from 'lucide-react'
import { authClient } from '@/lib/auth/client'
import { updateAvatar, removeAvatar } from '@/actions/accountSettings'
import { getFrontendMessages } from '@/utilities/i18n'
import { clearMyXpCache } from '@/utilities/myXpCache'
import type { SiteLocale } from '@/utilities/locales'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_BYTES = 5 * 1024 * 1024

/** Only `square` (500x500) is ever shown, so anything past this is wasted bytes. */
const MAX_DIMENSION = 1024
/** Stay well under the server action body limit (next.config.js) after multipart overhead. */
const DOWNSCALE_ABOVE_BYTES = 768 * 1024
/** Phone cameras hand over types the picker's `accept` list never asked for. */
const EXTENSION_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  heic: 'image/heic',
  heif: 'image/heif',
}

/** Some Android pickers report an empty `type`; fall back to the extension. */
const fileType = (file: File): string =>
  file.type || EXTENSION_TYPES[file.name.split('.').pop()?.toLowerCase() ?? ''] || ''

/**
 * Re-encodes the picked image to a modest JPEG before it ever reaches the
 * server action. A phone photo is routinely 2–5 MB, which blows past the
 * server action body limit and fails as an opaque rejection — this keeps the
 * upload at a couple hundred KB and normalises the type on the way.
 *
 * Returns the untouched file when re-encoding is not worth it or not possible;
 * the caller still validates size, so a passthrough is always safe.
 */
async function shrinkForUpload(file: File): Promise<File> {
  const type = fileType(file)

  // Animated GIFs would be flattened to their first frame, and a small
  // well-formed image has nothing to gain.
  const isPlainRaster = type === 'image/jpeg' || type === 'image/png' || type === 'image/webp'
  if (type === 'image/gif' || (isPlainRaster && file.size <= DOWNSCALE_ABOVE_BYTES)) return file

  // `from-image` bakes in EXIF rotation, so portrait phone photos stay upright.
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  try {
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)

    const ctx = canvas.getContext('2d')
    if (!ctx) return file
    // JPEG has no alpha channel, so transparency would otherwise come out black.
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', 0.9),
    )
    if (!blob || blob.size >= file.size) return file

    const name = file.name.replace(/\.[^.]+$/, '') || 'avatar'
    return new File([blob], `${name}.jpg`, { type: 'image/jpeg' })
  } finally {
    bitmap.close()
  }
}

/** The server action updates the user in the DB, but two caches still hold the
 *  old snapshot: the session cookie cache (5 min) and the header's myXp cache,
 *  whose payload carries `image`. Clear both so the header avatar changes with
 *  the rest of the page instead of lagging behind it by up to 5 minutes. */
const refreshAndReload = async () => {
  clearMyXpCache()
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

    const type = fileType(file)
    // HEIC/HEIF are not accepted by the server, but iOS can decode them into a
    // canvas — shrinkForUpload turns those into JPEG below.
    if (!ALLOWED_TYPES.includes(type) && type !== 'image/heic' && type !== 'image/heif') {
      setError(t.settingsAvatarErrorType)
      return
    }
    if (file.size > MAX_BYTES) {
      setError(t.settingsAvatarErrorSize)
      return
    }

    setError(null)
    setBusy(true)
    try {
      let prepared = file
      try {
        prepared = await shrinkForUpload(file)
      } catch {
        // Decoding failed (HEIC on a browser that cannot read it, corrupt file).
        // Sending the original would only fail server-side with a vaguer error.
        if (!ALLOWED_TYPES.includes(type)) {
          setError(t.settingsAvatarErrorType)
          setBusy(false)
          return
        }
      }

      const formData = new FormData()
      formData.append('file', prepared)
      const result = await updateAvatar(formData)

      if (result.success) {
        await refreshAndReload()
        return
      }
      setError(
        result.error === 'INVALID_TYPE'
          ? t.settingsAvatarErrorType
          : result.error === 'TOO_LARGE'
            ? t.settingsAvatarErrorSize
            : t.settingsErrorGeneric,
      )
    } catch {
      // A rejected server action (body too large, network drop, cold start
      // timeout) used to leave the button stuck on "saving" with no message.
      setError(t.settingsErrorGeneric)
    }
    setBusy(false)
  }

  const handleRemove = async () => {
    setError(null)
    setBusy(true)
    try {
      const result = await removeAvatar()
      if (result.success) {
        await refreshAndReload()
        return
      }
      setError(t.settingsErrorGeneric)
    } catch {
      setError(t.settingsErrorGeneric)
    }
    setBusy(false)
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
