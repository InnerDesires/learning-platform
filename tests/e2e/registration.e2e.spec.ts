import { test, expect, type Page } from '@playwright/test'
import { getPayloadAuth } from 'payload-auth/better-auth'
import config from '../../src/payload.config.js'
import type { ConstructedBetterAuthPluginOptions } from '../../src/lib/auth/options.js'

const REG_EMAIL = 'e2e.registration@test.local'
const REG_PASSWORD = 'TestPassword123!'
const REG_NAME = 'E2E Registration'

const avatarButton = (page: Page) => page.locator('button[aria-haspopup="true"]')
const otpInputs = (page: Page) => page.locator('input[inputmode="numeric"]')

async function getPayload() {
  return getPayloadAuth<ConstructedBetterAuthPluginOptions>(config)
}

async function deleteUser(email: string) {
  const payload = await getPayload()
  await payload.delete({ collection: 'users', where: { email: { equals: email } } })
}

/** Read the OTP code from the verifications table after the browser triggers send-otp. */
async function getOtpForEmail(email: string): Promise<string> {
  const payload = await getPayload()
  const identifier = `email-verification-otp-${email.toLowerCase()}`
  const records = await payload.find({
    collection: 'verifications',
    where: { identifier: { equals: identifier } },
    limit: 1,
    sort: '-createdAt',
  })
  const value = records.docs[0]?.value as string | undefined
  if (!value) throw new Error(`No OTP found for ${email}`)
  return value.substring(0, value.lastIndexOf(':'))
}

/** Fill credentials and submit to reach the OTP step. */
async function fillCredentialsAndSubmit(page: Page) {
  await page.goto('/register')
  await page.fill('#name', REG_NAME)
  await page.fill('#email', REG_EMAIL)
  await page.fill('#password', REG_PASSWORD)
  await page.click('button[type="submit"]')
  await expect(page.getByText('Підтвердження email')).toBeVisible({ timeout: 10_000 })
}

/** Type a 6-digit code into the OTP inputs. */
async function typeOtp(page: Page, code: string) {
  const first = otpInputs(page).first()
  await first.click()
  for (const digit of code) {
    await page.keyboard.type(digit, { delay: 30 })
  }
}

/** Register a user via the full browser OTP flow so the web server owns the user record. */
async function registerViaBrowser(page: Page) {
  await fillCredentialsAndSubmit(page)
  const otp = await getOtpForEmail(REG_EMAIL)
  await typeOtp(page, otp)
  await page.getByRole('button', { name: 'Підтвердити' }).click()
  await expect(page).toHaveURL('/', { timeout: 15_000 })
}

test.describe('Registration flow', () => {
  test.beforeEach(async () => {
    await deleteUser(REG_EMAIL)
  })

  test.afterEach(async () => {
    await deleteUser(REG_EMAIL)
  })

  test('register page renders all form fields', async ({ page }) => {
    await page.goto('/register')

    await expect(page).toHaveTitle(/Реєстрація/)
    await expect(page.locator('#name')).toBeVisible()
    await expect(page.locator('#email')).toBeVisible()
    await expect(page.locator('#password')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Зареєструватися', exact: true })).toBeVisible()
  })

  test('submitting credentials shows OTP step with 6 digit inputs', async ({ page }) => {
    await fillCredentialsAndSubmit(page)

    await expect(otpInputs(page)).toHaveCount(6)
    await expect(page.getByRole('button', { name: 'Підтвердити' })).toBeVisible()
    await expect(page.getByText(REG_EMAIL)).toBeVisible()
  })

  test('wrong OTP shows error and stays on OTP step', async ({ page }) => {
    await fillCredentialsAndSubmit(page)
    await typeOtp(page, '000000')
    await page.getByRole('button', { name: 'Підтвердити' }).click()

    await expect(page.getByText('Невірний код')).toBeVisible()
    await expect(page).toHaveURL(/\/register/)
  })

  test('correct OTP creates account and redirects to home', async ({ page }) => {
    await fillCredentialsAndSubmit(page)

    const otp = await getOtpForEmail(REG_EMAIL)
    await typeOtp(page, otp)
    await page.getByRole('button', { name: 'Підтвердити' }).click()

    await expect(page).toHaveURL('/', { timeout: 15_000 })
    await expect(avatarButton(page)).toBeVisible()
  })

  test('duplicate email shows inline error at credentials step', async ({ page }) => {
    // Register first user through the browser so the web server sees the record
    await registerViaBrowser(page)

    // Clear session cookies and try to register again with same email
    await page.context().clearCookies()
    await page.goto('/register')
    await page.fill('#name', 'Other User')
    await page.fill('#email', REG_EMAIL)
    await page.fill('#password', REG_PASSWORD)
    await page.click('button[type="submit"]')

    await expect(page.getByText('Ця електронна пошта вже зайнята.')).toBeVisible()
    await expect(page).toHaveURL(/\/register/)
  })

  test('authenticated user visiting /register is redirected to home', async ({ page }) => {
    // Register and stay logged in
    await registerViaBrowser(page)

    // Navigating to /register while logged in should redirect back to /
    await page.goto('/register')
    await expect(page).toHaveURL('/')
  })
})
