'use client'
import { Button } from '@/components/ui/button'
import { CopyIcon } from '@payloadcms/ui/icons/Copy'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { getFrontendMessages, getLocaleFromPathname } from '@/utilities/i18n'

export function CopyButton({ code }: { code: string }) {
  const pathname = usePathname()
  const locale = getLocaleFromPathname(pathname)
  const t = getFrontendMessages(locale)
  const [text, setText] = useState(t.copy)

  function updateCopyStatus() {
    if (text === t.copy) {
      setText(() => t.copied)
      setTimeout(() => {
        setText(() => t.copy)
      }, 1000)
    }
  }

  return (
    <div className="flex justify-end align-middle">
      <Button
        className="flex gap-1"
        variant={'secondary'}
        onClick={async () => {
          await navigator.clipboard.writeText(code)
          updateCopyStatus()
        }}
      >
        <p>{text}</p>
        <CopyIcon />
      </Button>
    </div>
  )
}
