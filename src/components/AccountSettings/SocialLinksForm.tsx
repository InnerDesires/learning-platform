'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, Plus, X } from 'lucide-react'
import { updateSocialLinks } from '@/actions/accountSettings'
import { getFrontendMessages } from '@/utilities/i18n'
import type { SiteLocale } from '@/utilities/locales'

export type SocialLinkRow = { platform: string; url: string }

const MAX_LINKS = 8

const platformLabels = (locale: SiteLocale): { value: string; label: string }[] => [
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'telegram', label: 'Telegram' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'x', label: 'X (Twitter)' },
  { value: 'website', label: locale === 'uk' ? 'Вебсайт' : 'Website' },
]

export const SocialLinksForm: React.FC<{
  locale: SiteLocale
  initialLinks: SocialLinkRow[]
}> = ({ locale, initialLinks }) => {
  const t = getFrontendMessages(locale)
  const router = useRouter()
  const platforms = platformLabels(locale)
  const [rows, setRows] = useState<SocialLinkRow[]>(initialLinks)
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [error, setError] = useState<string | null>(null)

  const updateRow = (index: number, patch: Partial<SocialLinkRow>) => {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)))
    setStatus('idle')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const cleaned = rows
      .map((row) => ({ platform: row.platform, url: row.url.trim() }))
      .filter((row) => row.url !== '')

    for (const row of cleaned) {
      let valid = false
      try {
        const parsed = new URL(row.url)
        valid = parsed.protocol === 'https:' || parsed.protocol === 'http:'
      } catch {
        valid = false
      }
      if (!valid) {
        setError(t.settingsSocialErrorUrl)
        return
      }
    }

    setStatus('saving')
    const result = await updateSocialLinks(cleaned)
    if (result.success) {
      setRows(cleaned)
      setStatus('saved')
      router.refresh()
    } else {
      setStatus('idle')
      setError(result.error === 'INVALID_URL' ? t.settingsSocialErrorUrl : t.settingsErrorGeneric)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-line bg-card p-6">
      <p className="text-sm text-fog">{t.settingsSocialHint}</p>

      {rows.length > 0 && (
        <div className="space-y-2.5">
          {rows.map((row, index) => (
            <div key={index} className="flex items-center gap-2.5">
              <div className="relative w-36 flex-none">
                <select
                  value={row.platform}
                  onChange={(e) => updateRow(index, { platform: e.target.value })}
                  aria-label={t.settingsSocialSection}
                  className="w-full appearance-none rounded-lg border border-input bg-background px-3 py-2.5 pr-8 text-sm outline-none focus:ring-2 focus:ring-ring"
                >
                  {platforms.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-steel" />
              </div>
              <input
                type="url"
                value={row.url}
                onChange={(e) => updateRow(index, { url: e.target.value })}
                placeholder="https://…"
                maxLength={300}
                className="w-full min-w-0 rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                type="button"
                onClick={() => {
                  setRows((prev) => prev.filter((_, i) => i !== index))
                  setStatus('idle')
                }}
                aria-label={t.settingsSocialRemove}
                className="grid h-9 w-9 flex-none place-items-center rounded-lg border border-input text-steel transition-colors hover:border-error hover:text-error"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {rows.length < MAX_LINKS && (
        <button
          type="button"
          onClick={() => {
            setRows((prev) => [...prev, { platform: 'instagram', url: '' }])
            setStatus('idle')
          }}
          className="inline-flex items-center gap-2 rounded-lg border border-input px-4 py-2 text-sm font-medium text-fog transition hover:border-orange hover:text-orange"
        >
          <Plus className="h-4 w-4" />
          {t.settingsSocialAdd}
        </button>
      )}

      {error && <p className="rounded-md bg-error/10 px-3 py-2 text-sm text-error">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={status === 'saving'}
          className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
        >
          {status === 'saving' ? t.settingsSaving : t.settingsSave}
        </button>
        {status === 'saved' && <span className="text-sm text-success">{t.settingsSaved}</span>}
      </div>
    </form>
  )
}
