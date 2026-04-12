import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'

export interface LoginOptions {
  page: Page
  serverURL?: string
  user: {
    email: string
    password: string
  }
}

/**
 * Logs the user into the admin panel via the login page.
 */
export async function login({
  page,
  serverURL = '',
  user,
}: LoginOptions): Promise<void> {
  await page.goto(`${serverURL}/admin/login`)

  // payload-auth replaces Payload's default login form — selectors differ from standard Payload
  await page.fill('input[autocomplete="email"]', user.email)
  await page.fill('input[type="password"]', user.password)
  await page.click('button[type="submit"]')

  await page.waitForURL(/\/admin$/)

  await expect(page.getByTestId('before-dashboard-root')).toBeVisible()
}
