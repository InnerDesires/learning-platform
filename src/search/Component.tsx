'use client'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import React, { useState, useEffect } from 'react'
import { useDebounce } from '@/utilities/useDebounce'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { getFrontendMessages, getLocaleFromPathname } from '@/utilities/i18n'

export const Search: React.FC = () => {
  const searchParams = useSearchParams()
  const urlQuery = searchParams.get('q') ?? ''
  const [value, setValue] = useState(urlQuery)
  const router = useRouter()
  const pathname = usePathname()
  const locale = getLocaleFromPathname(pathname)
  const t = getFrontendMessages(locale)

  const debouncedValue = useDebounce(value)

  useEffect(() => {
    // Only navigate when the typed query actually diverges from the URL —
    // otherwise opening a shared /search?q=… link would wipe its query.
    if (debouncedValue === urlQuery) return
    const searchPath = pathname.split('?')[0]
    const params = new URLSearchParams()
    if (debouncedValue) params.set('q', debouncedValue)
    router.replace(`${searchPath}${debouncedValue ? `?${params.toString()}` : ''}`)
  }, [debouncedValue, urlQuery, router, pathname])

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
          data-testid="search-input"
          value={value}
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
