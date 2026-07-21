import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-reindex-secret')
  if (secret !== process.env.CRON_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payload = await getPayload({ config: configPromise })

  const allSearchDocs = await payload.find({
    collection: 'search',
    limit: 10000,
    depth: 0,
    pagination: false,
    overrideAccess: true,
  })

  for (const doc of allSearchDocs.docs) {
    await payload.delete({ collection: 'search', id: doc.id, overrideAccess: true })
  }

  // Only published docs are re-saved, and always with draft: false — re-saving a
  // doc that has a newer pending draft would otherwise promote that draft's
  // status and silently unpublish the document.
  const publishedOnly = {
    limit: 1000,
    depth: 0,
    overrideAccess: true,
    where: { _status: { equals: 'published' } },
  } as const

  const [posts, courses, courseCategories, pages] = await Promise.all([
    payload.find({ collection: 'posts', ...publishedOnly }),
    payload.find({ collection: 'courses', ...publishedOnly }),
    payload.find({ collection: 'course-categories', limit: 1000, depth: 0, overrideAccess: true }),
    payload.find({ collection: 'pages', ...publishedOnly }),
  ])

  for (const doc of posts.docs) {
    await payload.update({ collection: 'posts', id: doc.id, data: {}, draft: false, overrideAccess: true })
  }
  for (const doc of courses.docs) {
    await payload.update({ collection: 'courses', id: doc.id, data: {}, draft: false, overrideAccess: true })
  }
  for (const doc of courseCategories.docs) {
    await payload.update({
      collection: 'course-categories',
      id: doc.id,
      data: {},
      overrideAccess: true,
    })
  }
  for (const doc of pages.docs) {
    await payload.update({ collection: 'pages', id: doc.id, data: {}, draft: false, overrideAccess: true })
  }

  return Response.json({
    ok: true,
    deleted: allSearchDocs.totalDocs,
    reindexed: {
      posts: posts.totalDocs,
      courses: courses.totalDocs,
      courseCategories: courseCategories.totalDocs,
      pages: pages.totalDocs,
    },
  })
}
