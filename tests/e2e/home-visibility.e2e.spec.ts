import { expect, test } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { login } from '../helpers/login'
import { DEV_ADMIN } from '../../src/lib/auth/dev-credentials'

// Run against an isolated development database: these cases save global settings.
test('admin can independently hide calendar and news in both languages', async ({
  browser,
  page,
}, testInfo) => {
  test.setTimeout(180_000)
  const screenshots = process.env.HOME_VISIBILITY_SCREENSHOTS || testInfo.outputPath('screenshots')
  await mkdir(screenshots, { recursive: true })
  const initialResponse = await page.request.get('/api/globals/home-settings')
  expect(initialResponse.ok()).toBeTruthy()
  const initial = await initialResponse.json()
  const visitor = await browser.newContext({ reducedMotion: 'reduce' })
  const home = await visitor.newPage()

  try {
    const denied = await visitor.request.post('/api/globals/home-settings', {
      data: { showCalendar: false, showNews: false },
    })
    expect(denied.status()).toBe(403)

    await login({ page, user: DEV_ADMIN })
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
    // Keep repeat runs and other tests independent of the final hidden state.
    await page.request.post('/api/globals/home-settings', {
      data: { showCalendar: initial.showCalendar !== false, showNews: initial.showNews !== false },
    })
    await visitor.close()
  }
})
