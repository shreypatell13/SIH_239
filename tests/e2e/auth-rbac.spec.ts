import { test, expect } from "@playwright/test";

test.describe("Authentication & Server-Authoritative RBAC E2E Tests", () => {
  test.describe("1. Unauthenticated Page Route Guards (Middleware)", () => {
    test("unauthenticated access to /officer redirects to /login", async ({ page }) => {
      await page.goto("/officer");
      await expect(page).toHaveURL(/.*\/login.*/);
      await expect(page.locator("h1")).toContainText("Sign In to TribalScholar AI");
    });

    test("unauthenticated access to /applicant redirects to /login", async ({ page }) => {
      await page.goto("/applicant");
      await expect(page).toHaveURL(/.*\/login.*/);
    });

    test("unauthenticated access to /admin redirects to /login", async ({ page }) => {
      await page.goto("/admin");
      await expect(page).toHaveURL(/.*\/login.*/);
    });

    test("unauthenticated access to /management redirects to /login", async ({ page }) => {
      await page.goto("/management");
      await expect(page).toHaveURL(/.*\/login.*/);
    });
  });

  test.describe("2. Demo Persona Authentication & Role Authorization", () => {
    test("applicant login succeeds and accessing /officer yields 403 Forbidden UI", async ({
      page,
    }) => {
      // 1. Go to login page
      await page.goto("/login");

      // 2. Click demo applicant quick sign-in
      await page.getByRole("button", { name: /Sign in as APPLICANT/i }).click();

      // 3. Should land on /applicant
      await expect(page).toHaveURL(/\/applicant/);
      await expect(page.locator("h1")).toContainText("Applicant Portal");
      await expect(page.getByText(/APPLICANT/i).first()).toBeVisible();

      // 4. Try navigating directly to /officer with APPLICANT session
      await page.goto("/officer");

      // 5. Must render 403 Forbidden UI (NOT redirected to another dashboard)
      await expect(page.getByText("HTTP 403 Forbidden")).toBeVisible();
      await expect(page.getByText("Access Restricted")).toBeVisible();
      await expect(page.getByText("VERIFICATION_OFFICER")).toBeVisible();
    });

    test("officer login succeeds and grants access to /officer", async ({ page }) => {
      await page.goto("/login");
      await page.getByRole("button", { name: /Sign in as VERIFICATION_OFFICER/i }).click();

      await expect(page).toHaveURL(/\/officer/);
      await expect(page.locator("h1")).toContainText("Officer Case Workspace");
    });

    test("admin login succeeds and grants access to /admin", async ({ page }) => {
      await page.goto("/login");
      await page.getByRole("button", { name: /Sign in as SCHEME_ADMIN/i }).click();

      await expect(page).toHaveURL(/\/admin/);
      await expect(page.locator("h1")).toContainText("Scheme Studio");
    });

    test("director login succeeds and grants access to /management", async ({ page }) => {
      await page.goto("/login");
      await page.getByRole("button", { name: /Sign in as OPERATIONS_DIRECTOR/i }).click();

      await expect(page).toHaveURL(/\/management/);
      await expect(page.locator("h1")).toContainText("Operations Control Tower");
    });
  });

  test.describe("3. Session Logout Lifecycle", () => {
    test("logout button clears active session and redirects to /login", async ({ page }) => {
      // 1. Log in
      await page.goto("/login");
      await page.getByRole("button", { name: /Sign in as APPLICANT/i }).click();
      await expect(page).toHaveURL(/\/applicant/);

      // 2. Click Logout in nav
      await page.getByRole("button", { name: /Logout/i }).click();

      // 3. Should redirect to /login
      await expect(page).toHaveURL(/.*\/login.*/);

      // 4. Visiting /applicant again should redirect back to /login
      await page.goto("/applicant");
      await expect(page).toHaveURL(/.*\/login.*/);
    });
  });

  test.describe("4. Protected API Route Authorization", () => {
    test("GET /api/officer/cases returns 401 when unauthenticated", async ({ request }) => {
      const response = await request.get("/api/officer/cases");
      expect(response.status()).toBe(401);
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("UNAUTHORIZED");
    });
  });
});
