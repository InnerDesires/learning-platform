import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { ForgotPasswordForm } from '@/components/Auth/ForgotPasswordForm'
import { getSession } from '@/lib/auth/getSession'
import { type SiteLocale } from '@/utilities/locales'

type Args = {
  params: Promise<{ locale: SiteLocale }>
}

export default async function ForgotPasswordPage({ params }: Args) {
  const { locale } = await params

  const session = await getSession()
  if (session?.user) {
    redirect('/')
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <ForgotPasswordForm locale={locale} />
    </div>
  )
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { locale } = await params
  return {
    title: locale === 'uk' ? 'Скидання пароля' : 'Reset password',
  }
}

export function generateStaticParams() {
  return [{ locale: 'uk' }, { locale: 'en' }]
}
