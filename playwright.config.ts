import { defineConfig, devices } from '@playwright/test';

/** NOT YET RUN: requires `npm install` (registry was unavailable in the authoring environment). */
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 120_000,
  retries: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL: 'http://localhost:4173', trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: [
    { name: 'ipad-landscape', use: { ...devices['iPad (gen 7) landscape'] } },
    { name: 'ipad-portrait', use: { ...devices['iPad (gen 7)'] } },
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1024, height: 768 } } }
  ],
  webServer: { command: 'npm run build && npm run preview -- --port 4173 --strictPort', url: 'http://localhost:4173', reuseExistingServer: !process.env.CI, timeout: 180_000 }
});
