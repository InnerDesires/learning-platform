'use client'

import React, { useRef, useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'

interface CommentFormProps {
  onSubmit: (body: string) => Promise<boolean>
  placeholder: string
  submitLabel: string
  submittingLabel: string
  replyingTo?: string | null
  onCancelReply?: () => void
  replyingLabel?: string
  autoFocus?: boolean
}

export function CommentForm({
  onSubmit,
  placeholder,
  submitLabel,
  submittingLabel,
  replyingTo,
  onCancelReply,
  replyingLabel,
  autoFocus = false,
}: CommentFormProps) {
  const [body, setBody] = useState('')
  const [isPending, startTransition] = useTransition()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = body.trim()
    if (!trimmed) return

    startTransition(async () => {
      const success = await onSubmit(trimmed)
      if (success) {
        setBody('')
        textareaRef.current?.blur()
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {replyingTo && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>
            {replyingLabel} <strong className="text-foreground">{replyingTo}</strong>
          </span>
          <button
            type="button"
            onClick={onCancelReply}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            &times;
          </button>
        </div>
      )}
      <textarea
        ref={textareaRef}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={placeholder}
        maxLength={2000}
        rows={3}
        autoFocus={autoFocus}
        className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 resize-none transition-all"
      />
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={isPending || !body.trim()}>
          {isPending ? submittingLabel : submitLabel}
        </Button>
      </div>
    </form>
  )
}
