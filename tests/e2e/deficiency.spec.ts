import { test, expect } from "@playwright/test";

test.describe("Phase 2H — Deficiency & Resolution Workflow E2E", () => {
  test.describe.configure({ mode: "serial" });
  test("1. Applicant deficiency endpoint rejects unauthenticated request (401)", async ({
    request,
  }) => {
    const res = await request.get("/api/applicant/applications/app_demo_nos_sub_001/deficiencies");
    expect(res.status()).toBe(401);

    const body = await res.json();
    expect(body.success).toBe(false);
  });

  test("2. Officer deficiency endpoint rejects unauthenticated request (401)", async ({
    request,
  }) => {
    const res = await request.get("/api/officer/applications/app_demo_nos_sub_001/deficiencies");
    expect(res.status()).toBe(401);

    const body = await res.json();
    expect(body.success).toBe(false);
  });

  test("3. Applicant role receives 403 Forbidden when accessing officer deficiency APIs", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /Sign in as APPLICANT/i }).click();
    await expect(page).toHaveURL(/\/applicant$/);
    await expect(page.getByRole("heading", { name: "Applicant Portal" })).toBeVisible();

    const res = await page.evaluate(async () => {
      const r = await fetch("/api/officer/applications/app_demo_nos_sub_001/deficiencies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseDossierId: "case_demo_nos_001",
          deficiencyType: "DATA_MISMATCH",
        }),
      });
      return { status: r.status, json: await r.json() };
    });

    expect(res.status).toBe(403);
    expect(res.json.success).toBe(false);
    expect(res.json.error).toContain("Forbidden");
  });

  test("4. Verification Officer can issue an explainable deficiency on a case", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /Sign in as VERIFICATION_OFFICER/i }).click();
    await expect(page).toHaveURL(/\/officer/);
    await expect(page.getByRole("heading", { name: "Officer Case Workspace" })).toBeVisible();

    const res = await page.evaluate(async () => {
      const r = await fetch("/api/officer/applications/app_demo_nos_sub_001/deficiencies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseDossierId: "case_demo_nos_001",
          deficiencyType: "DOCUMENT_ILLEGIBLE",
          documentType: "INCOME_CERTIFICATE",
          customDescription: "Income certificate stamp is faded. Please re-upload clear scan.",
        }),
      });
      return { status: r.status, json: await r.json() };
    });

    expect(res.status).toBe(201);
    expect(res.json.success).toBe(true);
    expect(res.json.data).toBeDefined();
    expect(res.json.data.status).toBe("OPEN");
    expect(res.json.data.documentType).toBe("INCOME_CERTIFICATE");
    expect(res.json.data.description).toContain("Income Certificate");
  });

  test("5. Applicant can view issued deficiencies and submit clarification response", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /Sign in as APPLICANT/i }).click();
    await expect(page).toHaveURL(/\/applicant$/);

    // Navigate to applicant deficiencies page
    await page.goto("/applicant/applications/app_demo_nos_sub_001/deficiencies");
    await expect(page.getByTestId("applicant-deficiencies-page")).toBeVisible();
    await expect(page.getByText("Application Remediation & Deficiencies")).toBeVisible();

    // Check open deficiency card
    await expect(page.getByText(/Income Certificate/i).first()).toBeVisible();

    // Fetch open deficiency id via API
    const listRes = await page.evaluate(async () => {
      const r = await fetch("/api/applicant/applications/app_demo_nos_sub_001/deficiencies");
      return { status: r.status, json: await r.json() };
    });
    expect(listRes.status).toBe(200);
    expect(listRes.json.data.deficiencies.length).toBeGreaterThanOrEqual(1);

    const openDef = listRes.json.data.deficiencies.find((d: any) => d.status === "OPEN");
    expect(openDef).toBeDefined();

    // Respond to deficiency
    const respondRes = await page.evaluate(
      async ({ defId }) => {
        const r = await fetch(
          `/api/applicant/applications/app_demo_nos_sub_001/deficiencies/${defId}/respond`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              clarificationText:
                "Original certificate verified from issuing Tehsildar e-District portal.",
            }),
          }
        );
        return { status: r.status, json: await r.json() };
      },
      { defId: openDef.id }
    );

    expect(respondRes.status).toBe(200);
    expect(respondRes.json.success).toBe(true);
  });

  test("6. Officer can resolve deficiency with mandatory remark", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /Sign in as VERIFICATION_OFFICER/i }).click();
    await expect(page).toHaveURL(/\/officer/);

    // List deficiencies
    const listRes = await page.evaluate(async () => {
      const r = await fetch("/api/officer/applications/app_demo_nos_sub_001/deficiencies");
      return { status: r.status, json: await r.json() };
    });

    expect(listRes.status).toBe(200);
    const openDef = listRes.json.data.deficiencies.find((d: any) => d.status === "OPEN");

    if (openDef) {
      // Resolve deficiency
      const patchRes = await page.evaluate(
        async ({ defId }) => {
          const r = await fetch(`/api/officer/deficiencies/${defId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              status: "RESOLVED",
              resolutionRemark: "Applicant clarification verified with State e-District database.",
            }),
          });
          return { status: r.status, json: await r.json() };
        },
        { defId: openDef.id }
      );

      expect(patchRes.status).toBe(200);
      expect(patchRes.json.success).toBe(true);
      expect(patchRes.json.data.status).toBe("RESOLVED");
    }
  });
});
