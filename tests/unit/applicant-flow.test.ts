import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "@/server/db";
import { applicationRepository } from "@/server/repositories/application.repository";
import { applicantRepository } from "@/server/repositories/applicant.repository";
import { applicationService } from "@/server/services/application.service";
import {
  isFieldVisible,
  sanitizeHiddenFieldValues,
  validateApplicationFormData,
} from "@/server/domain/application/validators";
import {
  computeReadinessReport,
  resolveDocumentChecklist,
} from "@/server/domain/application/readiness";
import { buildExplainableCaseStatus } from "@/server/domain/application/explainable-status";
import { FormSchema, DocumentRequirementsSchema } from "@/server/domain/scheme/types";
import { AuthenticatedUser } from "@/server/auth/roles";
import {
  ApplicationStatus,
  CaseStage,
  CaseState,
  DocumentType,
  ResponsibleActor,
} from "@prisma/client";

describe("Phase 2E — Applicant Dynamic Flow & Engine Tests", () => {
  const applicantUser: AuthenticatedUser = {
    id: "usr_demo_applicant_001",
    email: "ramesh.meena@example.tribal.gov.in",
    name: "Ramesh Kumar Meena",
    role: "APPLICANT",
    isActive: true,
  };

  const otherApplicantUser: AuthenticatedUser = {
    id: "usr_other_applicant_999",
    email: "other.applicant@example.tribal.gov.in",
    name: "Other Applicant",
    role: "APPLICANT",
    isActive: true,
  };

  const sampleFormSchema: FormSchema = {
    version: "1.0",
    sections: [
      { id: "personal", title: "Personal Details", order: 1 },
      { id: "academic", title: "Academic Information", order: 2 },
    ],
    fields: [
      {
        id: "fullName",
        label: "Full Name",
        type: "text",
        validation: { required: true, minLength: 2 },
        sectionId: "personal",
        order: 1,
      },
      {
        id: "hasPriorFellowship",
        label: "Do you have prior fellowship?",
        type: "boolean",
        validation: { required: true },
        sectionId: "personal",
        order: 2,
      },
      {
        id: "priorFellowshipName",
        label: "Prior Fellowship Name",
        type: "text",
        validation: { required: true },
        conditionalVisibility: {
          dependsOnField: "hasPriorFellowship",
          showWhenValue: true,
        },
        sectionId: "personal",
        order: 3,
      },
      {
        id: "annualIncome",
        label: "Annual Income",
        type: "number",
        validation: { required: true, min: 0, max: 1000000 },
        sectionId: "academic",
        order: 1,
      },
      {
        id: "emailAddress",
        label: "Email Address",
        type: "email",
        validation: { required: false },
        sectionId: "academic",
        order: 2,
      },
      {
        id: "degreeLevel",
        label: "Degree Level",
        type: "select",
        validation: { required: true, allowedValues: ["Ph.D.", "M.Phil."] },
        sectionId: "academic",
        order: 3,
      },
    ],
  };

  const sampleDocRequirements: DocumentRequirementsSchema = {
    version: "1.0",
    requirements: [
      {
        id: "req_caste",
        documentType: "CASTE_CERTIFICATE",
        label: "ST Certificate",
        description: "Scheduled Tribe certificate",
        level: "MANDATORY",
        allowedMimeTypes: ["application/pdf"],
        maxFileSizeMb: 5,
      },
      {
        id: "req_prior_proof",
        documentType: "OTHER",
        label: "Prior Fellowship Proof",
        description: "Award letter of prior fellowship",
        level: "CONDITIONAL",
        condition: {
          fieldId: "hasPriorFellowship",
          triggerWhenValue: true,
        },
        allowedMimeTypes: ["application/pdf"],
        maxFileSizeMb: 5,
      },
    ],
  };

  // ==========================================
  // 1. CONDITIONAL VISIBILITY & SANITIZATION
  // ==========================================
  describe("1. Dynamic Field Visibility & Sanitization", () => {
    it("evaluates condition correctly when parent matches trigger", () => {
      const conditionalField = sampleFormSchema.fields.find((f) => f.id === "priorFellowshipName")!;
      expect(isFieldVisible(conditionalField, { hasPriorFellowship: true })).toBe(true);
      expect(isFieldVisible(conditionalField, { hasPriorFellowship: false })).toBe(false);
      expect(isFieldVisible(conditionalField, {})).toBe(false);
    });

    it("strips hidden fields from formData when condition is false", () => {
      const rawData = {
        fullName: "Ramesh Meena",
        hasPriorFellowship: false,
        priorFellowshipName: "UGC NET JRF", // should be stripped because hasPriorFellowship is false
        annualIncome: 300000,
      };

      const sanitized = sanitizeHiddenFieldValues(sampleFormSchema, rawData);
      expect(sanitized.fullName).toBe("Ramesh Meena");
      expect(sanitized.hasPriorFellowship).toBe(false);
      expect(sanitized.priorFellowshipName).toBeUndefined();
      expect(sanitized.annualIncome).toBe(300000);
    });
  });

  // ==========================================
  // 2. TWO-PASS DYNAMIC VALIDATION
  // ==========================================
  describe("2. Server-Side Dynamic Form Validation", () => {
    it("passes validation when all visible required fields are valid", () => {
      const validData = {
        fullName: "Ramesh Kumar Meena",
        hasPriorFellowship: false,
        annualIncome: 450000,
        degreeLevel: "Ph.D.",
      };

      const result = validateApplicationFormData(sampleFormSchema, validData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("requires conditional field only when it is visible", () => {
      // Visible but missing
      const invalidData = {
        fullName: "Ramesh Kumar Meena",
        hasPriorFellowship: true,
        annualIncome: 450000,
        degreeLevel: "Ph.D.",
      };

      const result = validateApplicationFormData(sampleFormSchema, invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.fieldId === "priorFellowshipName")).toBe(true);

      // Visible and provided
      const fixedData = {
        ...invalidData,
        priorFellowshipName: "CSIR JRF",
      };
      const validResult = validateApplicationFormData(sampleFormSchema, fixedData);
      expect(validResult.isValid).toBe(true);
    });

    it("rejects invalid email, out of bounds numeric value, and unallowed select options", () => {
      const badData = {
        fullName: "R", // minLength 2
        hasPriorFellowship: false,
        annualIncome: 2000000, // max 1,000,000
        emailAddress: "not-an-email",
        degreeLevel: "Bachelor", // not in Ph.D. / M.Phil.
      };

      const result = validateApplicationFormData(sampleFormSchema, badData);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(4);
    });
  });

  // ==========================================
  // 3. READINESS REPORT & CHECKLIST ENGINE
  // ==========================================
  describe("3. Readiness Engine & Document Checklist Resolution", () => {
    it("resolves conditional document requirement based on form data", () => {
      // Case A: prior fellowship is false -> OTHER requirement is not required
      const checklistA = resolveDocumentChecklist(sampleDocRequirements, {
        hasPriorFellowship: false,
      });
      const conditionalReqA = checklistA.find((c) => c.documentType === "OTHER")!;
      expect(conditionalReqA.isRequired).toBe(false);

      // Case B: prior fellowship is true -> OTHER requirement becomes required
      const checklistB = resolveDocumentChecklist(sampleDocRequirements, {
        hasPriorFellowship: true,
      });
      const conditionalReqB = checklistB.find((c) => c.documentType === "OTHER")!;
      expect(conditionalReqB.isRequired).toBe(true);
    });

    it("calculates overall readiness as READY only when form, documents, and window are complete", () => {
      const validFormData = {
        fullName: "Ramesh Meena",
        hasPriorFellowship: false,
        annualIncome: 400000,
        degreeLevel: "Ph.D.",
      };

      // 1. Missing document -> INCOMPLETE / ACTION_REQUIRED
      const report1 = computeReadinessReport(
        sampleFormSchema,
        sampleDocRequirements,
        validFormData,
        [],
        { applicationOpenDate: null, applicationDeadline: null }
      );
      expect(report1.canSubmit).toBe(false);
      expect(report1.formReadiness.status).toBe("COMPLETE");
      expect(report1.documentReadiness.status).toBe("INCOMPLETE");

      // 2. Uploaded document present -> READY
      const mockDoc = {
        id: "doc_1",
        caseDossierId: "case_1",
        documentType: "CASTE_CERTIFICATE" as DocumentType,
        originalFilename: "caste.pdf",
        storagePath: "case_1/CASTE_CERTIFICATE/caste.pdf",
        mimeType: "application/pdf",
        fileSizeBytes: 1024,
        version: 1,
        isLatestVersion: true,
        processingStatus: "PENDING" as const,
        uploadedAt: new Date().toISOString(),
        previewUrl: "/api/documents/preview/caste.pdf",
      };

      const report2 = computeReadinessReport(
        sampleFormSchema,
        sampleDocRequirements,
        validFormData,
        [mockDoc],
        { applicationOpenDate: null, applicationDeadline: null }
      );
      expect(report2.overallStatus).toBe("READY");
      expect(report2.canSubmit).toBe(true);
      expect(report2.documentReadiness.status).toBe("COMPLETE");
    });
  });

  // ==========================================
  // 4. APPLICATION REPOSITORY & EARLY CASEDOSSIER
  // ==========================================
  describe("4. Application Repository & Early CaseDossier Creation", () => {
    it("generates sequential application and case numbers", async () => {
      const appNo = await applicationRepository.generateApplicationNumber("NFST");
      const caseNo = await applicationRepository.generateCaseNumber("NFST");

      expect(appNo).toMatch(/^APP-NFST-\d{4}-\d{6}$/);
      expect(caseNo).toMatch(/^CASE-NFST-\d{4}-\d{6}$/);
    });

    it("creates draft application with early CaseDossier in DRAFT stage", async () => {
      const activeNFST = await prisma.schemeVersion.findFirst({
        where: { scheme: { code: "NFST" }, isActive: true },
      });
      const profile = await prisma.applicantProfile.findUnique({
        where: { userId: applicantUser.id },
      });

      expect(activeNFST).not.toBeNull();
      expect(profile).not.toBeNull();

      // Query seeded NFST draft
      const draft = await applicationRepository.findByProfileAndVersion(
        profile!.id,
        activeNFST!.id
      );

      expect(draft).not.toBeNull();
      expect(draft?.status).toBe(ApplicationStatus.DRAFT);
      expect(draft?.caseDossier?.currentStage).toBe(CaseStage.DRAFT);
      expect(draft?.caseDossier?.currentState).toBe(CaseState.PENDING);
      expect(draft?.caseDossier?.responsibleActor).toBe(ResponsibleActor.APPLICANT);
      expect(draft?.caseDossier?.nextAction).toBe(
        "Complete the application form and upload required documents."
      );
    });
  });

  // ==========================================
  // 5. APPLICATION SERVICE & SECURITY/IDOR
  // ==========================================
  describe("5. Application Service & Server-Authoritative Ownership", () => {
    it("prevents Applicant A from reading or modifying Applicant B's application", async () => {
      const apps = await applicationRepository.listByUserId(applicantUser.id);
      expect(apps.length).toBeGreaterThan(0);
      const appToTest = apps[0];

      // Other applicant attempts to read appToTest
      await expect(
        applicationService.getApplicationDetail(appToTest.id, otherApplicantUser)
      ).rejects.toThrow(/Forbidden/);

      // Other applicant attempts to save draft
      await expect(
        applicationService.saveDraft(appToTest.id, { test: 123 }, otherApplicantUser)
      ).rejects.toThrow(/Forbidden/);

      // Other applicant attempts to submit
      await expect(
        applicationService.submitApplication(appToTest.id, otherApplicantUser)
      ).rejects.toThrow(/Forbidden/);
    });

    it("rejects submission if mandatory documents are missing", async () => {
      const nfstApp = await prisma.application.findFirst({
        where: { submittedById: applicantUser.id, status: "DRAFT" },
      });

      if (nfstApp) {
        // Attempt submit on draft with missing docs
        await expect(
          applicationService.submitApplication(nfstApp.id, applicantUser)
        ).rejects.toThrow(/Mandatory documents are missing|Form validation failed/);
      }
    });

    it("prevents withdrawal after stage has advanced beyond SUBMITTED", async () => {
      const seededApp = await prisma.application.findFirst({
        where: { submittedById: applicantUser.id, status: "SUBMITTED" },
        include: { caseDossier: true },
      });

      if (seededApp && seededApp.caseDossier) {
        // Temporarily mutate stage to OFFICER_REVIEW to test boundary
        await prisma.caseDossier.update({
          where: { id: seededApp.caseDossier.id },
          data: { currentStage: "OFFICER_REVIEW" },
        });

        await expect(
          applicationService.withdrawApplication(seededApp.id, applicantUser)
        ).rejects.toThrow(/Withdrawal is not permitted once verification has commenced/);

        // Restore back to SUBMITTED
        await prisma.caseDossier.update({
          where: { id: seededApp.caseDossier.id },
          data: { currentStage: "SUBMITTED" },
        });
      }
    });
  });

  // ==========================================
  // 6. EXPLAINABLE CASE STATUS
  // ==========================================
  describe("6. Explainable Case Status 5-Part Model", () => {
    it("builds explainable status for DRAFT and SUBMITTED applications", async () => {
      const apps = await applicationRepository.listByUserId(applicantUser.id);
      for (const app of apps) {
        const status = buildExplainableCaseStatus(app);
        expect(status.applicationId).toBe(app.id);
        expect(status.stage).toBeDefined();
        expect(status.stageLabel).toBeDefined();
        expect(status.state).toBeDefined();
        expect(status.stateLabel).toBeDefined();
        expect(status.responsibleActor).toBeDefined();
        expect(status.responsibleActorLabel).toBeDefined();
        expect(status.nextAction).toBeDefined();
      }
    });
  });
});
