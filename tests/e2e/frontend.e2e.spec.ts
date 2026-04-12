import { test, expect, Page } from '@playwright/test'

test.describe('Frontend', () => {
  let page: Page

  test.beforeAll(async ({ browser }, testInfo) => {
    const context = await browser.newContext()
    page = await context.newPage()
  })

  test('can load homepage', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Залізна Зміна/)
    await expect(page.getByTestId('header-logo-link')).toBeVisible()
    await expect(page.getByTestId('header-search-link')).toBeVisible()
  })
})
