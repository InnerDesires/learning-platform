import type {
  ArchiveBlock as ArchiveBlockProps,
  Course,
  CourseCategory,
  Post,
} from '@/payload-types'
import type { SiteLocale } from '@/utilities/locales'

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'
import RichText from '@/components/RichText'

import { CollectionArchive } from '@/components/CollectionArchive'
import type { CardPostData } from '@/components/Card'

const postToCard = (post: Post): CardPostData => ({
  ...post,
  collectionType: 'posts',
})

type CourseCardSource = Pick<Course, 'id' | 'title' | 'slug' | 'description' | 'heroImage' | 'category'>

const courseToCard = (course: CourseCardSource): CardPostData => ({
  id: course.id,
  slug: course.slug,
  title: course.title,
  categories: (course.category && typeof course.category === 'object'
    ? [course.category]
    : []) as CardPostData['categories'],
  meta: {
    description: course.description || null,
    image: typeof course.heroImage === 'object' ? course.heroImage : null,
  },
  collectionType: 'courses',
})

const courseCategoryToCard = (category: CourseCategory): CardPostData => ({
  id: category.id,
  slug: category.slug,
  title: category.title,
  categories: [],
  meta: {
    description: category.description || null,
    image: typeof category.image === 'object' ? category.image : null,
  },
  collectionType: 'course-categories',
})

export const ArchiveBlock: React.FC<
  ArchiveBlockProps & {
    id?: string
    locale?: SiteLocale
  }
> = async (props) => {
  const {
    id,
    categories,
    courseCategories,
    introContent,
    limit: limitFromProps,
    locale,
    populateBy,
    relationTo,
    selectedDocs,
  } = props

  const limit = limitFromProps || 3

  let cards: CardPostData[] = []

  if (populateBy === 'collection') {
    const payload = await getPayload({ config: configPromise })
    const localeQuery = locale ? { locale } : {}

    if (relationTo === 'courses') {
      const categoryIds = courseCategories?.map((category) =>
        typeof category === 'object' ? category.id : category,
      )

      const fetched = await payload.find({
        collection: 'courses',
        depth: 1,
        limit,
        sort: '-createdAt',
        ...localeQuery,
        select: {
          title: true,
          slug: true,
          description: true,
          heroImage: true,
          category: true,
        },
        where: {
          and: [
            { _status: { equals: 'published' } },
            ...(categoryIds && categoryIds.length > 0
              ? [{ category: { in: categoryIds } }]
              : []),
          ],
        },
      })

      cards = fetched.docs.map(courseToCard)
    } else if (relationTo === 'course-categories') {
      const fetched = await payload.find({
        collection: 'course-categories',
        depth: 1,
        limit,
        sort: 'title',
        ...localeQuery,
      })

      cards = fetched.docs.map(courseCategoryToCard)
    } else {
      const flattenedCategories = categories?.map((category) => {
        if (typeof category === 'object') return category.id
        else return category
      })

      const fetched = await payload.find({
        collection: 'posts',
        depth: 1,
        limit,
        ...localeQuery,
        where: {
          and: [
            { _status: { equals: 'published' } },
            ...(flattenedCategories && flattenedCategories.length > 0
              ? [{ categories: { in: flattenedCategories } }]
              : []),
          ],
        },
      })

      cards = fetched.docs.map(postToCard)
    }
  } else if (selectedDocs?.length) {
    cards = selectedDocs.flatMap((doc) => {
      if (typeof doc.value !== 'object') return []
      if (doc.relationTo === 'courses') return [courseToCard(doc.value)]
      if (doc.relationTo === 'course-categories') return [courseCategoryToCard(doc.value)]
      return [postToCard(doc.value)]
    })
  }

  return (
    <div className="my-16" id={`block-${id}`}>
      {introContent && (
        <div className="container mb-16">
          <RichText className="ms-0 max-w-[48rem]" data={introContent} enableGutter={false} />
        </div>
      )}
      <CollectionArchive posts={cards} locale={locale} />
    </div>
  )
}
