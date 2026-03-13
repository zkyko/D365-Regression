import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',

  /* ✅ GLOBAL TEST TIMEOUT (default was 30s) */
  timeout: 120_000, // 2 minutes per test (good for D365)

  /* ✅ EXPECT / ASSERTION TIMEOUT */
  expect: {
    timeout: 20_000,
  },

  /* Run tests in files in parallel */
  fullyParallel: true,

  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,

  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,

  /* Reporter to use */
  reporter: [
    ['html'],
    ['list'],
    ['json', { outputFile: 'test-results/results.json' }]
  ],

  /* Shared settings */
  use: {
    /* Base URL */
    baseURL: 'https://fourhands-test.sandbox.operations.dynamics.com/?cmp=FH&mi=DefaultDashboard',

    /* Saved authentication */
    storageState: 'auth.json',

    /* ✅ ACTION + NAVIGATION TIMEOUTS */
    actionTimeout: 30_000,
    navigationTimeout: 60_000,

    /* Debug artifacts */
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',

    headless: false,
    viewport: { width: 1920, height: 1080 },
    launchOptions: {
      slowMo: 300, // Just enough to see the clicks, but not enough to kill your productivity
    },
  },

  /* Browser projects */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
});