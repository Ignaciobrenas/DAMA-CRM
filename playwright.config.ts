import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 60000,
  expect: {
    timeout: 10000,
  },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    viewport: { width: 1280, height: 720 },
    headless: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: 'npm --prefix server run dev',
      port: 4000,
      reuseExistingServer: true,
      timeout: 30000,
    },
    {
      command: 'npm --prefix client run dev',
      port: 5173,
      reuseExistingServer: true,
      timeout: 30000,
    },
  ],
});
