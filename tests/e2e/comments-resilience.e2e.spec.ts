import { expect, test } from '@playwright/test'
import { getPayload } from 'payload'

import config from '../../src/payload.config.js'
import { minimalCourseData } from '../helpers/factories'

let courseId: number
let courseSlug: string

test.beforeAll(async () => {
  const payload = await getPayload({ config: await config })
  const course = await payload.create({
    collection: 'courses',
    data: { ...minimalCourseData('E2E Comments Resilience'), _status: 'published' },
    context: { disableRevalidate: true },
  })
  courseId = course.id
  courseSlug = course.slug
})

test.afterAll(async () => {
  const payload = await getPayload({ config: await config })
  await payload
    .delete({ collection: 'courses', id: courseId, context: { disableRevalidate: true } })
    .catch(() => {})
})

test.describe('Comments and likes when server actions fail', () => {
  test('skeletons clear and comments offer a retry instead of pulsing forever', async ({
    page,
  }) => {
    let failing = true
    await page.route('**/*', async (route) => {
      const request = route.request()
      const isServerAction = request.method() === 'POST' && 'next-action' in request.headers()
      if (failing && isServerAction) {
        await route.fulfill({ status: 500, contentType: 'text/plain', body: 'boom' })
        return
      }
      await route.continue()
    })

    await page.goto(`/courses/${courseSlug}`)
    const comments = page.locator('#comments')
    await comments.scrollIntoViewIfNeeded()

    await expect(comments.getByRole('button', { name: 'Спробувати ще раз' })).toBeVisible()
    await expect(comments.locator('.animate-pulse')).toHaveCount(0)

    failing = false
    await comments.getByRole('button', { name: 'Спробувати ще раз' }).click()
    await expect(comments.getByRole('button', { name: 'Спробувати ще раз' })).toHaveCount(0)
    await expect(comments.locator('.animate-pulse')).toHaveCount(0)
  })
})
