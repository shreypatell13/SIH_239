import { test, expect } from "@playwright/test";

test.describe("Phase 2G — Deterministic Eligibility & Verification Engine E2E", () => {
  test("1. Evaluate endpoint rejects unauthenticated request (401)", async ({ request }) => {
    const res = await request.post("/api/officer/applications/app_demo_nos_sub_001/evaluate");
    expect(res.status()).toBe(401);

    const body = await res.json();
    expect(body.success).toBe(false);
  });

  test("2. Eligibility GET endpoint rejects unauthenticated request (401)", async ({ request }) => {
    const res = await request.get("/api/officer/applications/app_demo_nos_sub_001/eligibility");
    expect(res.status()).toBe(401);

    const body = await res.json();
    expect(body.success).toBe(false);
  });

  test("3. Applicant role receives 403 Forbidden when triggering evaluation", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /Sign in as APPLICANT/i }).click();
    await expect(page).toHaveURL(/\/applicant$/);
    await expect(page.getByRole("heading", { name: "Applicant Portal" })).toBeVisible();

    const res = await page.evaluate(async () => {
      const r = await fetch("/api/officer/applications/app_demo_nos_sub_001/evaluate", {
        method: "POST",
      });
      return { status: r.status, json: await r.json() };
    });

    expect(res.status).toBe(403);
    expect(res.json.success).toBe(false);
    expect(res.json.error).toContain("Forbidden");
  });

  test("4. Verification Officer can trigger deterministic eligibility evaluation", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /Sign in as VERIFICATION_OFFICER/i }).click();
    await expect(page).toHaveURL(/\/officer/);
    await expect(page.getByRole("heading", { name: "Officer Case Workspace" })).toBeVisible();

    const res = await page.evaluate(async () => {
      const r = await fetch("/api/officer/applications/app_demo_nos_sub_001/evaluate", {
        method: "POST",
      });
      return { status: r.status, json: await r.json() };
    });

    expect(res.status).toBe(200);
    expect(res.json.success).toBe(true);
    expect(res.json.data).toBeDefined();

    const data = res.json.data;
    expect(data.schemeCode).toBe("NOS");
    expect(data.assessmentStatus).toBe("ELIGIBLE_ASSESSED");
    expect(data.summary).toBeDefined();
    expect(data.summary.hardFails).toBe(0);
    expect(data.summary.passed).toBeGreaterThanOrEqual(4);
    expect(Array.isArray(data.ruleResults)).toBe(true);
    expect(data.ruleResults.length).toBeGreaterThanOrEqual(4);
    expect(Array.isArray(data.consistencyChecks)).toBe(true);
    expect(data.consistencyChecks.length).toBeGreaterThanOrEqual(4);
  });

  test("5. Verification Officer can retrieve latest eligibility assessment result via GET", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /Sign in as VERIFICATION_OFFICER/i }).click();
    await expect(page).toHaveURL(/\/officer/);
    await expect(page.getByRole("heading", { name: "Officer Case Workspace" })).toBeVisible();

    const res = await page.evaluate(async () => {
      const r = await fetch("/api/officer/applications/app_demo_nos_sub_001/eligibility");
      return { status: r.status, json: await r.json() };
    });

    expect(res.status).toBe(200);
    expect(res.json.success).toBe(true);
    expect(res.json.data.schemeCode).toBe("NOS");
    expect(res.json.data.assessmentStatus).toBe("ELIGIBLE_ASSESSED");
    expect(res.json.data.ruleResults.every((r: { outcome: string }) => r.outcome === "PASS")).toBe(
      true
    );
  });
});
