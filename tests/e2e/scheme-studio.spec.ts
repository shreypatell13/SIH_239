import { test, expect } from "@playwright/test";

test.describe("Phase 2D: Scheme Studio & Declarative Policy Engine E2E Tests", () => {
  test.describe("1. Access Control & Authorization (RBAC)", () => {
    test("unauthenticated access to /admin/schemes redirects to /login", async ({ page }) => {
      await page.goto("/admin/schemes");
      await expect(page).toHaveURL(/.*\/login.*/);
    });

    test("APPLICANT session cannot access /admin/schemes and receives 403 Forbidden", async ({
      page,
    }) => {
      // 1. Log in as APPLICANT
      await page.goto("/login");
      await page.getByRole("button", { name: /Sign in as APPLICANT/i }).click();

      // 2. Wait until landed on applicant dashboard
      await expect(page).toHaveURL(/\/applicant$/);
      await expect(page.getByRole("heading", { name: "Applicant Portal" })).toBeVisible();

      // 3. Attempt direct navigation to Scheme Studio (/admin/schemes)
      await page.goto("/admin/schemes");

      // 4. Server component layout guard must render 403 Forbidden UI
      await expect(page.getByText("HTTP 403 Forbidden")).toBeVisible();
      await expect(page.getByText("Access Restricted")).toBeVisible();
      await expect(page.getByText("SCHEME_ADMIN")).toBeVisible();
    });

    test("VERIFICATION_OFFICER session cannot access /admin/schemes and receives 403 Forbidden", async ({
      page,
    }) => {
      // 1. Log in as VERIFICATION_OFFICER
      await page.goto("/login");
      await page.getByRole("button", { name: /Sign in as VERIFICATION_OFFICER/i }).click();

      // 2. Wait until landed on officer dashboard
      await expect(page).toHaveURL(/\/officer$/);
      await expect(page.getByRole("heading", { name: "Officer Case Workspace" })).toBeVisible();

      // 3. Attempt direct navigation to Scheme Studio (/admin/schemes)
      await page.goto("/admin/schemes");

      // 4. Server component layout guard must render 403 Forbidden UI
      await expect(page.getByText("HTTP 403 Forbidden")).toBeVisible();
      await expect(page.getByText("Access Restricted")).toBeVisible();
      await expect(page.getByText("SCHEME_ADMIN")).toBeVisible();
    });
  });

  test.describe("2. SCHEME_ADMIN Scheme Studio Dashboard & Workflows", () => {
    test("SCHEME_ADMIN can log in, enter Scheme Studio and see NFST and NOS listed", async ({
      page,
    }) => {
      await page.goto("/login");
      await page.getByRole("button", { name: /Sign in as SCHEME_ADMIN/i }).click();

      // Wait until landed on admin dashboard
      await expect(page).toHaveURL(/\/admin$/);
      await expect(
        page.getByRole("heading", { name: "Scheme Studio — Administrator Console" })
      ).toBeVisible();

      await page.goto("/admin/schemes");
      await expect(page.getByRole("heading", { name: "Scheme Studio", exact: true })).toBeVisible();

      // Verify NFST and NOS are listed
      await expect(page.getByText("NFST").first()).toBeVisible();
      await expect(page.getByText("NOS").first()).toBeVisible();
      await expect(page.getByText(/National Fellowship for Higher Education/i)).toBeVisible();
      await expect(page.getByText(/National Overseas Scholarship/i)).toBeVisible();
    });

    test("SCHEME_ADMIN can inspect published SchemeVersion specification", async ({ page }) => {
      await page.goto("/login");
      await page.getByRole("button", { name: /Sign in as SCHEME_ADMIN/i }).click();
      await expect(page).toHaveURL(/\/admin$/);

      await page.goto("/admin/schemes");

      // Click "Manage Scheme" for first scheme
      await page
        .getByRole("link", { name: /Manage Scheme/i })
        .first()
        .click();

      // Should land on scheme detail page
      await expect(page.getByText("Scheme Version History")).toBeVisible();

      // Click "Inspect DSL"
      await page
        .getByRole("link", { name: /Inspect DSL/i })
        .first()
        .click();

      // Should land on version inspection page
      await expect(page.getByText(/Specification/i)).toBeVisible();
      await expect(page.getByText(/Dynamic Form Schema/i)).toBeVisible();
      await expect(page.getByText(/Document Requirements Matrix/i)).toBeVisible();
      await expect(page.getByText(/Eligibility Rules DSL/i)).toBeVisible();
    });

    test("SCHEME_ADMIN can open Scheme Studio draft editor and validate configuration", async ({
      page,
    }) => {
      await page.goto("/login");
      await page.getByRole("button", { name: /Sign in as SCHEME_ADMIN/i }).click();
      await expect(page).toHaveURL(/\/admin$/);

      await page.goto("/admin/schemes");
      await page
        .getByRole("link", { name: /Manage Scheme/i })
        .first()
        .click();

      // Click "Draft New Version"
      await page.getByRole("link", { name: /Draft New Version/i }).click();

      await expect(page.getByRole("heading", { name: /Declarative Policy Studio/i })).toBeVisible();
      await expect(page.getByText("1. Form Builder")).toBeVisible();
      await expect(page.getByText("2. Documents")).toBeVisible();
      await expect(page.getByText("3. Eligibility Rules")).toBeVisible();
      await expect(page.getByText("4. Workflow & SLAs")).toBeVisible();

      // Switch to Review & Publish tab
      await page.getByRole("button", { name: /7\. Review & Publish/i }).click();
      await expect(page.getByText("Pre-Publish Validation & Summary")).toBeVisible();
    });
  });

  test.describe("3. Public Scheme Explorer API Verification", () => {
    test("public GET /api/schemes returns active schemes without exposing internal thresholds", async ({
      request,
    }) => {
      const response = await request.get("/api/schemes");
      expect(response.ok()).toBe(true);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.schemes.length).toBeGreaterThanOrEqual(2);

      const nfst = data.schemes.find((s: { code: string }) => s.code === "NFST");
      expect(nfst).toBeDefined();
      expect(nfst.code).toBe("NFST");
      expect(nfst.name).toBeDefined();

      // Ensure internal eligibility rules are not leaked in public summary
      expect(nfst.eligibilityRules).toBeUndefined();
      expect(nfst.workflowConfig).toBeUndefined();
    });
  });
});
