'use client'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import React, { useState, useEffect } from 'react'
import { useDebounce } from '@/utilities/useDebounce'
import { usePathname, useRouter } from 'next/navigation'
import { getFrontendMessages, getLocaleFromPathname } from '@/utilities/i18n'

export const Search: React.FC = () => {
  const [value, setValue] = useState('')
  const router = useRouter()
  const pathname = usePathname()
  const locale = getLocaleFromPathname(pathname)
  const t = getFrontendMessages(locale)

  const debouncedValue = useDebounce(value)

  useEffect(() => {
    const searchPath = pathname.split('?')[0]
    router.push(`${searchPath}${debouncedValue ? `?q=${debouncedValue}` : ''}`)
  }, [debouncedValue, router, pathname])

  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault()
        }}
      >
        <Label htmlFor="search" className="sr-only">
          {t.searchLabel}
        </Label>
        <Input
          id="search"
          onChange={(event) => {
            setValue(event.target.value)
          }}
          placeholder={t.searchPlaceholder}
          className="rounded-full h-12 px-6 text-base bg-card shadow-sm border-border/50 focus:border-primary focus:ring-primary/20"
        />
        <button type="submit" className="sr-only">
          {t.searchSubmit}
        </button>
      </form>
    </div>
  )
}
