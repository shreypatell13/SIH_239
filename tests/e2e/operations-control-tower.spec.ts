import { test, expect } from "@playwright/test";

test.describe("Phase 2J — Operations Control Tower & Bottleneck Analytics E2E", () => {
  test("1. Operations API endpoints reject unauthenticated requests (401)", async ({ request }) => {
    const resOverview = await request.get("/api/operations/overview");
    expect(resOverview.status()).toBe(401);

    const resBottlenecks = await request.get("/api/operations/bottlenecks");
    expect(resBottlenecks.status()).toBe(401);

    const resCases = await request.get("/api/operations/cases");
    expect(resCases.status()).toBe(401);
  });

  test("2. Applicant role receives 403 Forbidden when accessing Control Tower", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /Sign in as APPLICANT/i }).click();
    await expect(page).toHaveURL(/\/applicant/, { timeout: 10000 });

    // Try navigating to /management as APPLICANT
    await page.goto("/management");
    await expect(page.getByText(/Forbidden/i).or(page.getByText(/rejected/i))).toBeVisible();

    // Verify API returns 403
    const apiRes = await page.evaluate(async () => {
      const r = await fetch("/api/operations/overview");
      return { status: r.status, json: await r.json() };
    });
    expect(apiRes.status).toBe(403);
    expect(apiRes.json.success).toBe(false);
  });

  test("Verification officers cannot access management-wide analytics", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /Sign in as VERIFICATION_OFFICER/i }).click();
    await expect(page).toHaveURL(/\/officer/);
    const response = await page.evaluate(async () => {
      const result = await fetch("/api/operations/overview");
      return { status: result.status, body: await result.json() };
    });
    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
  });

  test("3. OPERATIONS_DIRECTOR can log in and view Control Tower KPIs & Stage Distribution", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /Sign in as OPERATIONS_DIRECTOR/i }).click();
    await expect(page).toHaveURL(/\/management/, { timeout: 10000 });

    // Verify Control Tower Header
    await expect(page.getByRole("heading", { name: /Operations Control Tower/i })).toBeVisible();
    await expect(page.getByText(/OPERATIONS_DIRECTOR/i)).toBeVisible();

    // Verify KPI Summary Cards
    await expect(page.getByTestId("kpi-card-total-cases")).toBeVisible();
    await expect(page.getByTestId("kpi-card-completed")).toBeVisible();
    await expect(page.getByTestId("kpi-card-deficiencies")).toBeVisible();

    // Verify Stage Distribution Card
    await expect(page.getByTestId("stage-distribution-card")).toBeVisible();
    await expect(page.getByTestId("stage-row-OFFICER_REVIEW")).toBeVisible();
  });

  test("4. Director can switch tabs and inspect Bottlenecks, Aging, and Deficiency Heatmap", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /Sign in as OPERATIONS_DIRECTOR/i }).click();
    await expect(page).toHaveURL(/\/management/, { timeout: 10000 });

    // Switch to Bottlenecks Tab
    await page.getByTestId("tab-bottlenecks").click();
    await expect(page.getByTestId("bottleneck-alerts-card")).toBeVisible();

    // Switch to Aging Cohorts Tab
    await page.getByTestId("tab-aging").click();
    await expect(page.getByTestId("aging-sla-card")).toBeVisible();
    await expect(page.getByTestId("aging-bucket-DAYS_0_TO_2")).toBeVisible();

    // Switch to Deficiency Heatmap Tab
    await page.getByTestId("tab-deficiencies").click();
    await expect(page.getByTestId("deficiency-heatmap-card")).toBeVisible();
  });

  test("5. Director can open Drill-Down Drawer and navigate directly to Phase 2I Case Workspace", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /Sign in as OPERATIONS_DIRECTOR/i }).click();
    await expect(page).toHaveURL(/\/management/, { timeout: 10000 });

    // Click on Stage Inspect Button
    const inspectBtn = page.getByRole("button", { name: /Inspect/i }).first();
    await inspectBtn.click();

    // Verify Drill-Down Drawer opens
    await expect(page.getByTestId("drill-down-case-drawer")).toBeVisible();
    await expect(page.getByTestId("drill-down-title")).toBeVisible();

    // Verify cases are listed
    await expect(page.getByText(/Matching Cases/i)).toBeVisible();
  });
});
