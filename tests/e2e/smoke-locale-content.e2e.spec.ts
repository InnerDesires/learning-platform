import { expect, test, type Page } from '@playwright/test'

const waitForPageReady = async (page: Page) => {
  await page.getByTestId('header-logo-link').waitFor({ state: 'visible' })
  await expect(page.getByTestId('lang-switch-en')).toBeVisible()
  await expect(page.getByTestId('lang-switch-uk')).toBeVisible()
}

test.describe('Smoke locale and content pages', () => {
  test('search page loads in ukrainian and english', async ({ page }) => {
    await page.goto('/search')
    await waitForPageReady(page)
    await expect(page.getByTestId('search-page-title')).toHaveText('Пошук')
    await expect(page.getByTestId('search-input')).toBeVisible()

    await page.goto('/en/search')
    await waitForPageReady(page)
    await expect(page.getByTestId('search-page-title')).toHaveText('Search')
    await expect(page.getByTestId('search-input')).toBeVisible()
  })

  test('posts page loads in ukrainian and english', async ({ page }) => {
    await page.goto('/posts')
    await waitForPageReady(page)
    await expect(page.getByTestId('posts-page-title')).toHaveText('Публікації')

    await page.goto('/en/posts')
    await waitForPageReady(page)
    await expect(page.getByTestId('posts-page-title')).toHaveText('Posts')
  })

  test('language switch works on search page', async ({ page }) => {
    await page.goto('/search')
    await waitForPageReady(page)
    await expect(page).toHaveURL(/\/search$/)
    await expect(page.getByTestId('search-page-title')).toHaveText('Пошук')

    await page.getByTestId('lang-switch-en').click()
    await expect(page).toHaveURL(/\/en\/search$/)
    await expect(page.getByTestId('search-page-title')).toHaveText('Search')

    await page.getByTestId('lang-switch-uk').click()
    await expect(page).toHaveURL(/\/search$/)
    await expect(page.getByTestId('search-page-title')).toHaveText('Пошук')
  })

  test('language switch works on posts page', async ({ page }) => {
    await page.goto('/posts')
    await waitForPageReady(page)
    await expect(page).toHaveURL(/\/posts$/)
    await expect(page.getByTestId('posts-page-title')).toHaveText('Публікації')

    await page.getByTestId('lang-switch-en').click()
    await expect(page).toHaveURL(/\/en\/posts$/)
    await expect(page.getByTestId('posts-page-title')).toHaveText('Posts')

    await page.getByTestId('lang-switch-uk').click()
    await expect(page).toHaveURL(/\/posts$/)
    await expect(page.getByTestId('posts-page-title')).toHaveText('Публікації')
  })

  test('search page visual regression snapshots', async ({ page }) => {
    await page.goto('/search')
    await waitForPageReady(page)
    const searchHeaderUk = page.getByTestId('search-page-content')
    await expect(searchHeaderUk).toHaveScreenshot('search-uk.png', { animations: 'disabled' })

    await page.goto('/en/search')
    await waitForPageReady(page)
    const searchHeaderEn = page.getByTestId('search-page-content')
    await expect(searchHeaderEn).toHaveScreenshot('search-en.png', { animations: 'disabled' })
  })

  test('posts page visual regression snapshots', async ({ page }) => {
    await page.goto('/posts')
    await waitForPageReady(page)
    const postsHeaderUk = page.getByTestId('posts-page-content')
    await expect(postsHeaderUk).toHaveScreenshot('posts-uk.png', { animations: 'disabled' })

    await page.goto('/en/posts')
    await waitForPageReady(page)
    const postsHeaderEn = page.getByTestId('posts-page-content')
    await expect(postsHeaderEn).toHaveScreenshot('posts-en.png', { animations: 'disabled' })
  })
})
