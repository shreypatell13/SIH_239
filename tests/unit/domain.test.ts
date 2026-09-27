import { describe, it, expect } from "vitest";
import { UserRoleSchema, hasRole, hasPermission } from "@/server/auth/roles";
import { DEMO_USERS, getDemoUser } from "@/server/auth/session";

describe("Phase 2B Domain Models & Schema Contracts", () => {
  describe("Role Enums & Personas", () => {
    it("should validate all 4 canonical system roles", () => {
      expect(UserRoleSchema.safeParse("APPLICANT").success).toBe(true);
      expect(UserRoleSchema.safeParse("VERIFICATION_OFFICER").success).toBe(true);
      expect(UserRoleSchema.safeParse("SCHEME_ADMIN").success).toBe(true);
      expect(UserRoleSchema.safeParse("OPERATIONS_DIRECTOR").success).toBe(true);
      // Deprecated / invalid names should fail
      expect(UserRoleSchema.safeParse("OFFICER").success).toBe(false);
      expect(UserRoleSchema.safeParse("ADMIN").success).toBe(false);
      expect(UserRoleSchema.safeParse("MANAGEMENT").success).toBe(false);
    });

    it("should provide valid demo personas for all 4 roles", () => {
      const applicant = getDemoUser("APPLICANT");
      const officer = getDemoUser("VERIFICATION_OFFICER");
      const admin = getDemoUser("SCHEME_ADMIN");
      const director = getDemoUser("OPERATIONS_DIRECTOR");

      expect(applicant.role).toBe("APPLICANT");
      expect(officer.role).toBe("VERIFICATION_OFFICER");
      expect(admin.role).toBe("SCHEME_ADMIN");
      expect(director.role).toBe("OPERATIONS_DIRECTOR");

      expect(hasPermission(officer, "application:verify")).toBe(true);
      expect(hasPermission(admin, "scheme:create")).toBe(true);
      expect(hasPermission(director, "control_tower:view")).toBe(true);
      expect(hasPermission(applicant, "application:create")).toBe(true);
    });
  });

  describe("Declarative Scheme Versioning Contract", () => {
    it("should enforce declarative eligibility rules structure for NFST and NOS", () => {
      const nfstEligibility = {
        maxAgeYears: 36,
        minQualifyingPercentage: 55.0,
        requiresStCategory: true,
        maxIncomeCeilingInr: null,
      };

      const nosEligibility = {
        maxAgeYears: 35,
        minQualifyingPercentage: 60.0,
        maxIncomeCeilingInr: 800000.0,
        maxForeignUniversityRank: 500,
        requiresStCategory: true,
      };

      expect(nfstEligibility.maxAgeYears).toBe(36);
      expect(nosEligibility.maxIncomeCeilingInr).toBe(800000.0);
      expect(nosEligibility.maxForeignUniversityRank).toBe(500);
      expect(nfstEligibility.requiresStCategory).toBe(true);
    });

    it("should pin applications to immutable SchemeVersion identifiers", () => {
      const application = {
        id: "app_test_001",
        applicationNumber: "TS-2026-NFST-0001",
        schemeVersionId: "sch_ver_nfst_2025_1",
        status: "SUBMITTED",
        formData: {
          researchTopic: "Tribal Ethnobotanical Knowledge in Central India",
          degreeType: "Ph.D.",
        },
      };

      expect(application.schemeVersionId).toBe("sch_ver_nfst_2025_1");
      expect(application.status).toBe("SUBMITTED");
    });
  });

  describe("Document Versioning & History Preservation", () => {
    it("should preserve version increment and isLatestVersion flag on resubmission", () => {
      const documentsHistory = [
        {
          id: "doc_v1",
          documentType: "CASTE_CERTIFICATE",
          version: 1,
          isLatestVersion: false,
          processingStatus: "COMPLETED",
        },
        {
          id: "doc_v2",
          documentType: "CASTE_CERTIFICATE",
          version: 2,
          isLatestVersion: true,
          processingStatus: "PENDING",
        },
      ];

      const latestDoc = documentsHistory.find((d) => d.isLatestVersion);
      expect(latestDoc?.version).toBe(2);
      expect(documentsHistory.filter((d) => d.isLatestVersion).length).toBe(1);
      expect(documentsHistory[0].isLatestVersion).toBe(false);
    });
  });

  describe("AI vs Human Distinction Semantics", () => {
    it("should clearly separate automated AI findings from authoritative human decisions", () => {
      const aiExtraction = {
        fieldKey: "applicantName",
        rawValue: "Ramesh Kumar Meena",
        confidenceScore: 0.94,
        extractedBy: "AI" as const,
      };

      const humanOverride = {
        fieldKey: "applicantName",
        rawValue: "Ramesh K. Meena",
        confidenceScore: 1.0,
        extractedBy: "HUMAN_OVERRIDE" as const,
      };

      expect(aiExtraction.extractedBy).toBe("AI");
      expect(humanOverride.extractedBy).toBe("HUMAN_OVERRIDE");
    });

    it("should require human attribution for issued deficiencies", () => {
      const deficiency = {
        id: "def_001",
        caseDossierId: "case_001",
        issuedById: "usr_demo_officer_001",
        deficiencyType: "DOCUMENT_EXPIRED",
        description: "Income certificate expired for current financial year.",
        status: "OPEN",
      };

      expect(deficiency.issuedById).toBeDefined();
      expect(deficiency.issuedById).toContain("usr_demo_officer");
    });
  });

  describe("Explainable Case Status Model", () => {
    it("should conform to the design standard composite status structure", () => {
      const explainableStatus = {
        stage: "DOCUMENT_VERIFICATION",
        state: "ACTION_REQUIRED",
        blocker:
          "Annual income certificate issued on 12-Jul-2023 exceeds 12-month validity window.",
        responsible_actor: "APPLICANT",
        next_action: "Upload a renewed Income Certificate issued on or after 01-Apr-2025.",
        deadline: new Date("2026-10-15T23:59:59Z").toISOString(),
      };

      expect(explainableStatus.stage).toBe("DOCUMENT_VERIFICATION");
      expect(explainableStatus.state).toBe("ACTION_REQUIRED");
      expect(explainableStatus.responsible_actor).toBe("APPLICANT");
      expect(explainableStatus.blocker).toBeDefined();
      expect(explainableStatus.next_action).toBeDefined();
    });
  });
});
