import { defineConfig, devices } from "@playwright/test";

// E2E tests for the chat widget. They run against `wrangler pages dev` serving
// the built site, with /api/ask MOCKED in each test (route interception) — so
// they're deterministic, free, and never call OpenAI or need a secret.
//
// Run:  npx playwright install chromium   (one-time, downloads the browser)
//       pnpm test:e2e
export default defineConfig({
  testDir: "test/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:8788",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "hugo --quiet && pnpm exec wrangler pages dev public --port 8788 --compatibility-date 2025-06-01",
    url: "http://127.0.0.1:8788",
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
  },
});
