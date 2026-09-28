import { describe, it, expect, beforeEach } from "vitest";
import {
  generateDeficiencyExplanation,
  isValidDeficiencyTransition,
  calculateResponseDeadline,
  evaluateDeficiencyResolution,
} from "../../src/server/domain/deficiency";
import { deficiencyService } from "../../src/server/services/deficiency.service";
import { prisma } from "../../src/server/db";
import { UserRole } from "@prisma/client";
import { AuthenticatedUser } from "../../src/server/auth/roles";

describe("Phase 2H: Deficiency Management & Targeted Recheck Engine", () => {
  // =========================================================================
  // 1. PURE DOMAIN & EXPLAINABILITY GENERATOR TESTS
  // =========================================================================
  describe("1. Explainability & Title Generator", () => {
    it("generates clear, respectful explanation for DOCUMENT_ILLEGIBLE", () => {
      const expl = generateDeficiencyExplanation({
        deficiencyType: "DOCUMENT_ILLEGIBLE",
        documentType: "CASTE_CERTIFICATE",
      });

      expect(expl.title).toContain("Scheduled Tribe (ST) Certificate");
      expect(expl.title).toContain("Unclear / Illegible");
      expect(expl.description).toContain("clearly read");
      expect(expl.remedyAction).toBe("REPLACE_DOCUMENT");
    });

    it("generates clear explanation for DATA_MISMATCH without accusatory words", () => {
      const expl = generateDeficiencyExplanation({
        deficiencyType: "DATA_MISMATCH",
        documentType: "INCOME_CERTIFICATE",
        ruleDescription:
          "The annual income extracted from certificate (Rs. 3,50,000) differs from declared income (Rs. 2,50,000).",
      });

      expect(expl.title).toContain("Data Discrepancy");
      expect(expl.title).toContain("Income Certificate");
      expect(expl.description).toContain("3,50,000");
      expect(expl.description).not.toContain("fraud");
      expect(expl.description).not.toContain("fake");
      expect(expl.remedyAction).toBe("PROVIDE_CLARIFICATION");
    });

    it("generates clear explanation for DOCUMENT_EXPIRED", () => {
      const expl = generateDeficiencyExplanation({
        deficiencyType: "DOCUMENT_EXPIRED",
        documentType: "INCOME_CERTIFICATE",
      });

      expect(expl.title).toContain("Expired");
      expect(expl.title).toContain("Income Certificate");
      expect(expl.description).toContain("validity");
      expect(expl.remedyAction).toBe("REPLACE_DOCUMENT");
    });

    it("generates clear explanation for DOCUMENT_MISSING", () => {
      const expl = generateDeficiencyExplanation({
        deficiencyType: "DOCUMENT_MISSING",
        documentType: "PASSPORT",
      });

      expect(expl.title).toContain("Missing");
      expect(expl.title).toContain("Passport");
      expect(expl.remedyAction).toBe("UPLOAD_DOCUMENT");
    });

    it("handles generic custom details gracefully", () => {
      const expl = generateDeficiencyExplanation({
        deficiencyType: "CUSTOM",
        customDescription: "File appears corrupted or encrypted with password.",
      });

      expect(expl.title).toContain("Action Required");
      expect(expl.description).toContain("corrupted");
      expect(expl.remedyAction).toBe("PROVIDE_CLARIFICATION");
    });
  });

  // =========================================================================
  // 2. STATE MACHINE & POLICY TESTS
  // =========================================================================
  describe("2. State Machine & Policy Transitions", () => {
    it("allows valid forward transitions from OPEN to RESOLVED, WAIVED, or EXPIRED", () => {
      expect(isValidDeficiencyTransition("OPEN", "RESOLVED")).toBe(true);
      expect(isValidDeficiencyTransition("OPEN", "WAIVED")).toBe(true);
      expect(isValidDeficiencyTransition("OPEN", "EXPIRED")).toBe(true);
    });

    it("allows reopening from RESOLVED or WAIVED back to OPEN", () => {
      expect(isValidDeficiencyTransition("RESOLVED", "OPEN")).toBe(true);
      expect(isValidDeficiencyTransition("WAIVED", "OPEN")).toBe(true);
    });

    it("disallows invalid state transitions", () => {
      expect(isValidDeficiencyTransition("EXPIRED", "RESOLVED")).toBe(false);
      expect(isValidDeficiencyTransition("RESOLVED", "WAIVED")).toBe(false);
    });

    it("calculates SLA deadline correctly with default and custom workflow configs", () => {
      const now = new Date();
      const defaultDeadline = calculateResponseDeadline(null, now);
      const diffDaysDefault = Math.round(
        (defaultDeadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      expect(diffDaysDefault).toBe(14);

      const customDeadline = calculateResponseDeadline(
        { deficiencyResponseWindowDays: 7 } as any,
        now
      );
      const diffDaysCustom = Math.round(
        (customDeadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      expect(diffDaysCustom).toBe(7);
    });

    it("evaluates deterministic resolution correctly", () => {
      // Rule recheck pass resolves deficiency
      const resPass = evaluateDeficiencyResolution({
        documentStatus: "COMPLETED",
        hasPassingEvidence: true,
        ruleOutcome: "PASS",
      });
      expect(resPass.isResolved).toBe(true);
      expect(resPass.recheckStatus).toBe("RECHECKED_PASS");

      // Rule recheck fail keeps deficiency open
      const resFail = evaluateDeficiencyResolution({
        documentStatus: "COMPLETED",
        hasPassingEvidence: false,
        ruleOutcome: "FAIL",
      });
      expect(resFail.isResolved).toBe(false);
      expect(resFail.recheckStatus).toBe("RECHECKED_FAIL");

      // Document processing failure
      const resDocFail = evaluateDeficiencyResolution({
        documentStatus: "FAILED",
        hasPassingEvidence: false,
      });
      expect(resDocFail.isResolved).toBe(false);
      expect(resDocFail.recheckStatus).toBe("RECHECKED_FAIL");

      // Review required document
      const resReview = evaluateDeficiencyResolution({
        documentStatus: "REVIEW_REQUIRED",
        hasPassingEvidence: false,
      });
      expect(resReview.isResolved).toBe(false);
      expect(resReview.recheckStatus).toBe("PENDING_RECHECK");
    });
  });

  // =========================================================================
  // 3. INTEGRATION WITH DATABASE & DEFICIENCY SERVICE
  // =========================================================================
  describe("3. Deficiency Service & Case Recheck Integration", () => {
    const demoApplicationId = "app_demo_nos_sub_001";
    const demoCaseId = "case_demo_nos_001";
    const officerActor: AuthenticatedUser = {
      id: "usr_demo_officer_001",
      name: "Priya Sharma",
      email: "priya.sharma@tribal.gov.in",
      role: UserRole.VERIFICATION_OFFICER,
    };
    const applicantActor: AuthenticatedUser = {
      id: "usr_demo_applicant_001",
      name: "Ramesh Kumar Meena",
      email: "ramesh.meena@example.tribal.gov.in",
      role: UserRole.APPLICANT,
    };

    beforeEach(async () => {
      // Clean up previous test deficiencies on the demo case
      await prisma.deficiency.deleteMany({
        where: { caseDossierId: demoCaseId },
      });
    });

    it("issues a deficiency cleanly and updates case stage to DEFICIENCY_PENDING", async () => {
      const def = await deficiencyService.issueDeficiency(
        {
          caseDossierId: demoCaseId,
          issuedById: officerActor.id,
          deficiencyType: "DOCUMENT_ILLEGIBLE",
          documentType: "INCOME_CERTIFICATE",
          description: "Scanned document is blurry and unreadable.",
        },
        officerActor
      );

      expect(def).toBeDefined();
      expect(def.status).toBe("OPEN");
      expect(def.description).toContain("blurry");

      // Verify dossier stage transitioned
      const updatedDossier = await prisma.caseDossier.findUnique({
        where: { id: demoCaseId },
      });
      expect(updatedDossier?.currentStage).toBe("DEFICIENCY_PENDING");
      expect(updatedDossier?.currentState).toBe("ACTION_REQUIRED");

      // Verify audit log created
      const auditLog = await prisma.auditLog.findFirst({
        where: {
          caseDossierId: demoCaseId,
          actionType: "DEFICIENCY_ISSUED",
        },
      });
      expect(auditLog).toBeDefined();
    });

    it("deduplicates identical open deficiency creation requests", async () => {
      const def1 = await deficiencyService.issueDeficiency(
        {
          caseDossierId: demoCaseId,
          issuedById: officerActor.id,
          deficiencyType: "DATA_MISMATCH",
          documentType: "CASTE_CERTIFICATE",
        },
        officerActor
      );

      const def2 = await deficiencyService.issueDeficiency(
        {
          caseDossierId: demoCaseId,
          issuedById: officerActor.id,
          deficiencyType: "DATA_MISMATCH",
          documentType: "CASTE_CERTIFICATE",
        },
        officerActor
      );

      expect(def1.id).toBe(def2.id);

      const count = await prisma.deficiency.count({
        where: {
          caseDossierId: demoCaseId,
          deficiencyType: "DATA_MISMATCH",
        },
      });
      expect(count).toBe(1);
    });

    it("allows applicant to view their deficiencies but blocks unauthorized applicant access", async () => {
      await deficiencyService.issueDeficiency(
        {
          caseDossierId: demoCaseId,
          issuedById: officerActor.id,
          deficiencyType: "DATA_MISMATCH",
          documentType: "INCOME_CERTIFICATE",
        },
        officerActor
      );

      // Authorized applicant view
      const result = await deficiencyService.listApplicantDeficiencies(
        demoApplicationId,
        applicantActor
      );
      expect(result.length).toBe(1);
      expect(result[0].title).toContain("Income Certificate");

      // Unauthorized applicant view
      const intruderActor: AuthenticatedUser = {
        id: "usr_intruder_999",
        name: "Intruder User",
        email: "intruder@tribalscholar.gov.in",
        role: UserRole.APPLICANT,
      };

      await expect(
        deficiencyService.listApplicantDeficiencies(demoApplicationId, intruderActor)
      ).rejects.toThrow(/Forbidden/);
    });

    it("records applicant response and runs targeted recheck", async () => {
      const def = await deficiencyService.issueDeficiency(
        {
          caseDossierId: demoCaseId,
          issuedById: officerActor.id,
          deficiencyType: "DATA_MISMATCH",
          documentType: "CASTE_CERTIFICATE",
          description: "Caste certificate number variation requires explanation.",
        },
        officerActor
      );

      const responseResult = await deficiencyService.respondToDeficiency(
        demoApplicationId,
        def.id,
        {
          clarificationText:
            "Certificate was re-issued by Tehsildar with updated digital signature.",
        },
        applicantActor
      );

      expect(responseResult).toBeDefined();

      const updatedDef = await prisma.deficiency.findUnique({
        where: { id: def.id },
      });
      expect(updatedDef?.applicantResponseText).toContain("re-issued by Tehsildar");
      expect(updatedDef?.applicantRespondedAt).toBeDefined();
    });

    it("allows officer to resolve or waive deficiency with mandatory remark", async () => {
      const def = await deficiencyService.issueDeficiency(
        {
          caseDossierId: demoCaseId,
          issuedById: officerActor.id,
          deficiencyType: "DOCUMENT_ILLEGIBLE",
          documentType: "DEGREE_TRANSCRIPT",
        },
        officerActor
      );

      // Attempt resolve without remark -> should fail
      await expect(
        deficiencyService.officerResolveOrWaive(
          def.id,
          {
            action: "RESOLVE",
            remark: "",
          },
          officerActor
        )
      ).rejects.toThrow(/mandatory/i);

      // Resolve with valid remark
      const resolved = await deficiencyService.officerResolveOrWaive(
        def.id,
        {
          action: "RESOLVE",
          remark: "Marksheet legibility verified manually via university online portal.",
        },
        officerActor
      );

      expect(resolved.status).toBe("RESOLVED");
      expect(resolved.officerResolutionRemark).toContain("verified");

      // Verify dossier stage transitioned back to OFFICER_REVIEW when all resolved
      const dossier = await prisma.caseDossier.findUnique({
        where: { id: demoCaseId },
      });
      expect(dossier?.currentStage).toBe("OFFICER_REVIEW");
    });

    it("generates correct deficiency summary metrics", async () => {
      await deficiencyService.issueDeficiency(
        {
          caseDossierId: demoCaseId,
          issuedById: officerActor.id,
          deficiencyType: "DOCUMENT_ILLEGIBLE",
          documentType: "INCOME_CERTIFICATE",
        },
        officerActor
      );

      const summary = await deficiencyService.getDeficiencySummary(demoApplicationId, officerActor);
      expect(summary.totalDeficiencies).toBeGreaterThanOrEqual(1);
      expect(summary.openCount).toBeGreaterThanOrEqual(1);
      expect(summary.applicantActionRequired).toBe(true);
    });
  });
});
