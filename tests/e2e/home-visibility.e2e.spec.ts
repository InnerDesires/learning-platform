import { expect, test } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { login } from '../helpers/login'
import { testUser } from '../helpers/seedUser'
import { minimalLexicalContent } from '../helpers/factories'

let initialSettings: { showCalendar: boolean; showNews: boolean } | undefined
let postIds: number[] = []

test.afterEach(async ({ page }) => {
  // Teardown has its own budget, so a failed assertion keeps its original error.
  test.setTimeout(60_000)
  for (const id of postIds) {
    const deleted = await page.request.delete(`/api/posts/${id}`)
    expect(deleted.ok()).toBeTruthy()
  }
  if (initialSettings) {
    const restored = await page.request.post('/api/globals/home-settings', {
      data: initialSettings,
    })
    expect(restored.ok()).toBeTruthy()
  }
})

// Use the same seeded admin as the rest of the E2E suite, including CI.
// Run against an isolated database: these cases save global settings.
test('admin can independently hide calendar and news in both languages', async ({
  browser,
  page,
}, testInfo) => {
  test.setTimeout(180_000)
  const screenshots = process.env.HOME_VISIBILITY_SCREENSHOTS || testInfo.outputPath('screenshots')
  await mkdir(screenshots, { recursive: true })
  initialSettings = undefined
  postIds = []
  await login({ page, user: testUser })
  const initialResponse = await page.request.get('/api/globals/home-settings')
  expect(initialResponse.ok()).toBeTruthy()
  const initial = await initialResponse.json()
  initialSettings = {
    showCalendar: initial.showCalendar !== false,
    showNews: initial.showNews !== false,
  }
  const visitor = await browser.newContext({ reducedMotion: 'reduce' })
  const home = await visitor.newPage()

  try {
    const denied = await visitor.request.post('/api/globals/home-settings', {
      data: { showCalendar: false, showNews: false },
    })
    expect(denied.status()).toBe(403)

    // CI starts from ci-base, which does not inherit the development news.
    for (let i = 0; i < 3; i++) {
      const created = await page.request.post('/api/posts?locale=uk', {
        data: {
          title: `E2E Home Visibility ${i + 1}`,
          slug: `e2e-home-visibility-${Date.now()}-${i}`,
          content: minimalLexicalContent,
          _status: 'published',
          publishedAt: new Date().toISOString(),
        },
      })
      expect(created.ok()).toBeTruthy()
      const { doc } = await created.json()
      postIds.push(doc.id)
    }
    // Start from a different state so the first case also exercises Save.
    const baseline = await page.request.post('/api/globals/home-settings', {
      data: { showCalendar: false, showNews: false },
    })
    expect(baseline.ok()).toBeTruthy()
    await page.goto('/admin/globals/home-settings')
    await expect(page.locator('#field-showCalendar')).toBeVisible()
    await expect(page.locator('#field-showNews')).toBeVisible()

    for (const [showCalendar, showNews, name] of [
      [true, true, 'both-visible'],
      [true, false, 'calendar-only'],
      [false, true, 'news-only'],
      [false, false, 'both-hidden'],
    ] as const) {
      await page.locator('#field-showCalendar').setChecked(showCalendar)
      await page.locator('#field-showNews').setChecked(showNews)
      const saved = page.waitForResponse(
        (response) =>
          response.url().includes('/api/globals/home-settings') &&
          response.request().method() === 'POST',
      )
      await page.getByRole('button', { name: 'Зберегти', exact: true }).click()
      expect((await saved).ok()).toBeTruthy()
      await page.reload()
      await expect(page.locator('#field-showCalendar')).toBeChecked({ checked: showCalendar })
      await expect(page.locator('#field-showNews')).toBeChecked({ checked: showNews })
      await page.screenshot({ path: path.join(screenshots, `admin-${name}.png`), fullPage: true })

      for (const [locale, url] of [
        ['uk', '/'],
        ['en', '/en'],
      ] as const) {
        await home.setViewportSize({ width: 1440, height: 1000 })
        await home.goto(url)
        await expect(home.locator('#about')).toBeVisible()
        await expect(home.locator('#partners')).toBeAttached()
        await expect(home.locator('#calendar')).toHaveCount(showCalendar ? 1 : 0)
        await expect(home.locator('#news')).toHaveCount(showNews ? 1 : 0)
        if (showCalendar) await expect(home.locator('#calendar h2')).toBeVisible()
        if (showNews) await expect(home.locator('#news article')).toHaveCount(3)
        // No empty shared band when both sections are hidden.
        await expect(home.locator('main > .on-paper')).toHaveCount(showCalendar || showNews ? 1 : 0)
        if (showCalendar && !showNews)
          await expect(home.locator('#calendar')).not.toHaveClass(/mt-16/)
        await home.evaluate(() => document.fonts.ready)
        const about = await home.locator('#about').boundingBox()
        const partners = await home.locator('#partners').boundingBox()
        const top = about!.y + about!.height - 100
        await home.screenshot({
          path: path.join(screenshots, `${locale}-${name}.png`),
          fullPage: true,
          clip: { x: 0, y: top, width: 1440, height: partners!.y - top + 250 },
          animations: 'disabled',
        })

        await home.setViewportSize({ width: 390, height: 844 })
        await home.reload()
        await expect(home.locator('#calendar')).toHaveCount(showCalendar ? 1 : 0)
        await expect(home.locator('#news')).toHaveCount(showNews ? 1 : 0)
        expect(
          await home.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
        ).toBeTruthy()
        await home.screenshot({
          path: path.join(screenshots, `${locale}-mobile-${name}.png`),
          fullPage: true,
          animations: 'disabled',
        })
      }
    }
  } finally {
    await visitor.close()
  }
})
