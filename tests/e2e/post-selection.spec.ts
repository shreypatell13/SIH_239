import { test, expect } from "@playwright/test";

test.describe("Phase 2K — Post-Selection Management & Renewal Workflows E2E", () => {
  test("1. Post-Selection API endpoints reject unauthenticated requests (401)", async ({
    request,
  }) => {
    const overviewRes = await request.get("/api/post-selection/overview");
    expect(overviewRes.status()).toBe(401);

    const scholarsRes = await request.get("/api/post-selection/scholars");
    expect(scholarsRes.status()).toBe(401);

    const renewalsRes = await request.get("/api/post-selection/renewals");
    expect(renewalsRes.status()).toBe(401);

    const disbursementsRes = await request.get("/api/post-selection/disbursements");
    expect(disbursementsRes.status()).toBe(401);
  });

  test("2. Unauthenticated user accessing /post-selection is redirected to /login", async ({
    page,
  }) => {
    await page.goto("/post-selection");
    await expect(page).toHaveURL(/.*login.*/);
  });

  test("3. Verification Officer can log in and view Post-Selection Console with real KPIs and tables", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /Sign in as VERIFICATION_OFFICER/i }).click();
    await page.waitForURL("/officer");

    // Navigate to post-selection
    await page.goto("/post-selection");
    await expect(page.getByTestId("post-selection-heading")).toBeVisible();

    // Check KPI cards
    await expect(page.getByTestId("kpi-card-0")).toBeVisible(); // Total Scholars
    await expect(page.getByTestId("kpi-card-1")).toBeVisible(); // Active Scholars

    // Check Scholar Registry Table
    await page.getByTestId("main-tab-scholars").click();
    await expect(page.getByTestId("scholar-registry-table")).toBeVisible();
    await expect(page.getByText("Ramesh Kumar Meena")).toBeVisible();

    // Check Renewals Desk Table
    await page.getByTestId("main-tab-renewals").click();
    await expect(page.getByTestId("renewals-table")).toBeVisible();

    // Check Mock PFMS Disbursements Table
    await page.getByTestId("main-tab-disbursements").click();
    await expect(page.getByTestId("disbursements-table")).toBeVisible();
  });

  test("4. Officer can drill down into a Scholar detail workspace", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /Sign in as VERIFICATION_OFFICER/i }).click();
    await page.waitForURL("/officer");

    await page.goto("/post-selection");
    await page.getByTestId("main-tab-scholars").click();

    // Click on the first scholar's detail view button
    const firstViewBtn = page.getByRole("button", { name: "View Detail" }).first();
    await firstViewBtn.click();

    await expect(page.getByTestId("scholar-detail-workspace")).toBeVisible();
    await expect(page.getByTestId("scholar-name-heading")).toBeVisible();

    // Switch to Annual Renewals tab
    await page.getByTestId("tab-renewals").click();
    await expect(page.getByText("Multi-Year Annual Renewal & Progress History")).toBeVisible();

    // Switch to Mock Disbursements tab
    await page.getByTestId("tab-disbursements").click();
    await expect(page.getByTestId("scholar-disbursements-table")).toBeVisible();
  });
});
