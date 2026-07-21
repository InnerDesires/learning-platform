'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { KeyRound } from 'lucide-react'
import { authClient } from '@/lib/auth/client'
import { getFrontendMessages } from '@/utilities/i18n'
import type { SiteLocale } from '@/utilities/locales'

export type LinkedAccount = {
  id: number
  providerId: string
  accountId: string
}

const GoogleIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
)

export const ConnectedProviders: React.FC<{
  locale: SiteLocale
  accounts: LinkedAccount[]
  googleEnabled: boolean
  settingsPath: string
}> = ({ locale, accounts, googleEnabled, settingsPath }) => {
  const t = getFrontendMessages(locale)
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const googleAccount = accounts.find((a) => a.providerId === 'google')
  const credentialAccount = accounts.find((a) => a.providerId === 'credential')
  const canUnlinkGoogle = Boolean(googleAccount) && accounts.length > 1

  const handleConnectGoogle = async () => {
    setError(null)
    setBusy(true)
    const { error: linkError } = await authClient.linkSocial({
      provider: 'google',
      callbackURL: settingsPath,
    })
    if (linkError) {
      setError(t.settingsErrorGeneric)
      setBusy(false)
    }
    // On success the browser redirects to Google.
  }

  const handleDisconnectGoogle = async () => {
    if (!googleAccount) return
    setError(null)
    setBusy(true)
    const { error: unlinkError } = await authClient.unlinkAccount({
      providerId: 'google',
      accountId: googleAccount.accountId,
    })
    setBusy(false)
    if (unlinkError) {
      setError(t.settingsErrorGeneric)
    } else {
      router.refresh()
    }
  }

  const badge = (connected: boolean) => (
    <span
      className={`rounded-full px-2.5 py-0.5 font-display text-[10.5px] font-semibold uppercase tracking-[0.1em] ${
        connected ? 'bg-success/18 text-success' : 'bg-navy-2 text-steel'
      }`}
    >
      {connected ? t.settingsProviderConnected : t.settingsProviderNotConnected}
    </span>
  )

  return (
    <div className="space-y-2.5">
      {googleEnabled && (
        <div className="rounded-2xl border border-line bg-card px-6 py-4">
          <div className="flex flex-wrap items-center gap-3">
            <GoogleIcon />
            <span className="text-sm font-bold">Google</span>
            {badge(Boolean(googleAccount))}
            <div className="ml-auto">
              {googleAccount ? (
                <button
                  type="button"
                  disabled={busy || !canUnlinkGoogle}
                  onClick={handleDisconnectGoogle}
                  className="rounded-lg border border-input px-4 py-2 text-sm font-medium text-fog transition hover:border-error hover:text-error disabled:opacity-50"
                >
                  {t.settingsProviderDisconnect}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={busy}
                  onClick={handleConnectGoogle}
                  className="rounded-lg border border-input px-4 py-2 text-sm font-medium transition hover:border-orange hover:text-orange disabled:opacity-50"
                >
                  {t.settingsProviderConnect}
                </button>
              )}
            </div>
          </div>
          {googleAccount && !canUnlinkGoogle && (
            <p className="mt-2 text-xs text-steel">{t.settingsProviderLastMethod}</p>
          )}
        </div>
      )}

      <div className="rounded-2xl border border-line bg-card px-6 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <KeyRound className="h-5 w-5 text-orange" />
          <span className="text-sm font-bold">{t.settingsProviderPassword}</span>
          {badge(Boolean(credentialAccount))}
        </div>
        {!credentialAccount && (
          <p className="mt-2 text-xs text-steel">{t.settingsProviderPasswordHint}</p>
        )}
      </div>

      {error && <p className="rounded-md bg-error/10 px-3 py-2 text-sm text-error">{error}</p>}
    </div>
  )
}
