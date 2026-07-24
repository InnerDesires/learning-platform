'use client'

import React, { useEffect, useRef } from 'react'
import Link from 'next/link'
import { Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Props = {
  open: boolean
  onClose: () => void
  loginHref: string
  labels: {
    title: string
    text: string
    login: string
    close: string
  }
}

/**
 * Modal shown to guests who tap a course step: explains that steps require an
 * account and links to /login with a redirect back to the course page.
 */
export function LoginPromptDialog({ open, onClose, loginHref, labels }: Props) {
  const loginLinkRef = useRef<HTMLAnchorElement>(null)

  useEffect(() => {
    if (!open) return
    loginLinkRef.current?.focus()
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-void/70 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-prompt-title"
        className="w-full max-w-md rounded-2xl border border-line bg-card p-6 shadow-[0_24px_64px_-16px_rgb(0_0_0/0.6)] sm:p-7"
      >
        <span className="grid h-11 w-11 place-items-center rounded-full border-2 border-orange/60 bg-orange/12 text-orange">
          <Lock className="h-5 w-5" />
        </span>
        <h2 id="login-prompt-title" className="heading-display mt-4 text-lg text-cloud">
          {labels.title}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-fog">{labels.text}</p>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onClose}>
            {labels.close}
          </Button>
          <Button asChild>
            <Link ref={loginLinkRef} href={loginHref}>
              {labels.login}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
