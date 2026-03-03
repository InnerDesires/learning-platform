import type { Metadata } from 'next'
import { getFrontendMessages } from '@/utilities/i18n'
import type { SiteLocale } from '@/utilities/locales'
import { VerifyForm } from './VerifyForm'

type Args = {
  params: Promise<{ locale: SiteLocale }>
}

export default async function VerifyLandingPage({ params }: Args) {
  const { locale } = await params
  const t = getFrontendMessages(locale)

  return (
    <div className="container max-w-xl py-24">
      <div className="rounded-xl border bg-card p-12 text-center">
        <svg
          className="w-16 h-16 mx-auto text-muted-foreground/40 mb-6"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="3" height="3" />
          <rect x="18" y="14" width="3" height="3" />
          <rect x="14" y="18" width="3" height="3" />
          <rect x="18" y="18" width="3" height="3" />
        </svg>
        <h1 className="text-2xl font-bold tracking-tight mb-3">{t.verifyLandingTitle}</h1>
        <p className="text-muted-foreground mb-8">{t.verifyLandingDescription}</p>
        <VerifyForm
          placeholder={t.verifyInputPlaceholder}
          submitLabel={t.verifyInputSubmit}
        />
      </div>
    </div>
  )
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { locale } = await params
  return {
    title: getFrontendMessages(locale).verifyMetaTitle,
  }
}
