import type { Metadata } from 'next/types'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import React, { cache } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { locales, type SiteLocale } from '@/utilities/locales'
import { getFrontendMessages } from '@/utilities/i18n'
import { CourseGrid } from '@/components/Courses/CourseGrid'
import { Eyebrow, Rails } from '@/components/brand'
import { getCatalogData } from '@/lib/courses/getCatalogData'
import { plural } from '@/utilities/plural'
import type { Media as MediaType } from '@/payload-types'

// Session-free on the server (viewer progress loads client-side in CourseGrid),
// so category pages serve from the ISR cache like the main catalog.
export const revalidate = 300

export async function generateStaticParams() {
  const payload = await getPayload({ config: configPromise })
  const categories = await payload.find({
    collection: 'course-categories',
    limit: 200,
    pagination: false,
    select: { slug: true },
  })

  return categories.docs.flatMap(({ slug }) =>
    slug ? locales.map((locale) => ({ locale, slug })) : [],
  )
}

type Args = {
  params: Promise<{ locale: SiteLocale; slug: string }>
}

const queryCategoryBySlug = cache(
  async ({ slug, locale }: { slug: string; locale: SiteLocale }) => {
    const payload = await getPayload({ config: configPromise })
    const result = await payload.find({
      collection: 'course-categories',
      locale,
      depth: 1,
      limit: 1,
      where: { slug: { equals: slug } },
    })
    return result.docs[0] ?? null
  },
)

export default async function CourseCategoryPage({ params: paramsPromise }: Args) {
  const { locale, slug } = await paramsPromise
  const decodedSlug = decodeURIComponent(slug)
  const t = getFrontendMessages(locale)
  const payload = await getPayload({ config: configPromise })

  const category = await queryCategoryBySlug({ slug: decodedSlug, locale })
  if (!category) notFound()

  const { courses, courseStats } = await getCatalogData({
    payload,
    locale,
    where: { category: { equals: category.id } },
  })

  const prefix = locale === 'en' ? '/en' : ''
  const image = category.image && typeof category.image === 'object' ? (category.image as MediaType) : null
  const imageUrl = image?.sizes?.large?.url || image?.sizes?.xlarge?.url || image?.url

  return (
    <div className="pb-16">
      <div className="relative overflow-hidden">
        {imageUrl && (
          <div
            className="absolute inset-0 bg-cover bg-center opacity-25"
            style={{ backgroundImage: `url(${imageUrl})` }}
          />
        )}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(720px 440px at 85% 0%, rgb(4 40 113 / 0.5), transparent 60%), linear-gradient(180deg, rgb(34 52 88 / 0.86) 0%, var(--void) 100%)',
          }}
        />
        <div className="relative container pb-10 pt-14 md:pt-16">
          <Link
            href={`${prefix}/courses`}
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.08em] text-fog transition-colors hover:text-orange"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {t.courseBackToCourses}
          </Link>
          <Eyebrow className="mt-6 block">{t.courseCategoryEyebrow}</Eyebrow>
          <h1 className="heading-display mt-2 text-[clamp(34px,4.6vw,54px)] font-bold leading-[1.04]">
            {category.title}
          </h1>
          <Rails className="mt-4" />
          {category.description && (
            <p className="mt-3 max-w-[60ch] text-sm leading-relaxed text-fog">
              {category.description}
            </p>
          )}
          <div className="num mt-4 text-[12.5px] font-semibold text-fog">
            {courses.length} {plural(locale, courses.length, t.coursesPlural)}
          </div>
        </div>
      </div>
      <div className="container">
        {courses.length > 0 ? (
          <CourseGrid courses={courses} courseStats={courseStats} locale={locale} />
        ) : (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">{t.courseCategoryEmpty}</p>
            <Link
              href={`${prefix}/courses`}
              className="mt-4 inline-flex items-center rounded-full border-[1.5px] border-line-2 px-5 py-2 font-display text-xs font-semibold uppercase tracking-[0.1em] text-cloud transition-colors hover:border-orange hover:text-orange"
            >
              {t.coursesResetFilter}
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { locale, slug } = await paramsPromise
  const decodedSlug = decodeURIComponent(slug)
  const t = getFrontendMessages(locale)
  const category = await queryCategoryBySlug({ slug: decodedSlug, locale })
  if (!category) return { title: t.coursesMetaTitle }
  return {
    title: t.courseCategoryMetaTitle.replace('{title}', category.title),
    description: category.description || undefined,
  }
}
