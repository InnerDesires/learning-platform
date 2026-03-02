import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-reindex-secret')
  if (secret !== process.env.CRON_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payload = await getPayload({ config: configPromise })

  const [courses, courseCategories] = await Promise.all([
    payload.find({
      collection: 'courses',
      limit: 1000,
      depth: 0,
      overrideAccess: true,
    }),
    payload.find({
      collection: 'course-categories',
      limit: 1000,
      depth: 0,
      overrideAccess: true,
    }),
  ])

  const courseUpdates = courses.docs.map((doc) =>
    payload.update({
      collection: 'courses',
      id: doc.id,
      data: {},
      overrideAccess: true,
    }),
  )

  const categoryUpdates = courseCategories.docs.map((doc) =>
    payload.update({
      collection: 'course-categories',
      id: doc.id,
      data: {},
      overrideAccess: true,
    }),
  )

  await Promise.all([...courseUpdates, ...categoryUpdates])

  return Response.json({
    ok: true,
    reindexed: {
      courses: courses.totalDocs,
      courseCategories: courseCategories.totalDocs,
    },
  })
}
