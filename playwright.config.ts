import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  reporter: 'list',
  use: { baseURL: 'http://localhost:4321' },
  webServer: {
    command: 'npm run build && node scripts/serve-dist.mjs',
    url: 'http://localhost:4321/en/',
    reuseExistingServer: !process.env['CI'],
    timeout: 180_000,
  },
});
