import { expect, test, type Page } from '@playwright/test'
import { getPayload } from 'payload'

import config from '../../src/payload.config.js'
import { minimalEventData } from '../helpers/factories'

const waitForPageReady = async (page: Page) => {
  await page.getByTestId('header-logo-link').waitFor({ state: 'visible' })
  await expect(page.getByTestId('lang-switch-en')).toBeVisible()
  await expect(page.getByTestId('lang-switch-uk')).toBeVisible()
}

let eventId: number
let eventSlug: string

test.beforeAll(async () => {
  const payload = await getPayload({ config: await config })
  const event = await payload.create({
    collection: 'events',
    data: minimalEventData('E2E Public Event') as never,
  })
  eventId = event.id
  eventSlug = event.slug
})

test.afterAll(async () => {
  const payload = await getPayload({ config: await config })
  await payload
    .delete({ collection: 'events', id: eventId, context: { disableRevalidate: true } })
    .catch(() => {})
})

test.describe('Events pages', () => {
  test('events page loads in ukrainian and english', async ({ page }) => {
    await page.goto('/events')
    await waitForPageReady(page)
    await expect(page.getByTestId('events-page-title')).toHaveText('Події')

    await page.goto('/en/events')
    await waitForPageReady(page)
    await expect(page.getByTestId('events-page-title')).toHaveText('Events')
  })

  test('event detail page shows the seeded event', async ({ page }) => {
    await page.goto(`/events/${eventSlug}`)
    await waitForPageReady(page)
    await expect(page.getByTestId('event-page-title')).toHaveText('E2E Public Event')
  })

  test('anonymous visitors are asked to sign in before registering', async ({ page }) => {
    await page.goto(`/events/${eventSlug}`)
    await waitForPageReady(page)
    await expect(page.getByTestId('event-signin-link')).toBeVisible()
  })

  test('ics download responds with a calendar file', async ({ request }) => {
    const response = await request.get(`/api/events/${eventId}/calendar.ics`)
    expect(response.status()).toBe(200)
    expect(response.headers()['content-type']).toContain('text/calendar')
    const body = await response.text()
    expect(body).toContain('BEGIN:VEVENT')
    expect(body).toContain('E2E Public Event')
  })
})
