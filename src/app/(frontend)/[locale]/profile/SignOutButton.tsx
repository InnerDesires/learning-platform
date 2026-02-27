'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from '@/lib/auth/client'
import { defaultLocale, type SiteLocale } from '@/utilities/locales'

export const SignOutButton: React.FC<{
  locale: SiteLocale
  children: React.ReactNode
}> = ({ locale, children }) => {
  const router = useRouter()

  const handleSignOut = async () => {
    const homePath = locale === defaultLocale ? '/' : `/${locale}`
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push(homePath)
          router.refresh()
        },
      },
    })
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      className="inline-flex items-center rounded-lg border border-destructive/30 px-5 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
    >
      {children}
    </button>
  )
}
