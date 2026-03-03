'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

type Props = {
  placeholder: string
  submitLabel: string
}

export function VerifyForm({ placeholder, submitLabel }: Props) {
  const [value, setValue] = useState('')
  const router = useRouter()

  function extractToken(input: string): string {
    const trimmed = input.trim()
    const verifyIndex = trimmed.indexOf('/verify/')
    if (verifyIndex !== -1) {
      return trimmed.slice(verifyIndex + '/verify/'.length).split(/[?#\s]/)[0]
    }
    return trimmed
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const token = extractToken(value)
    if (!token) return
    router.push(`/verify/${token}`)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="flex-1 rounded-md border border-input bg-background px-4 py-2.5 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      <Button type="submit" disabled={!value.trim()}>
        {submitLabel}
      </Button>
    </form>
  )
}
