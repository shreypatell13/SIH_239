import { test, expect } from "@playwright/test";

test.describe("Public Foundation Route Accessibility Tests", () => {
  test("home page renders hero and portal links", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("main h2")).toContainText("TribalScholar AI");
    await expect(page.getByRole("heading", { name: "Applicant Portal" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Officer Case Workspace" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Scheme Studio" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Operations Control Tower" })).toBeVisible();
  });

  test("login page renders credentials form and demo personas", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Sign In to TribalScholar AI" })).toBeVisible();
    await expect(page.getByText("Credentials Login")).toBeVisible();
    await expect(page.getByText("Ramesh Kumar Meena")).toBeVisible();
  });

  test("health api returns healthy or degraded with valid json", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.service).toBe("TribalScholar AI API");
  });

  test("version api returns phase metadata", async ({ request }) => {
    const response = await request.get("/api/version");
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.phase).toBeDefined();
  });
});
