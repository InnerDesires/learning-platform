import type { Metadata } from 'next'
import type { SiteLocale } from '@/utilities/locales'
import { HomePage } from '@/components/Home'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { getServerSideURL } from '@/utilities/getURL'
import { Suspense } from 'react'
import { NewsSectionServer, NewsSectionSkeleton } from '@/components/Home/NewsServer'

type Args = {
  params: Promise<{
    locale: SiteLocale
  }>
}

export default async function Page({ params: paramsPromise }: Args) {
  const { locale } = await paramsPromise

  return (
    <HomePage
      locale={locale}
      newsSlot={
        <Suspense fallback={<NewsSectionSkeleton locale={locale} />}>
          <NewsSectionServer locale={locale} />
        </Suspense>
      }
    />
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { locale } = await paramsPromise

  const title = locale === 'uk' ? 'Залізна Зміна — Проєкт розвитку молоді' : 'Iron Squad — Youth Development Project'
  const description =
    locale === 'uk'
      ? 'Унікальний проєкт розвитку талановитої молоді України. Навчання, спорт, творчість та розвиток.'
      : 'A unique project for developing talented Ukrainian youth. Education, sports, creativity, and growth.'

  return {
    title,
    description,
    openGraph: mergeOpenGraph({
      title,
      description,
      url: '/',
      images: [{ url: `${getServerSideURL()}/og-image.webp` }],
    }),
  }
}
