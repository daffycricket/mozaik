import { defineConfig, devices } from '@playwright/test';

const API_PORT = 3001;
const WEB_PORT = 5173;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: process.env.CI === 'true',
  retries: 0,
  workers: 1,
  reporter: [['list'], ['json', { outputFile: 'test-results/playwright-results.json' }]],
  use: {
    baseURL: `http://127.0.0.1:${WEB_PORT}`,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      testIgnore: /fluidity\//,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'fluidity',
      testMatch: /fluidity\/.*\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], video: 'on' },
    },
  ],
  webServer: [
    {
      command: 'pnpm --filter @mozaik/server start',
      url: `http://127.0.0.1:${API_PORT}/api/health`,
      env: {
        PORT: String(API_PORT),
        DATABASE_PATH: ':memory:',
        NODE_ENV: 'development',
      },
      reuseExistingServer: process.env.CI !== 'true',
      timeout: 60_000,
    },
    {
      command: 'pnpm --filter @mozaik/web start',
      url: `http://127.0.0.1:${WEB_PORT}`,
      env: {
        VITE_E2E: '1',
      },
      reuseExistingServer: process.env.CI !== 'true',
      timeout: 60_000,
    },
  ],
});
