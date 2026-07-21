import configPromise from '@payload-config'
import { getPayload } from 'payload'
import type { SiteLocale } from '@/utilities/locales'
import { CourseCard } from '@/components/Courses/CourseCard'

type Props = {
  locale: SiteLocale
}

/** Latest three published courses for the home page strip. */
export async function CoursesGridServer({ locale }: Props) {
  const payload = await getPayload({ config: configPromise })
  const { docs } = await payload.find({
    collection: 'courses',
    locale,
    depth: 1,
    limit: 3,
    sort: '-createdAt',
    where: { _status: { equals: 'published' } },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      heroImage: true,
      category: true,
      steps: true,
      quiz: true,
    },
  })

  if (docs.length === 0) return null

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {docs.map((course) => (
        <CourseCard key={course.id} course={course} locale={locale} />
      ))}
    </div>
  )
}

export function CoursesGridSkeleton() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="animate-pulse overflow-hidden rounded-[14px] border border-line bg-card">
          <div className="aspect-[16/9] bg-navy-2" />
          <div className="space-y-2.5 p-5">
            <div className="h-4 w-20 rounded-full bg-navy-2" />
            <div className="h-5 w-3/4 rounded bg-navy-2" />
            <div className="h-4 w-full rounded bg-navy-2" />
          </div>
        </div>
      ))}
    </div>
  )
}
