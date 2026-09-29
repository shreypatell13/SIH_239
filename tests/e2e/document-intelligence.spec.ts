import { test, expect } from "@playwright/test";

test.describe("Phase 2F — Document Intelligence & Multilingual OCR Pipeline E2E", () => {
  test("1. Officer extraction endpoint rejects unauthenticated request (401)", async ({
    request,
  }) => {
    const res = await request.get("/api/officer/documents/doc_demo_nos_caste_001/extraction");
    expect(res.status()).toBe(401);

    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error?.code).toBe("UNAUTHORIZED");
  });

  test("2. Applicant can poll own application processing status", async ({ page }) => {
    // 1. Sign in as demo applicant
    await page.goto("/login");
    await page.getByRole("button", { name: /Sign in as APPLICANT/i }).click();
    await expect(page).toHaveURL(/\/applicant$/);
    await expect(page.getByRole("heading", { name: "Applicant Portal" })).toBeVisible();

    // 2. Fetch processing status for seeded NOS application inside authenticated browser context
    const res = await page.evaluate(async () => {
      const r = await fetch("/api/applicant/applications/app_demo_nos_sub_001/processing-status");
      return { status: r.status, json: await r.json() };
    });

    expect(res.status).toBe(200);
    expect(res.json.success).toBe(true);
    expect(res.json.data.applicationId).toBe("app_demo_nos_sub_001");
    expect(Array.isArray(res.json.data.documents)).toBe(true);
    expect(res.json.data.documents.length).toBeGreaterThan(0);
  });

  test("3. Processing status response shape is correct and does not expose raw extracted PII", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /Sign in as APPLICANT/i }).click();
    await expect(page).toHaveURL(/\/applicant$/);
    await expect(page.getByRole("heading", { name: "Applicant Portal" })).toBeVisible();

    const res = await page.evaluate(async () => {
      const r = await fetch("/api/applicant/applications/app_demo_nos_sub_001/processing-status");
      return { status: r.status, json: await r.json() };
    });

    expect(res.status).toBe(200);
    const doc = res.json.data.documents[0];
    expect(doc).toHaveProperty("documentId");
    expect(doc).toHaveProperty("documentType");
    expect(doc).toHaveProperty("processingStatus");
    expect(doc).toHaveProperty("classifiedAs");
    expect(doc).toHaveProperty("classificationConfidence");
    expect(doc).toHaveProperty("requiresReview");
    expect(doc).toHaveProperty("fieldCount");

    // Ensure raw extracted text / bounding box PII is NOT in applicant status response
    expect(doc).not.toHaveProperty("extractedFields");
    expect(doc).not.toHaveProperty("rawValue");
  });

  test("4. Seed/demo documents have COMPLETED processing status", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /Sign in as APPLICANT/i }).click();
    await expect(page).toHaveURL(/\/applicant$/);
    await expect(page.getByRole("heading", { name: "Applicant Portal" })).toBeVisible();

    const res = await page.evaluate(async () => {
      const r = await fetch("/api/applicant/applications/app_demo_nos_sub_001/processing-status");
      return { status: r.status, json: await r.json() };
    });

    expect(res.status).toBe(200);
    expect(res.json.data.allProcessed).toBe(true);
    const casteDoc = res.json.data.documents.find(
      (d: { documentType: string }) => d.documentType === "CASTE_CERTIFICATE"
    );
    expect(casteDoc).toBeDefined();
    expect(casteDoc.processingStatus).toBe("COMPLETED");
    expect(casteDoc.classifiedAs).toBe("CASTE_CERTIFICATE");
  });

  test("5. Officer classification correction updates classifiedAs", async ({ page }) => {
    // 1. Sign in as verification officer
    await page.goto("/login");
    await page.getByRole("button", { name: /Sign in as VERIFICATION_OFFICER/i }).click();
    await expect(page).toHaveURL(/\/officer/);
    await expect(page.getByRole("heading", { name: "Officer Case Workspace" })).toBeVisible();

    // 2. Call PATCH classification endpoint in authenticated officer context
    const res = await page.evaluate(async () => {
      const r = await fetch("/api/officer/documents/doc_demo_nos_caste_001/classification", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          correctedType: "CASTE_CERTIFICATE",
        }),
      });
      return { status: r.status, json: await r.json() };
    });

    expect(res.status).toBe(200);
    expect(res.json.success).toBe(true);
    expect(res.json.data.classifiedAs).toBe("CASTE_CERTIFICATE");
  });

  test("6. Applicant role receives 403 when accessing officer extraction endpoint", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /Sign in as APPLICANT/i }).click();
    await expect(page).toHaveURL(/\/applicant$/);
    await expect(page.getByRole("heading", { name: "Applicant Portal" })).toBeVisible();

    const res = await page.evaluate(async () => {
      const r = await fetch("/api/officer/documents/doc_demo_nos_caste_001/extraction");
      return { status: r.status, json: await r.json() };
    });

    expect(res.status).toBe(403);
  });

  test("7. Applicant can preview a seeded synthetic document through the protected storage route", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /Sign in as APPLICANT/i }).click();
    await expect(page).toHaveURL(/\/applicant$/);

    const preview = await page.evaluate(async () => {
      const response = await fetch(
        "/api/documents/preview/case_demo_nos_001/CASTE_CERTIFICATE/sample_caste.pdf"
      );
      const bytes = new Uint8Array(await response.arrayBuffer());
      return {
        status: response.status,
        contentType: response.headers.get("content-type"),
        signature: String.fromCharCode(...bytes.slice(0, 5)),
      };
    });

    expect(preview.status).toBe(200);
    expect(preview.contentType).toBe("application/pdf");
    expect(preview.signature).toBe("%PDF-");
  });
});
