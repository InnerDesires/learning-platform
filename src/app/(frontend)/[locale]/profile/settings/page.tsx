import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import { getPayload } from '@/lib/payload'
import { requireSession } from '@/lib/auth/requireSession'
import { getFrontendMessages } from '@/utilities/i18n'
import { defaultLocale, type SiteLocale } from '@/utilities/locales'
import { AboutForm } from '@/components/AccountSettings/AboutForm'
import { NameForm } from '@/components/AccountSettings/NameForm'
import { AvatarForm } from '@/components/AccountSettings/AvatarForm'
import { SocialLinksForm } from '@/components/AccountSettings/SocialLinksForm'
import { PrivacyForm } from '@/components/AccountSettings/PrivacyForm'
import { ConnectedProviders } from '@/components/AccountSettings/ConnectedProviders'
import { PasswordForm } from '@/components/AccountSettings/PasswordForm'

type Args = {
  params: Promise<{ locale: SiteLocale }>
}

export default async function SettingsPage({ params }: Args) {
  const { locale } = await params
  const prefix = locale === defaultLocale ? '' : `/${locale}`
  const settingsPath = `${prefix}/profile/settings`
  const session = await requireSession(locale, settingsPath)
  const user = session.user
  const t = getFrontendMessages(locale)

  const payload = await getPayload()
  const userId = Number(user.id)
  const [userDoc, accountsResult] = await Promise.all([
    payload.findByID({ collection: 'users', id: userId }),
    payload.find({
      collection: 'accounts',
      where: { user: { equals: userId } },
      limit: 20,
      depth: 0,
    }),
  ])

  // Strip tokens — only what the UI needs crosses to the client.
  const accounts = accountsResult.docs.map((account) => ({
    id: account.id,
    providerId: account.providerId,
    accountId: account.accountId,
  }))
  const hasCredential = accounts.some((a) => a.providerId === 'credential')
  const googleEnabled = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)

  const initialLinks = (userDoc.socialLinks ?? []).map(({ platform, url }) => ({ platform, url }))
  // Prefer the DB doc over the session: the session cookie cache can lag
  // behind server-action updates (avatar) by up to its 5-minute maxAge.
  const displayName = userDoc.name || user.name || ''
  const image = userDoc.image ?? user.image
  const initials = (displayName || user.email)?.[0]?.toUpperCase() || '?'

  const sectionHeading = 'heading-display mb-4 mt-10 text-xl tracking-[0.06em]'

  return (
    <div className="container max-w-2xl py-16">
      <Link
        href={`${prefix}/profile`}
        className="inline-flex items-center gap-2 text-sm font-medium text-fog transition-colors hover:text-orange"
      >
        <ArrowLeft className="h-4 w-4" />
        {t.settingsBack}
      </Link>
      <h1 className="heading-display mt-4 text-3xl">{t.settingsTitle}</h1>

      <h2 className={sectionHeading}>{t.settingsAvatarSection}</h2>
      <AvatarForm locale={locale} image={image} initials={initials} />

      <h2 className={sectionHeading}>{t.settingsNameSection}</h2>
      <NameForm locale={locale} initialName={displayName} />

      <h2 className={sectionHeading}>{t.settingsAboutSection}</h2>
      <AboutForm locale={locale} initialAbout={userDoc.about ?? ''} />

      <h2 className={sectionHeading}>{t.settingsSocialSection}</h2>
      <SocialLinksForm locale={locale} initialLinks={initialLinks} />

      <h2 className={sectionHeading}>{t.settingsPrivacySection}</h2>
      <PrivacyForm locale={locale} initialHideComments={userDoc.hideProfileComments === true} />

      <h2 className={sectionHeading}>{t.settingsProvidersSection}</h2>
      <ConnectedProviders
        locale={locale}
        accounts={accounts}
        googleEnabled={googleEnabled}
        settingsPath={settingsPath}
      />

      <h2 className={sectionHeading}>{t.settingsPasswordSection}</h2>
      <PasswordForm locale={locale} hasCredential={hasCredential} />
    </div>
  )
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { locale } = await params
  return {
    title: getFrontendMessages(locale).settingsTitle,
  }
}

export function generateStaticParams() {
  return [{ locale: 'uk' }, { locale: 'en' }]
}
