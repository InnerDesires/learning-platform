import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { LoginForm } from '@/components/Auth/LoginForm'
import { getSession } from '@/lib/auth/getSession'
import { defaultLocale, type SiteLocale } from '@/utilities/locales'

type Args = {
  params: Promise<{ locale: SiteLocale }>
  searchParams: Promise<{ redirect?: string }>
}

export default async function LoginPage({ params, searchParams }: Args) {
  const { locale } = await params
  const { redirect: redirectTo } = await searchParams

  const session = await getSession()
  if (session?.user) {
    redirect(redirectTo || '/')
  }

  const isProduction = process.env.VERCEL_ENV === 'production' || !process.env.VERCEL
  const googleEnabled = Boolean(process.env.GOOGLE_CLIENT_ID && isProduction)

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <LoginForm locale={locale} redirectTo={redirectTo} googleEnabled={googleEnabled} />
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
