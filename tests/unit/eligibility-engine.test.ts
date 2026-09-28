import { describe, it, expect, beforeEach } from "vitest";
import {
  evaluateOperator,
  formatFailureMessage,
} from "../../src/server/domain/eligibility/operators";
import {
  checkEvidenceAmbiguity,
  checkConflictingEvidence,
} from "../../src/server/domain/eligibility/ambiguity";
import {
  normalizeName,
  stringSimilarity,
  runConsistencyChecks,
} from "../../src/server/domain/eligibility/consistency-engine";
import {
  calculateAgeInYears,
  resolveRuleInput,
} from "../../src/server/domain/eligibility/input-resolver";
import { eligibilityEngineService } from "../../src/server/services/eligibility-engine.service";
import { prisma } from "../../src/server/db";
import { EligibilityRule } from "../../src/server/domain/scheme/types/eligibility-rules.types";
import { ExtractedFieldEvidence } from "../../src/server/domain/eligibility/types";

describe("Phase 2G: Deterministic Eligibility & Evidence Verification Engine", () => {
  // =========================================================================
  // 1. PURE OPERATOR EVALUATION TESTS
  // =========================================================================
  describe("1. Pure Operator Evaluation (DSL)", () => {
    it("evaluates EQUALS operator with case-insensitivity and string trimming", () => {
      const resPass = evaluateOperator({
        operator: "EQUALS",
        resolvedValue: "  Scheduled Tribe  ",
        threshold: "scheduled tribe",
        isCandidateSt: true,
      });
      expect(resPass.outcome).toBe("PASS");

      const resFail = evaluateOperator({
        operator: "EQUALS",
        resolvedValue: "General",
        threshold: "ST",
        isCandidateSt: false,
      });
      expect(resFail.outcome).toBe("FAIL");
    });

    it("evaluates NOT_EQUALS operator correctly", () => {
      const resPass = evaluateOperator({
        operator: "NOT_EQUALS",
        resolvedValue: "PHD",
        threshold: "BTECH",
        isCandidateSt: true,
      });
      expect(resPass.outcome).toBe("PASS");

      const resFail = evaluateOperator({
        operator: "NOT_EQUALS",
        resolvedValue: "ST",
        threshold: "ST",
        isCandidateSt: true,
      });
      expect(resFail.outcome).toBe("FAIL");
    });

    it("evaluates LESS_THAN and LESS_THAN_OR_EQUALS with numeric parsing", () => {
      const res1 = evaluateOperator({
        operator: "LESS_THAN",
        resolvedValue: "₹4,50,000",
        threshold: 800000,
        isCandidateSt: true,
      });
      expect(res1.outcome).toBe("PASS");

      const res2 = evaluateOperator({
        operator: "LESS_THAN_OR_EQUALS",
        resolvedValue: 800000,
        threshold: 800000,
        isCandidateSt: true,
      });
      expect(res2.outcome).toBe("PASS");

      const res3 = evaluateOperator({
        operator: "LESS_THAN_OR_EQUALS",
        resolvedValue: 800001,
        threshold: 800000,
        isCandidateSt: true,
      });
      expect(res3.outcome).toBe("FAIL");
    });

    it("evaluates GREATER_THAN and GREATER_THAN_OR_EQUALS with numeric parsing", () => {
      const resPass = evaluateOperator({
        operator: "GREATER_THAN_OR_EQUALS",
        resolvedValue: "72.5 %",
        threshold: 60,
        isCandidateSt: true,
      });
      expect(resPass.outcome).toBe("PASS");

      const resFail = evaluateOperator({
        operator: "GREATER_THAN_OR_EQUALS",
        resolvedValue: "58.5 %",
        threshold: 60,
        isCandidateSt: true,
      });
      expect(resFail.outcome).toBe("FAIL");
    });

    it("evaluates IN and NOT_IN operators for lists and arrays", () => {
      const resIn = evaluateOperator({
        operator: "IN",
        resolvedValue: "Ph.D.",
        threshold: ["Ph.D.", "M.Phil.", "Post-Doctoral"],
        isCandidateSt: true,
      });
      expect(resIn.outcome).toBe("PASS");

      const resNotIn = evaluateOperator({
        operator: "NOT_IN",
        resolvedValue: "Diploma",
        threshold: ["Ph.D.", "M.Phil."],
        isCandidateSt: true,
      });
      expect(resNotIn.outcome).toBe("PASS");
    });

    it("evaluates MATCHES_REGEX operator safely", () => {
      const resPass = evaluateOperator({
        operator: "MATCHES_REGEX",
        resolvedValue: "Z9876543",
        threshold: "^[A-Z][0-9]{7}$",
        isCandidateSt: true,
      });
      expect(resPass.outcome).toBe("PASS");

      const resFail = evaluateOperator({
        operator: "MATCHES_REGEX",
        resolvedValue: "12345678",
        threshold: "^[A-Z][0-9]{7}$",
        isCandidateSt: true,
      });
      expect(resFail.outcome).toBe("FAIL");
    });

    it("evaluates IS_PRESENT operator", () => {
      expect(
        evaluateOperator({
          operator: "IS_PRESENT",
          resolvedValue: "University of Oxford",
          threshold: true,
          isCandidateSt: true,
        }).outcome
      ).toBe("PASS");

      expect(
        evaluateOperator({
          operator: "IS_PRESENT",
          resolvedValue: "",
          threshold: true,
          isCandidateSt: true,
        }).outcome
      ).toBe("FAIL");

      expect(
        evaluateOperator({
          operator: "IS_PRESENT",
          resolvedValue: null,
          threshold: true,
          isCandidateSt: true,
        }).outcome
      ).toBe("FAIL");
    });

    it("evaluates WITHIN_MONTHS operator for document validity windows", () => {
      const refDate = new Date("2026-09-15T00:00:00.000Z");
      const issueDateRecent = new Date("2025-09-15T00:00:00.000Z"); // 12 months ago
      const issueDateOld = new Date("2022-01-01T00:00:00.000Z"); // > 40 months ago

      const resPass = evaluateOperator({
        operator: "WITHIN_MONTHS",
        resolvedValue: issueDateRecent,
        threshold: 36,
        isCandidateSt: true,
        referenceDate: refDate,
      });
      expect(resPass.outcome).toBe("PASS");

      const resFail = evaluateOperator({
        operator: "WITHIN_MONTHS",
        resolvedValue: issueDateOld,
        threshold: 36,
        isCandidateSt: true,
        referenceDate: refDate,
      });
      expect(resFail.outcome).toBe("FAIL");
    });
  });

  // =========================================================================
  // 2. ST CATEGORY RELAXATION TESTS
  // =========================================================================
  describe("2. ST Category Relaxation Rules", () => {
    it("applies +5 years relaxation to threshold for verified ST candidate", () => {
      // Candidate age: 34 years.
      // Base scheme threshold: 31 years.
      // ST Relaxation: +5 years (effective threshold: 36 years).
      const resSt = evaluateOperator({
        operator: "LESS_THAN_OR_EQUALS",
        resolvedValue: 34,
        threshold: 31,
        isCandidateSt: true,
        stRelaxation: { addToThreshold: 5 },
      });

      expect(resSt.outcome).toBe("PASS");
      expect(resSt.appliedRelaxation).toBeDefined();
      expect(resSt.appliedRelaxation?.relaxedThreshold).toBe(36);
      expect(resSt.expectedValueString).toContain("36 (Base: 31 + ST Relaxation: +5)");

      // Same candidate without ST status fails
      const resNonSt = evaluateOperator({
        operator: "LESS_THAN_OR_EQUALS",
        resolvedValue: 34,
        threshold: 31,
        isCandidateSt: false,
        stRelaxation: { addToThreshold: 5 },
      });

      expect(resNonSt.outcome).toBe("FAIL");
      expect(resNonSt.appliedRelaxation).toBeUndefined();
    });
  });

  // =========================================================================
  // 3. AMBIGUITY & LOW CONFIDENCE DETECTION (NON-NEGOTIABLE PRINCIPLE)
  // =========================================================================
  describe("3. Ambiguity & Low Confidence Handling (Low Confidence != Fail)", () => {
    it("marks evidence as AMBIGUOUS when confidence is below 0.50 (NOT Fail)", () => {
      const lowConfidenceEvidence: ExtractedFieldEvidence = {
        id: "f1",
        documentId: "d1",
        documentType: "CASTE_CERTIFICATE",
        fieldKey: "casteCategory",
        rawValue: "ST",
        normalizedValue: "ST",
        confidenceScore: 0.42, // < 0.50
        pageNumber: 1,
        sourceSnippet: "caste: ST",
        documentStatus: "COMPLETED",
      };

      const result = checkEvidenceAmbiguity(lowConfidenceEvidence, "casteCategory");
      expect(result.isAmbiguous).toBe(true);
      expect(result.reasons[0]).toContain("low (42% < 50%)");
    });

    it("marks evidence as AMBIGUOUS when source document status is REVIEW_REQUIRED", () => {
      const degradedEvidence: ExtractedFieldEvidence = {
        id: "f2",
        documentId: "d2",
        documentType: "INCOME_CERTIFICATE",
        fieldKey: "annualFamilyIncome",
        rawValue: "450000",
        normalizedValue: "450000",
        confidenceScore: 0.95,
        pageNumber: 1,
        sourceSnippet: "income: 450000",
        documentStatus: "REVIEW_REQUIRED",
      };

      const result = checkEvidenceAmbiguity(degradedEvidence, "annualFamilyIncome");
      expect(result.isAmbiguous).toBe(true);
      expect(result.reasons[0]).toContain("REVIEW_REQUIRED");
    });

    it("detects conflicting extractions across multiple documents for the same field", () => {
      const evidenceList: ExtractedFieldEvidence[] = [
        {
          id: "f3",
          documentId: "d3",
          documentType: "CASTE_CERTIFICATE",
          fieldKey: "applicantName",
          rawValue: "RAMESH KUMAR MEENA",
          normalizedValue: "RAMESH KUMAR MEENA",
          confidenceScore: 0.95,
          pageNumber: 1,
          sourceSnippet: "Name: RAMESH KUMAR MEENA",
          documentStatus: "COMPLETED",
        },
        {
          id: "f4",
          documentId: "d4",
          documentType: "PASSPORT",
          fieldKey: "applicantName",
          rawValue: "SURESH KUMAR MEENA", // Conflicting name
          normalizedValue: "SURESH KUMAR MEENA",
          confidenceScore: 0.93,
          pageNumber: 1,
          sourceSnippet: "Name: SURESH KUMAR MEENA",
          documentStatus: "COMPLETED",
        },
      ];

      const conflictResult = checkConflictingEvidence(evidenceList, "applicantName");
      expect(conflictResult.isAmbiguous).toBe(true);
      expect(conflictResult.reasons[0]).toContain("Conflicting extracted values");
    });
  });

  // =========================================================================
  // 4. CROSS-DOCUMENT CONSISTENCY ENGINE & NORMALIZATION
  // =========================================================================
  describe("4. Cross-Document Consistency Engine", () => {
    it("normalizes names by stripping honorifics and collapsing whitespace", () => {
      expect(normalizeName("Shri Ramesh Kumar Meena")).toBe("ramesh kumar meena");
      expect(normalizeName("Dr. Ramesh   Kumar  Meena")).toBe("ramesh kumar meena");
      expect(normalizeName("Mr. Ramesh Kumar Meena")).toBe("ramesh kumar meena");
      expect(normalizeName("Kumari Priya   Sharma")).toBe("priya sharma");
      expect(normalizeName("Smt. Sunita Devi")).toBe("sunita devi");
    });

    it("computes high similarity for rearranged name tokens", () => {
      const score = stringSimilarity("Ramesh Kumar Meena", "Meena Ramesh Kumar");
      expect(score).toBeGreaterThanOrEqual(0.95);
    });

    it("verifies consistent records across applicant form and documents", () => {
      const checks = runConsistencyChecks({
        formData: {
          fullName: "Ramesh Kumar Meena",
          annualFamilyIncome: 450000,
          casteCategory: "ST",
          passportNumber: "Z9876543",
        },
        applicantProfile: {
          category: "ST",
          annualFamilyIncome: 450000,
          user: { name: "Ramesh Kumar Meena" },
        },
        extractedEvidences: [
          {
            id: "e1",
            documentId: "doc_caste",
            documentType: "CASTE_CERTIFICATE",
            fieldKey: "applicantName",
            rawValue: "Shri Ramesh Kumar Meena",
            normalizedValue: "RAMESH KUMAR MEENA",
            confidenceScore: 0.96,
            pageNumber: 1,
            sourceSnippet: "Name: Shri Ramesh Kumar Meena",
            documentStatus: "COMPLETED",
          },
          {
            id: "e2",
            documentId: "doc_income",
            documentType: "INCOME_CERTIFICATE",
            fieldKey: "annualFamilyIncome",
            rawValue: "Rs. 4,50,000/-",
            normalizedValue: "450000",
            confidenceScore: 0.94,
            pageNumber: 1,
            sourceSnippet: "Income: Rs. 4,50,000/-",
            documentStatus: "COMPLETED",
          },
          {
            id: "e3",
            documentId: "doc_caste",
            documentType: "CASTE_CERTIFICATE",
            fieldKey: "casteCategory",
            rawValue: "Scheduled Tribe (Meena)",
            normalizedValue: "ST",
            confidenceScore: 0.95,
            pageNumber: 1,
            sourceSnippet: "Community: Scheduled Tribe (Meena)",
            documentStatus: "COMPLETED",
          },
          {
            id: "e4",
            documentId: "doc_passport",
            documentType: "PASSPORT",
            fieldKey: "passportNumber",
            rawValue: "Z9876543",
            normalizedValue: "Z9876543",
            confidenceScore: 0.99,
            pageNumber: 1,
            sourceSnippet: "Passport No: Z9876543",
            documentStatus: "COMPLETED",
          },
        ],
      });

      expect(checks.length).toBe(4);
      expect(checks.every((c) => c.isConsistent)).toBe(true);
    });

    it("flags explainable review required when declared income does not match certificate", () => {
      const checks = runConsistencyChecks({
        formData: {
          fullName: "Ramesh Kumar Meena",
          annualFamilyIncome: 350000, // Form says 3.5L
        },
        applicantProfile: {
          user: { name: "Ramesh Kumar Meena" },
        },
        extractedEvidences: [
          {
            id: "e_inc",
            documentId: "doc_inc",
            documentType: "INCOME_CERTIFICATE",
            fieldKey: "annualFamilyIncome",
            rawValue: "Rs. 7,50,000/-", // Doc says 7.5L
            normalizedValue: "750000",
            confidenceScore: 0.95,
            pageNumber: 1,
            sourceSnippet: "Income: 750000",
            documentStatus: "COMPLETED",
          },
        ],
      });

      const incomeCheck = checks.find((c) => c.fieldKey === "annualFamilyIncome");
      expect(incomeCheck).toBeDefined();
      expect(incomeCheck?.isConsistent).toBe(false);
      expect(incomeCheck?.mismatchExplanation).toContain("does not match extracted income");
    });
  });

  // =========================================================================
  // 5. INPUT RESOLUTION & AGE CALCULATION
  // =========================================================================
  describe("5. Input & Evidence Resolution", () => {
    it("calculates exact age from date of birth relative to reference date", () => {
      const dob = new Date("1998-05-15");
      const refDate = new Date("2026-09-15");
      const age = calculateAgeInYears(dob, refDate);
      expect(age).toBe(28);
    });

    it("resolves COMPUTED age field from applicantProfile and formData", () => {
      const rule: EligibilityRule = {
        ruleKey: "AGE_LIMIT",
        name: "Age Limit",
        description: "Must be <= 35 years",
        source: "COMPUTED",
        sourceField: "age",
        operator: "LESS_THAN_OR_EQUALS",
        threshold: 35,
        failureMessage: "Exceeds age limit",
        severity: "HARD_FAIL",
        isActive: true,
      };

      const resolved = resolveRuleInput(rule, {
        formData: { dateOfBirth: "1998-05-15" },
        applicantProfile: {},
        extractedEvidences: [],
        submittedAt: new Date("2026-09-15"),
      });

      expect(resolved.isComputed).toBe(true);
      expect(resolved.value).toBe(28);
    });
  });

  // =========================================================================
  // 6. END-TO-END DETERMINISTIC ELIGIBILITY ENGINE SERVICE
  // =========================================================================
  describe("6. EligibilityEngineService Integration", () => {
    it("evaluates seeded NOS application deterministically with ELIGIBLE_ASSESSED status", async () => {
      const nosApp = await prisma.application.findFirst({
        where: { applicationNumber: "APP-NOS-2026-000201" },
        include: { schemeVersion: true, caseDossier: true },
      });

      expect(nosApp).toBeDefined();

      const result = await eligibilityEngineService.evaluateApplication(nosApp!.id, {
        id: "usr_demo_officer_001",
        role: "VERIFICATION_OFFICER",
      } as any);

      expect(result.applicationId).toBe(nosApp!.id);
      expect(result.schemeCode).toBe("NOS");
      expect(result.versionNumber).toBe(1);
      expect(result.assessmentStatus).toBe("ELIGIBLE_ASSESSED");
      expect(result.summary.hardFails).toBe(0);
      expect(result.summary.passed).toBeGreaterThanOrEqual(4);
      expect(result.ruleResults.length).toBeGreaterThanOrEqual(4);
      expect(result.consistencyChecks.length).toBeGreaterThanOrEqual(4);

      // Verify RuleResult rows persisted in DB
      const dbRuleResults = await prisma.ruleResult.findMany({
        where: { runId: result.runId },
      });
      expect(dbRuleResults.length).toBe(result.ruleResults.length);
      expect(dbRuleResults.every((r) => r.outcome === "PASS")).toBe(true);

      // Verify AuditLog written
      const auditLog = await prisma.auditLog.findFirst({
        where: {
          caseDossierId: nosApp!.caseDossier!.id,
          actionType: "ELIGIBILITY_EVALUATION_COMPLETED",
        },
        orderBy: { createdAt: "desc" },
      });
      expect(auditLog).toBeDefined();
    });

    it("enforces RBAC: rejects APPLICANT from triggering officer evaluate endpoint", async () => {
      const nosApp = await prisma.application.findFirst({
        where: { applicationNumber: "APP-NOS-2026-000201" },
      });

      await expect(
        eligibilityEngineService.evaluateApplication(nosApp!.id, {
          id: "usr_demo_applicant_001",
          role: "APPLICANT",
        } as any)
      ).rejects.toThrow(/Forbidden/);
    });

    it("evaluates correctly using getEvaluationResults", async () => {
      const nosApp = await prisma.application.findFirst({
        where: { applicationNumber: "APP-NOS-2026-000201" },
      });

      const fetched = await eligibilityEngineService.getEvaluationResults(nosApp!.id, {
        id: "usr_demo_officer_001",
        role: "VERIFICATION_OFFICER",
      } as any);

      expect(fetched).toBeDefined();
      expect(fetched?.assessmentStatus).toBe("ELIGIBLE_ASSESSED");
      expect(fetched?.ruleResults.length).toBeGreaterThanOrEqual(4);
    });
  });
});
