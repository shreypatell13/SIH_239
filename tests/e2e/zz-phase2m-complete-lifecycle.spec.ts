import { expect, Page, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const applicantId = "app_demo_nfst_draft_001";
const scholarId = "psr_demo_nos_001";
const renewalId = "ren_demo_nos_002";
const disbursementId = "disb_demo_nos_002";

async function signInAs(page: Page, role: string) {
  await page.context().clearCookies();
  await page.goto("/login");
  await page.getByRole("button", { name: new RegExp(`Sign in as ${role}`, "i") }).click();
  const expectedRoute =
    role === "APPLICANT"
      ? /\/applicant(?:$|\/)/
      : role === "OPERATIONS_DIRECTOR"
        ? /\/management/
        : /\/officer/;
  await expect(page).toHaveURL(expectedRoute, { timeout: 15000 });
}

async function api(
  page: Page,
  url: string,
  method = "GET",
  data?: Record<string, unknown>,
  headers?: Record<string, string>
) {
  return page.evaluate(
    async ({ url, method, data, headers }) => {
      const response = await fetch(url, {
        method,
        headers: data ? { "Content-Type": "application/json", ...headers } : headers,
        body: data ? JSON.stringify(data) : undefined,
      });
      return { status: response.status, json: await response.json() };
    },
    { url, method, data, headers }
  );
}

test.describe("Phase 2M connected lifecycle and final demo rehearsal", () => {
  test.describe.configure({ mode: "serial" });

  test("connected applicant journey reaches an audited officer decision and management review", async ({
    page,
  }) => {
    const startedAt = Date.now();
    await signInAs(page, "APPLICANT");
    await expect(page).toHaveURL(/\/applicant$/);

    // Start at scheme selection and follow the active scheme into its dynamic form.
    await page.goto("/applicant/schemes");
    await page
      .getByRole("link", { name: /Check Eligibility & Apply/i })
      .first()
      .click();
    await expect(page.getByTestId("scheme-detail-NFST")).toBeVisible();
    await page.getByRole("radio").nth(0).check();
    await page.getByRole("radio").nth(2).check();
    await page.getByRole("radio").nth(4).check();
    await page.getByRole("link", { name: /Start NFST Application/i }).click();
    await expect(page).toHaveURL(new RegExp(`/applicant/applications/${applicantId}$`));
    await expect(page.getByTestId("form-section-personal")).toBeVisible();

    // Complete the persisted dynamic form section by section.
    await page.locator("#fullName").fill("Ramesh Kumar Meena");
    await page.locator("#dateOfBirth").fill("1998-05-15");
    await page.locator("#gender").selectOption("Male");
    await page.locator("#stateDomicile").fill("Example State");
    await page.locator("#casteCategory").selectOption("ST");
    await page.getByRole("button", { name: /Save & Next Section/i }).click();
    await expect(page.getByTestId("form-section-academic")).toBeVisible();
    await page.locator("#degreeType").selectOption("Ph.D.");
    await page.locator("#universityName").fill("Example Research University");
    await page.locator("#enrollmentNumber").fill("DEMO-NFST-2026-01");
    await page.locator("#supervisorName").fill("Dr. Example Mentor");
    await page.locator("#researchTopic").fill("Synthetic watershed data research demonstration");
    await page.locator("#academicPercentage").fill("74.28");
    await page.getByRole("button", { name: /Save & Next Section/i }).click();
    await expect(page.getByTestId("form-section-financial")).toBeVisible();
    await page.locator("#annualFamilyIncome").fill("450000");
    await page.getByRole("button", { name: /Save & Next Section/i }).click();
    await expect(page.getByTestId("form-section-declaration")).toBeVisible();
    await page.locator('input[name="selfDeclaration"]').first().check();
    await page.getByRole("button", { name: /Proceed to Document Checklist/i }).click();
    await expect(page.getByTestId("application-documents-page")).toBeVisible();

    const requiredDocuments = [
      ["CASTE_CERTIFICATE", "demo-st-caste-certificate.pdf"],
      ["DEGREE_TRANSCRIPT", "demo-degree-transcript.pdf"],
      ["ADMISSION_OFFER_LETTER", "demo-admission-offer.pdf"],
      ["RESEARCH_PROPOSAL", "demo-research-proposal.pdf"],
    ];
    for (const [documentType, fixture] of requiredDocuments) {
      const card = page.getByTestId(`document-card-${documentType}`);
      await card
        .locator('input[type="file"]')
        .setInputFiles(path.join(process.cwd(), "tests/fixtures/documents", fixture));
      await expect(card.getByText(/Uploaded \(v1\)/)).toBeVisible({ timeout: 15000 });
    }

    const submittedCase = await api(page, `/api/applicant/applications/${applicantId}`);
    expect(submittedCase.status).toBe(200);
    const caseId = submittedCase.json.data.caseDossier.id as string;
    const checklist = await api(page, `/api/applicant/applications/${applicantId}/documents`);
    expect(checklist.status).toBe(200);
    const transcript = checklist.json.data.find(
      (document: { documentType: string }) => document.documentType === "DEGREE_TRANSCRIPT"
    );
    expect(transcript?.uploadedDocument?.id).toBeTruthy();

    await page.getByRole("button", { name: /Proceed to Readiness Review/i }).click();
    await expect(
      page.getByRole("heading", { name: /Application Ready for Submission/i })
    ).toBeVisible();
    const readiness = await api(page, `/api/applicant/applications/${applicantId}/readiness`);
    expect(readiness.json.data.canSubmit).toBe(true);
    await page.getByRole("button", { name: /Final Submit Application/i }).click();
    await expect(page).toHaveURL(new RegExp(`/applicant/applications/${applicantId}/status`));

    // Submission creates jobs that the configured internal sweep consumes.
    const sweepSecret = process.env.INTERNAL_SWEEP_SECRET || "phase2m-local-e2e-only-secret";
    const sweep = await api(
      page,
      "/api/internal/ocr-sweep",
      "POST",
      { batchSize: 10 },
      { "x-internal-sweep-secret": sweepSecret }
    );
    expect(sweep.status).toBe(200);
    expect(sweep.json.data.processedJobs).toBeGreaterThanOrEqual(3);

    await signInAs(page, "VERIFICATION_OFFICER");
    await expect(page).toHaveURL(/\/officer/);
    await page.goto(`/officer/cases/${caseId}`);
    await expect(
      page.getByRole("heading", { name: /Application Form Payload \(NFST v1\)/i })
    ).toBeVisible();
    const claim = await api(page, `/api/officer/cases/${caseId}/claim`, "POST");
    expect(claim.status).toBe(200);

    const extraction = await api(
      page,
      `/api/officer/documents/${transcript.uploadedDocument.id}/extraction`
    );
    expect(extraction.status).toBe(200);
    expect(extraction.json.data.processingStatus).toBe("COMPLETED");
    expect(extraction.json.data.extractedFields.length).toBeGreaterThan(0);

    const evaluation = await api(page, `/api/officer/applications/${applicantId}/evaluate`, "POST");
    expect(evaluation.status).toBe(200);
    expect(evaluation.json.success).toBe(true);
    const reviewTransition = await api(page, `/api/officer/cases/${caseId}/transition`, "POST", {
      targetStage: "OFFICER_REVIEW",
      remark: "Reviewed submitted application and extracted synthetic transcript evidence.",
    });
    expect(reviewTransition.status).toBe(200);

    const issued = await api(
      page,
      `/api/officer/applications/${applicantId}/deficiencies`,
      "POST",
      {
        deficiencyType: "DOCUMENT_ILLEGIBLE",
        documentType: "DEGREE_TRANSCRIPT",
        targetDocumentId: transcript.uploadedDocument.id,
        description: "Please replace the transcript with a clear synthetic copy for verification.",
      }
    );
    expect(issued.status).toBe(201);
    const deficiencyId = issued.json.data.id as string;
    expect(issued.json.data.status).toBe("OPEN");

    await signInAs(page, "APPLICANT");
    await page.goto(`/applicant/applications/${applicantId}/deficiencies`);
    await expect(page.getByText(/clear synthetic copy/i)).toBeVisible();
    await page.getByRole("button", { name: /Upload Replacement Document/i }).click();
    await page
      .locator('input[type="file"]')
      .setInputFiles(
        path.join(process.cwd(), "tests/fixtures/documents/demo-degree-transcript.pdf")
      );
    await page
      .getByPlaceholder(/Enter your explanation, clarification/i)
      .fill("Uploading the readable synthetic transcript fixture for recheck.");
    await page.getByRole("button", { name: /Submit Response & Recheck/i }).click();
    await expect(page.getByText("No Open Deficiencies")).toBeVisible({ timeout: 30000 });

    const corrected = await api(page, `/api/applicant/applications/${applicantId}/deficiencies`);
    const correctedDeficiency = corrected.json.data.deficiencies.find(
      (item: { id: string }) => item.id === deficiencyId
    );
    expect(correctedDeficiency.status).toBe("RESOLVED");
    expect(correctedDeficiency.recheckStatus).toBe("RECHECKED_PASS");

    await signInAs(page, "VERIFICATION_OFFICER");
    await page.goto(`/officer/cases/${caseId}`);
    await expect(
      page.getByRole("heading", { name: /Application Form Payload \(NFST v1\)/i })
    ).toBeVisible();
    const decision = await api(page, `/api/officer/cases/${caseId}/transition`, "POST", {
      targetStage: "COMMITTEE_SELECTION",
      remark: "Final officer review complete; recommend the verified case for committee selection.",
    });
    expect(decision.status).toBe(200);
    expect(decision.json.data.currentStage).toBe("COMMITTEE_SELECTION");
    const timeline = await api(page, `/api/officer/cases/${caseId}/timeline`);
    const actions = timeline.json.data.timeline.map(
      (event: { actionType: string }) => event.actionType
    );
    expect(actions).toContain("DEFICIENCY_ISSUED");
    expect(actions).toContain("DEFICIENCY_APPLICANT_RESPONSE_SUBMITTED");
    expect(actions).toContain("DEFICIENCY_RESOLVED");

    // Continue the same rehearsal through management analytics and mock status.
    await signInAs(page, "OPERATIONS_DIRECTOR");
    await expect(page).toHaveURL(/\/management/);
    await expect(page.getByRole("heading", { name: /Operations Control Tower/i })).toBeVisible();
    await expect(page.getByTestId("kpi-card-all-cases")).toBeVisible();
    await expect(page.getByText("Government Integration Adapters")).toBeVisible();
    await expect(page.getByText("MOCK / SYNTHETIC").first()).toBeVisible();
    console.log(
      `[Phase 2M rehearsal] Applicant through management completed in ${((Date.now() - startedAt) / 1000).toFixed(1)} seconds.`
    );
  });

  test("connected seeded scholar renewal, officer approval, disbursement, and audit lifecycle", async ({
    page,
  }) => {
    await signInAs(page, "APPLICANT");
    await expect(page).toHaveURL(/\/applicant$/);

    await page.goto("/post-selection");
    await expect(page.getByTestId("post-selection-heading")).toBeVisible();
    await page.getByTestId("main-tab-scholars").click();
    await page.getByTestId(`view-scholar-btn-${scholarId}`).click();
    await expect(page.getByTestId("scholar-detail-workspace")).toBeVisible();
    await page.getByTestId("tab-renewals").click();
    await page
      .getByTestId(`renewal-card-${renewalId}`)
      .getByTestId(`scholar-submit-renewal-btn-${renewalId}`)
      .click();

    await page
      .getByTestId("progress-summary-input")
      .fill(
        "Completed the synthetic second-year research milestones and submitted the annual progress report."
      );
    await page.getByTestId("publications-count-input").fill("1");
    await page.getByTestId("conferences-count-input").fill("1");
    await page.getByTestId("supervisor-recommendation-select").selectOption("RECOMMENDED");
    await page
      .getByTestId("supervisor-remarks-input")
      .fill("Synthetic supervisor recommends continuation.");
    await page.getByTestId("confirm-submit-renewal-btn").click();
    const submittedScholar = await api(page, `/api/post-selection/scholars/${scholarId}`);
    expect(submittedScholar.status).toBe(200);
    expect(
      submittedScholar.json.data.renewals.find(
        (renewal: { id: string }) => renewal.id === renewalId
      ).status
    ).toBe("SUBMITTED");

    await signInAs(page, "VERIFICATION_OFFICER");
    await page.goto(`/post-selection/${scholarId}`);
    await expect(page.getByTestId("scholar-detail-workspace")).toBeVisible();
    await page.getByTestId("tab-renewals").click();
    await page.getByTestId(`officer-review-renewal-btn-${renewalId}`).click();
    await page.getByTestId("decision-approve-btn").click();
    await page
      .getByTestId("officer-remarks-input")
      .fill(
        "Officer reviewed the connected synthetic progress submission and approves continuation."
      );
    await page.getByTestId("confirm-review-renewal-btn").click();
    await page.getByTestId("tab-renewals").click();
    await expect(page.getByTestId(`renewal-card-${renewalId}`).getByText("APPROVED")).toBeVisible();

    await page.getByTestId("tab-disbursements").click();
    await page.getByTestId(`edit-disbursement-btn-${disbursementId}`).click();
    await page.getByTestId("disbursement-status-select").selectOption("PAID");
    await page.getByTestId("pfms-reference-input").fill("DEMO-PFMS-2026-CYCLE2");
    await page
      .getByTestId("disbursement-remarks-input")
      .fill("Synthetic demo installment marked paid after officer-approved renewal.");
    await page.getByTestId("confirm-update-disbursement-btn").click();
    await page.reload();
    await expect(page.getByTestId("scholar-detail-workspace")).toBeVisible();

    const scholar = await api(page, `/api/post-selection/scholars/${scholarId}`);
    expect(scholar.status).toBe(200);
    expect(
      scholar.json.data.renewals.find((renewal: { id: string }) => renewal.id === renewalId).status
    ).toBe("APPROVED");
    expect(
      scholar.json.data.disbursements.find((item: { id: string }) => item.id === disbursementId)
        .status
    ).toBe("PAID");
    const auditActions = scholar.json.data.auditLogs.map(
      (event: { actionType: string }) => event.actionType
    );
    expect(auditActions).toContain("RENEWAL_APPROVE");
    expect(auditActions).toContain("DISBURSEMENT_STATUS_UPDATED");

    await page.getByTestId("tab-audit").click();
    await expect(page.getByText("RENEWAL_APPROVE").first()).toBeVisible();
    await expect(page.getByText("DISBURSEMENT_STATUS_UPDATED").first()).toBeVisible();
  });
});
