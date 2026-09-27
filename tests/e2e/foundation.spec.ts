import { test, expect } from "@playwright/test";

test.describe("Foundation Route Accessibility Tests", () => {
  test("home page renders hero and portal links", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h2")).toContainText("TribalScholar AI");
    await expect(page.getByText("Applicant Portal")).toBeVisible();
    await expect(page.getByText("Officer Case Workspace")).toBeVisible();
    await expect(page.getByText("Scheme Studio")).toBeVisible();
    await expect(page.getByText("Operations Control Tower")).toBeVisible();
  });

  test("applicant route loads explainable status card", async ({ page }) => {
    await page.goto("/applicant");
    await expect(page.locator("h1")).toContainText("Applicant Portal");
    await expect(page.getByText("Explainable Case Status Model")).toBeVisible();
  });

  test("health api returns healthy or degraded with valid json", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.service).toBe("TribalScholar AI API");
  });

  test("version api returns phase 2a metadata", async ({ request }) => {
    const response = await request.get("/api/version");
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.phase).toContain("Phase 2A");
  });
});
