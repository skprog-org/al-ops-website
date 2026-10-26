import { defineConfig } from '@playwright/test';

// Responsive suite: serves the built static site in transformation/ and runs
// every spec against a matrix of viewports straddling the CSS breakpoints
// (560, 760, 860, 900, 1000, 1100, 1180, 1440).
export const VIEWPORTS = [
  { name: 'mobile-320', width: 320, height: 640 },
  { name: 'mobile-375', width: 375, height: 812 },
  { name: 'mobile-430', width: 430, height: 932 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'tablet-1024', width: 1024, height: 768 },
  { name: 'laptop-1280', width: 1280, height: 800 },
  { name: 'desktop-1440', width: 1440, height: 900 },
  { name: 'wide-1920', width: 1920, height: 1080 },
];

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL: 'http://localhost:4173', browserName: 'chromium' },
  webServer: {
    command: 'node tests/static-server.mjs',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
  projects: VIEWPORTS.map(({ name, width, height }) => ({
    name,
    use: { viewport: { width, height }, hasTouch: width < 1024 },
  })),
});
