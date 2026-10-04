import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.MOZAIK_DOCKER_BASE_URL ?? 'http://127.0.0.1:8080';

export default defineConfig({
  testDir: '.',
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL,
    trace: 'off',
  },
  projects: [{ name: 'docker', use: { ...devices['Desktop Chrome'] } }],
});
