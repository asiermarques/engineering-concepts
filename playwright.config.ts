import { defineConfig } from '@playwright/test';

// E2E_BASE_URL runs the suite against a deployed site (e.g. a Netlify deploy) instead of a local build.
const externalBaseUrl = process.env['E2E_BASE_URL'];

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  reporter: 'list',
  use: { baseURL: externalBaseUrl ?? 'http://localhost:4321' },
  ...(externalBaseUrl
    ? {}
    : {
        webServer: {
          command: 'npm run build && node scripts/serve-dist.mjs',
          url: 'http://localhost:4321/en/',
          reuseExistingServer: !process.env['CI'],
          timeout: 180_000,
        },
      }),
});
