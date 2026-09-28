import { test, expect } from "@playwright/test";

test.describe("Phase 2E — Applicant Dynamic Journey & E2E Flow", () => {
  test.beforeEach(async ({ page }) => {
    // 1. Authenticate via Quick Demo Persona Login as APPLICANT
    await page.goto("/login");
    await page.getByRole("button", { name: /Sign in as APPLICANT/i }).click();

    // Wait for redirect to applicant portal
    await expect(page).toHaveURL(/\/applicant$/, { timeout: 15000 });
    await expect(page.getByRole("heading", { name: "Applicant Portal" })).toBeVisible();
  });

  test("1. Dashboard renders seeded applications and active schemes", async ({ page }) => {
    await page.goto("/applicant");
    await expect(page.getByRole("heading", { name: "Applicant Portal" })).toBeVisible();

    // Check my applications section
    await expect(page.getByText("My Scholarship Applications")).toBeVisible();
    await expect(page.getByTestId("app-card-NFST")).toBeVisible();
    await expect(page.getByTestId("app-card-NOS")).toBeVisible();

    // Check active schemes section
    await expect(page.getByRole("heading", { name: "Active Ministry Schemes" })).toBeVisible();
  });

  test("2. Candidate profile view and update", async ({ page }) => {
    await page.goto("/applicant/profile");
    await expect(page.getByRole("heading", { name: "Candidate Profile" })).toBeVisible();

    // Fill profile fields
    const domicileInput = page.locator("#stateDomicile");
    await domicileInput.fill("Rajasthan");

    const qualificationInput = page.locator("#academicQualification");
    await qualificationInput.fill("Master of Science (Physics)");

    // Save profile
    const saveBtn = page.getByRole("button", { name: /Save Candidate Profile/i });
    await saveBtn.click();

    // Verify success feedback
    await expect(page.getByText("Profile details updated successfully!")).toBeVisible({
      timeout: 10000,
    });
  });

  test("3. Scheme explorer, guidelines, and pre-screener", async ({ page }) => {
    await page.goto("/applicant/schemes");
    await expect(page.getByRole("heading", { name: "Scholarship Scheme Explorer" })).toBeVisible();

    // Click NFST scheme details
    const checkEligibilityBtn = page
      .getByRole("link", { name: /Check Eligibility & Apply/i })
      .first();
    await checkEligibilityBtn.click();

    // Verify Scheme Detail Page & 3-Question Pre-Screener
    await expect(page).toHaveURL(/\/applicant\/schemes\/NFST/);
    await expect(
      page.getByRole("heading", { name: "Scheme Guidelines & Pre-Screener" })
    ).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("3-Question Eligibility Pre-Screener")).toBeVisible();

    // Fill Pre-screener answers
    const radios = page.locator('input[type="radio"]');
    await radios.nth(0).check(); // Q1: Yes
    await radios.nth(2).check(); // Q2: Yes
    await radios.nth(4).check(); // Q3: Yes

    // Verify eligibility confirmation badge
    await expect(
      page.getByText("You appear eligible based on preliminary self-assessment!")
    ).toBeVisible();
  });

  test("4. Dynamic form wizard, auto-save, and document checklist navigation", async ({ page }) => {
    // Navigate to seeded NFST draft application
    await page.goto("/applicant");
    const resumeBtn = page.getByRole("link", { name: /Resume Application/i }).first();
    await resumeBtn.click();

    // Verify Application Form Wizard loaded
    await expect(page).toHaveURL(/\/applicant\/applications\//);
    await expect(page.getByRole("heading", { name: "Application Form" })).toBeVisible({
      timeout: 10000,
    });

    // Fill form fields
    const fullNameInput = page.locator("#fullName");
    await fullNameInput.fill("Ramesh Kumar Meena");

    // Click manual Save Progress
    const saveProgressBtn = page.getByRole("button", { name: /Save Progress/i });
    await saveProgressBtn.click();
    await expect(page.getByText(/Draft saved/i)).toBeVisible({ timeout: 10000 });

    // Navigate to Next Section
    const nextBtn = page.getByRole("button", { name: /Save & Next Section/i });
    await nextBtn.click();

    // Navigate directly to Document Checklist
    const docChecklistLink = page.getByRole("link", { name: /Document Checklist/i });
    await docChecklistLink.click();

    await expect(page).toHaveURL(/\/documents/);
    await expect(page.getByRole("heading", { name: "Document Checklist" })).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByTestId("document-card-CASTE_CERTIFICATE")).toBeVisible();
    await expect(page.getByTestId("document-card-DEGREE_TRANSCRIPT")).toBeVisible();
  });

  test("5. Explainable Case Status tracking for submitted NOS application", async ({ page }) => {
    await page.goto("/applicant");

    // Find Live Status button for NOS
    const liveStatusBtn = page.getByRole("link", { name: /View Live Status/i }).first();
    await liveStatusBtn.click();

    await expect(page).toHaveURL(/\/status/);
    await expect(page.getByRole("heading", { name: "Explainable Case Status" })).toBeVisible({
      timeout: 10000,
    });

    // Verify 5-part model components are rendered
    await expect(page.getByText("1. Current Stage")).toBeVisible();
    await expect(page.getByText("2. Lifecycle State")).toBeVisible();
    await expect(page.getByText("3. Active Blocker")).toBeVisible();
    await expect(page.getByText("4. Responsible Actor")).toBeVisible();
    await expect(page.getByText("5. Next Concrete Action")).toBeVisible();
    await expect(
      page.getByText(/Automated|verification|eligibility|deficiency|review|action|recheck/i).first()
    ).toBeVisible();
  });
});
