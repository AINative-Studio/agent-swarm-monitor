import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E configuration for the AgentClaw dashboard.
 *
 * Scope: full user-flow coverage for the chat history UI (conversation list,
 * message transcript, semantic search) per issue #37. Only Chromium is
 * installed/run here to keep CI footprint small — add more `projects`
 * entries if cross-browser coverage is needed later.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 30 * 1000,
  expect: {
    timeout: 5 * 1000,
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['html'], ['list']] : 'list',

  use: {
    baseURL: 'http://localhost:3002',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Auto-start the Next.js dev server for the test run. Playwright reuses an
  // already-running server (e.g. one started manually during local dev) so
  // this is safe to leave on in both local and CI environments.
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3002',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
