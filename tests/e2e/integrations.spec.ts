import { test, expect } from "@playwright/test";

test.describe("Phase 2L — Integration Adapters & Security Hardening E2E", () => {
  test("1. Integration Health API rejects unauthenticated requests (401)", async ({ request }) => {
    const res = await request.get("/api/integrations/health");
    expect(res.status()).toBe(401);
  });

  test("2. Security headers are present on responses", async ({ request }) => {
    const res = await request.get("/login");
    const headers = res.headers();

    expect(headers["x-frame-options"]).toBe("SAMEORIGIN");
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["permissions-policy"]).toContain("camera=()");
  });

  test("3. Operations Director sees Integration Status Card in Control Tower", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /Sign in as OPERATIONS_DIRECTOR/i }).click();
    await page.waitForURL("/management");

    await expect(page.getByText("Government Integration Adapters")).toBeVisible();
    await expect(page.getByText("Sandboxed / Synthetic")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /DigiLocker National Document/i })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /Public Financial Management System/i })
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: /National Scholarship Portal/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Ministry of Tribal Affairs/i })).toBeVisible();
  });
});
