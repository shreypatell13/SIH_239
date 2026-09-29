import { defineConfig, devices } from "@playwright/test";

const port = process.env.PORT || "3000";
const baseURL = process.env.BASE_URL || `http://localhost:${port}`;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  timeout: 60000,
  workers: 1,
  reporter: "list",
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: `npm run start -- --port ${port}`,
    url: baseURL,
    env: {
      INTERNAL_SWEEP_SECRET: process.env.INTERNAL_SWEEP_SECRET || "phase2m-local-e2e-only-secret",
      NEXTAUTH_URL: baseURL,
      NEXTAUTH_URL_INTERNAL: baseURL,
    },
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
