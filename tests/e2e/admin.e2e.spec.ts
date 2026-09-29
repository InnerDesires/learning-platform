import { test, expect, Page } from '@playwright/test'
import { login } from '../helpers/login'
import { testUser } from '../helpers/seedUser'

test.describe('Admin Panel', () => {
  test.describe.configure({ timeout: 120000 })

  let page: Page

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext()
    page = await context.newPage()

    await login({ page, user: testUser })
  })

  test('can navigate to dashboard', async () => {
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/admin$/)
    await expect(page.getByTestId('before-dashboard-root')).toBeVisible()
  })

  test('dashboard covers events', async () => {
    await page.goto('/admin')
    const dashboard = page.getByTestId('before-dashboard-root')
    await expect(dashboard.getByRole('link', { name: /Реєстрації на події/ })).toBeVisible()
    await expect(dashboard.locator('a[href="/admin/collections/events"]')).toBeVisible()
    await expect(dashboard.locator('a[href="/admin/collections/events/create"]')).toBeVisible()
  })

  test('can open the events and event registrations lists', async () => {
    await page.goto('/admin/collections/events')
    await expect(page).toHaveURL(/\/admin\/collections\/events(?:\?.*)?$/)
    await expect(page.getByRole('heading', { name: 'Події' }).first()).toBeVisible()

    await page.goto('/admin/collections/event-enrollments')
    await expect(page).toHaveURL(/\/admin\/collections\/event-enrollments(?:\?.*)?$/)
  })

  test('admin bar on the site links to events and the calendar, without create buttons', async () => {
    await page.goto('/')
    const bar = page.getByTestId('admin-bar')
    await expect(bar).toBeVisible({ timeout: 30000 })
    await expect(bar.locator('a[href="/admin/collections/events"]')).toBeVisible()
    await expect(bar.locator('a[href="/admin/globals/home-calendar"]')).toBeVisible()
    await expect(bar.locator('a[href$="/create"]')).toHaveCount(0)
  })

  test('can navigate to list view', async () => {
    await page.goto('/admin/collections/users')
    await expect(page).toHaveURL(/\/admin\/collections\/users(?:\?.*)?$/)
  })

  test('can navigate to edit view', async () => {
    await page.goto('/admin/collections/pages/create')
    await expect(page).toHaveURL(/\/admin\/collections\/pages\/[a-zA-Z0-9-_]+/)
  })
})
