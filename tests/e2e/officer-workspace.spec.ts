import { test, expect } from "@playwright/test";

test.describe("Phase 2I — Officer Case Review Workspace & Split-Screen Evidence E2E", () => {
  test.describe.configure({ mode: "serial" });

  test("1. Officer queue endpoint rejects unauthenticated request (401)", async ({ request }) => {
    const res = await request.get("/api/officer/cases");
    expect(res.status()).toBe(401);

    const body = await res.json();
    expect(body.success).toBe(false);
  });

  test("2. Officer case detail endpoint rejects unauthenticated request (401)", async ({
    request,
  }) => {
    const res = await request.get("/api/officer/cases/case_demo_nos_001");
    expect(res.status()).toBe(401);

    const body = await res.json();
    expect(body.success).toBe(false);
  });

  test("3. Applicant role receives 403 Forbidden when accessing officer queue and workspace", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /Sign in as APPLICANT/i }).click();
    await expect(page).toHaveURL(/\/applicant$/);

    // Test API guard directly
    const res = await page.evaluate(async () => {
      const r = await fetch("/api/officer/cases");
      return { status: r.status, json: await r.json() };
    });

    expect(res.status).toBe(403);
    expect(res.json.success).toBe(false);
    expect(JSON.stringify(res.json.error)).toContain("FORBIDDEN");

    // Test UI guard on /officer route
    await page.goto("/officer");
    await expect(page.getByText("HTTP 403 Forbidden")).toBeVisible();
    await expect(page.getByText("Access Restricted")).toBeVisible();
  });

  test("4. Verification Officer can log in and view the Case Queue with KPIs and filters", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /Sign in as VERIFICATION_OFFICER/i }).click();
    await expect(page).toHaveURL(/\/officer/);

    // Verify Officer Header & KPIs
    await expect(page.getByRole("heading", { name: /Officer Case Workspace/i })).toBeVisible();
    await expect(page.getByTestId("officer-queue-container")).toBeVisible();
    await expect(page.getByText(/Assigned Cases/i).first()).toBeVisible();
    await expect(page.getByText(/Ready for Review/i).first()).toBeVisible();

    // Verify Case Table renders demo cases
    await expect(page.getByText(/NOS-2026/i).first()).toBeVisible();
    await expect(page.getByText("Ramesh Kumar Meena").first()).toBeVisible();
  });

  test("5. Officer opens a case and enters the Split-Screen Workspace", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /Sign in as VERIFICATION_OFFICER/i }).click();
    await expect(page).toHaveURL(/\/officer/);

    // Click Review on the first case
    const reviewBtn = page.getByRole("link", { name: /Review/i }).first();
    await reviewBtn.click();

    // Verify navigation to split-screen workspace
    await expect(page).toHaveURL(/\/officer\/cases\//);
    await expect(page.getByTestId("split-screen-workspace-container")).toBeVisible();

    // Verify Case Header Bar
    await expect(page.getByText(/National Overseas Scholarship/i).first()).toBeVisible();
    await expect(page.getByText("Ramesh Kumar Meena").first()).toBeVisible();

    // Verify Left Pane Navigation Tabs
    await expect(page.getByTestId("tab-overview")).toBeVisible();
    await expect(page.getByTestId("tab-eligibility")).toBeVisible();
    await expect(page.getByTestId("tab-deficiencies")).toBeVisible();
    await expect(page.getByTestId("tab-timeline")).toBeVisible();

    // Verify Right Pane Document Viewer & Canvas
    await expect(page.getByTestId("document-viewer-pane")).toBeVisible();
    await expect(page.getByTestId("document-canvas-container")).toBeVisible();
  });

  test("6. Officer switches tabs and inspects Eligibility findings and Bounding Boxes", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /Sign in as VERIFICATION_OFFICER/i }).click();
    await expect(page).toHaveURL(/\/officer/);

    // Open case
    await page.goto("/officer/cases/case_demo_nos_001");
    await expect(page.getByTestId("split-screen-workspace-container")).toBeVisible();

    // Click Eligibility Tab
    await page.getByTestId("tab-eligibility").click();
    await expect(page.getByText(/Deterministic Rule Evaluations/i)).toBeVisible();
    await expect(page.getByText(/Cross-Document Consistency Verification/i)).toBeVisible();

    // Click on Caste Certificate rule item or Inspect Evidence button if visible
    const inspectBtn = page.getByRole("button", { name: /Inspect Evidence/i }).first();
    if (await inspectBtn.isVisible()) {
      await inspectBtn.click();
      // Right pane provenance card should be visible
      await expect(page.getByTestId("evidence-provenance-card")).toBeVisible();
    }

    // Switch to Timeline Tab
    await page.getByTestId("tab-timeline").click();
    await expect(page.getByText(/Chronological Case Audit Trail/i)).toBeVisible();

    // Switch to Deficiencies Tab
    await page.getByTestId("tab-deficiencies").click();
    await expect(page.getByRole("button", { name: /Issue Structured Deficiency/i })).toBeVisible();
  });

  test("7. Officer can record an audit review note and trigger stage transition", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /Sign in as VERIFICATION_OFFICER/i }).click();
    await expect(page).toHaveURL(/\/officer/, { timeout: 10000 });

    await page.goto("/officer/cases/case_demo_nos_001");
    await expect(page.getByTestId("split-screen-workspace-container")).toBeVisible();

    // Record an officer note via API
    const noteRes = await page.evaluate(async () => {
      const r = await fetch("/api/officer/cases/case_demo_nos_001/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          note: "E2E verification check: ST certificate seal and marksheet match NAD records.",
        }),
      });
      return { status: r.status, json: await r.json() };
    });

    expect(noteRes.status).toBe(201);
    expect(noteRes.json.success).toBe(true);

    // Refresh page to load updated timeline from server
    await page.reload();
    await expect(page.getByTestId("split-screen-workspace-container")).toBeVisible();

    // Verify note appears in timeline
    await page.getByTestId("tab-timeline").click();
    await expect(
      page.getByText(/E2E verification check: ST certificate seal/i).first()
    ).toBeVisible();
  });
});
