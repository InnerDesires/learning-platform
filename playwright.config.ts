import { defineConfig, devices } from '@playwright/test'
import { config as dotenvConfig } from 'dotenv'

dotenvConfig({ path: '.env.local' })
dotenvConfig()

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests/e2e',
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  timeout: 60 * 1000,
  expect: {
    timeout: 15 * 1000,
  },
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    baseURL: 'http://localhost:3100',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], channel: 'chromium' },
    },
  ],
  webServer: {
    command: 'pnpm build && pnpm start --port 3100',
    reuseExistingServer: false,
    timeout: 240 * 1000,
    url: 'http://localhost:3100',
  },
})
