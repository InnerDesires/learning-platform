import { test, expect, type Page } from '@playwright/test'
import { getPayloadAuth } from 'payload-auth/better-auth'
import config from '../../src/payload.config.js'
import type { ConstructedBetterAuthPluginOptions } from '../../src/lib/auth/options.js'

const REG_EMAIL = 'e2e.registration@test.local'
const REG_PASSWORD = 'TestPassword123!'
const REG_NAME = 'E2E Registration'

// The avatar button rendered by UserMenu when a session is active.
// When logged out, UserMenu renders a plain link to /login instead.
const avatarButton = (page: Page) => page.locator('button[aria-haspopup="true"]')

async function getPayload() {
  return getPayloadAuth<ConstructedBetterAuthPluginOptions>(config)
}

async function deleteUser(email: string) {
  const payload = await getPayload()
  await payload.delete({ collection: 'users', where: { email: { equals: email } } })
}

async function createUser(email: string, password: string, name: string) {
  const payload = await getPayload()
  await payload.delete({ collection: 'users', where: { email: { equals: email } } })
  await payload.betterAuth.api.signUpEmail({ body: { email, password, name } })
}

test.describe('Registration flow', () => {
  test('register page renders all form fields', async ({ page }) => {
    await page.goto('/register')

    await expect(page).toHaveTitle(/Реєстрація/)
    await expect(page.locator('#name')).toBeVisible()
    await expect(page.locator('#email')).toBeVisible()
    await expect(page.locator('#password')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Зареєструватися' })).toBeVisible()
  })

  test('successful registration redirects to home and user is logged in', async ({ page }) => {
    await deleteUser(REG_EMAIL)

    await page.goto('/register')
    await page.fill('#name', REG_NAME)
    await page.fill('#email', REG_EMAIL)
    await page.fill('#password', REG_PASSWORD)
    await page.click('button[type="submit"]')

    // Must land on the home page — catches broken auth URL configs
    await expect(page).toHaveURL('/', { timeout: 10_000 })

    // Session must be active — avatar button replaces the login link
    await expect(avatarButton(page)).toBeVisible()

    await deleteUser(REG_EMAIL)
  })

  test('duplicate email shows inline error and stays on register page', async ({ page }) => {
    await createUser(REG_EMAIL, REG_PASSWORD, REG_NAME)

    await page.goto('/register')
    await page.fill('#name', 'Other User')
    await page.fill('#email', REG_EMAIL)
    await page.fill('#password', REG_PASSWORD)
    await page.click('button[type="submit"]')

    await expect(page.getByText('Ця електронна пошта вже зайнята.')).toBeVisible()
    await expect(page).toHaveURL(/\/register/)

    await deleteUser(REG_EMAIL)
  })

  test('authenticated user visiting /register is redirected to home', async ({ page }) => {
    await createUser(REG_EMAIL, REG_PASSWORD, REG_NAME)

    // Log in via the frontend login page
    await page.goto('/login')
    await page.fill('#email', REG_EMAIL)
    await page.fill('#password', REG_PASSWORD)
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/', { timeout: 10_000 })

    // Navigating to /register while logged in should redirect back to /
    await page.goto('/register')
    await expect(page).toHaveURL('/')

    await deleteUser(REG_EMAIL)
  })
})
