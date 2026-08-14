import type { Metadata } from 'next'
import { locales, type SiteLocale } from '@/utilities/locales'
import { HomePage } from '@/components/Home'
import { resolveCalendarContent } from '@/components/Home/content'
import { getCachedGlobal } from '@/utilities/getGlobals'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { getServerSideURL } from '@/utilities/getURL'
import { Suspense } from 'react'
import { NewsSectionServer, NewsSectionSkeleton } from '@/components/Home/NewsServer'
import { CoursesGridServer, CoursesGridSkeleton } from '@/components/Home/CoursesServer'
import { CategoryCarousels } from '@/components/Courses/CategoryCarousels'

// generateStaticParams is required for `revalidate` to take effect: without it a
// dynamic-segment route is rendered per request.
export const revalidate = 300

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

type Args = {
  params: Promise<{
    locale: SiteLocale
  }>
}

export default async function Page({ params: paramsPromise }: Args) {
  const { locale } = await paramsPromise

  const homeCalendar = await getCachedGlobal('home-calendar', 0, locale)()

  return (
    <HomePage
      locale={locale}
      calendar={resolveCalendarContent(locale, homeCalendar)}
      newsSlot={
        <Suspense fallback={<NewsSectionSkeleton locale={locale} />}>
          <NewsSectionServer locale={locale} />
        </Suspense>
      }
      coursesSlot={
        <>
          <Suspense fallback={<CoursesGridSkeleton />}>
            <CoursesGridServer locale={locale} />
          </Suspense>
          <Suspense fallback={null}>
            <CategoryCarousels locale={locale} className="mt-12" />
          </Suspense>
        </>
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
