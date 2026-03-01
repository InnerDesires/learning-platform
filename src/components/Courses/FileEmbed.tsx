'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'

type Props = {
  url: string
  mimeType?: string | null
  filename?: string | null
  title?: string | null
  filesize?: number | null
  downloadLabel: string
  openLabel: string
}

function isPdf(mimeType?: string | null) {
  return mimeType?.includes('pdf')
}

function buildAbsoluteUrl(url: string): string {
  if (url.startsWith('http')) return url
  if (typeof window !== 'undefined') {
    return `${window.location.origin}${url}`
  }
  return url
}

function googleViewerUrl(fileUrl: string): string {
  const absolute = buildAbsoluteUrl(fileUrl)
  return `https://docs.google.com/gview?url=${encodeURIComponent(absolute)}&embedded=true`
}

export const FileEmbed: React.FC<Props> = ({
  url,
  mimeType,
  filename,
  title,
  filesize,
  downloadLabel,
  openLabel,
}) => {
  const [embedError, setEmbedError] = useState(false)
  const pdf = isPdf(mimeType)
  const embedUrl = pdf ? buildAbsoluteUrl(url) : googleViewerUrl(url)

  return (
    <div className="space-y-4">
      {!embedError ? (
        <div className="rounded-xl overflow-hidden border bg-muted/30">
          <iframe
            src={embedUrl}
            title={title || filename || 'Document'}
            className="w-full border-0"
            style={{ height: 'min(75vh, 700px)' }}
            onError={() => setEmbedError(true)}
          />
        </div>
      ) : (
        <div className="rounded-xl border bg-muted/30 flex items-center justify-center p-12 text-muted-foreground text-sm">
          Не вдалося завантажити попередній перегляд
        </div>
      )}

      {/* Download bar */}
      <div className="flex items-center gap-4 flex-wrap sm:flex-nowrap px-1">
        <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
          {pdf ? (
            <svg className="w-4 h-4 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-orange-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate text-sm">{title || filename}</p>
          <p className="text-xs text-muted-foreground">
            {pdf ? 'PDF' : 'Presentation'}
            {filesize ? ` · ${Math.round(filesize / 1024)} KB` : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <a href={url} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm">{openLabel}</Button>
          </a>
          <a href={url} download>
            <Button variant="secondary" size="sm">{downloadLabel}</Button>
          </a>
        </div>
      </div>
    </div>
  )
}
