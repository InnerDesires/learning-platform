import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { LoginForm } from '@/components/Auth/LoginForm'
import { getSession } from '@/lib/auth/getSession'
import { defaultLocale, type SiteLocale } from '@/utilities/locales'
import { safeRedirectPath } from '@/utilities/safeRedirect'

type Args = {
  params: Promise<{ locale: SiteLocale }>
  searchParams: Promise<{ redirect?: string; reset?: string }>
}

export default async function LoginPage({ params, searchParams }: Args) {
  const { locale } = await params
  const { redirect: redirectParam, reset } = await searchParams
  const home = locale === defaultLocale ? '/' : `/${locale}`
  // sanitized return path; undefined keeps each form's own default
  const redirectTo = redirectParam ? safeRedirectPath(redirectParam, home) : undefined

  const session = await getSession()
  if (session?.user) {
    redirect(redirectTo ?? home)
  }

  const isProduction = process.env.VERCEL_ENV === 'production' || !process.env.VERCEL
  const googleEnabled = Boolean(process.env.GOOGLE_CLIENT_ID && isProduction)

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <LoginForm
        locale={locale}
        redirectTo={redirectTo}
        googleEnabled={googleEnabled}
        resetSuccess={reset === 'success'}
      />
    </div>
  )
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { locale } = await params
  return {
    title: locale === 'uk' ? 'Увійти' : 'Log in',
  }
}

export function generateStaticParams() {
  return [{ locale: 'uk' }, { locale: 'en' }]
}
