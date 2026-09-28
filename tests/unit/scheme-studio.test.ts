import { describe, it, expect, beforeAll } from "vitest";
import { schemeValidationService } from "@/server/services/scheme-validation.service";
import { schemeService } from "@/server/services/scheme.service";
import { getDemoUser } from "@/server/auth/session";
import {
  FormSchema,
  DocumentRequirementsSchema,
  EligibilityRulesSchema,
  WorkflowConfig,
  SelectionConfig,
  PublishSchemeVersionDTO,
} from "@/server/domain/scheme/types";
import {
  FormSchemaValidator,
  DocumentRequirementsValidator,
  EligibilityRulesValidator,
  WorkflowConfigValidator,
  SelectionConfigValidator,
} from "@/server/domain/scheme/validators";

describe("Phase 2D: Scheme Studio & Declarative Configuration Engine", () => {
  const validFormSchema: FormSchema = {
    version: "1.0",
    sections: [
      { id: "personal", title: "Personal Details", order: 1 },
      { id: "financial", title: "Financial Information", order: 2 },
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
        id: "casteCategory",
        label: "Caste Affiliation",
        type: "select",
        validation: { required: true, allowedValues: ["ST"] },
        sectionId: "personal",
        order: 2,
      },
      {
        id: "annualFamilyIncome",
        label: "Annual Family Income (INR)",
        type: "number",
        validation: { required: true, min: 0 },
        sectionId: "financial",
        order: 1,
      },
    ],
  };

  const validDocRequirements: DocumentRequirementsSchema = {
    version: "1.0",
    requirements: [
      {
        id: "req_caste",
        documentType: "CASTE_CERTIFICATE",
        label: "Scheduled Tribe Certificate",
        description: "Official ST Certificate",
        level: "MANDATORY",
        allowedMimeTypes: ["application/pdf", "image/jpeg"],
        maxFileSizeMb: 5,
        validityWindowMonths: 36,
        requiresExtraction: true,
      },
      {
        id: "req_income",
        documentType: "INCOME_CERTIFICATE",
        label: "Income Certificate",
        description: "Annual Income Certificate",
        level: "OPTIONAL",
        allowedMimeTypes: ["application/pdf"],
        maxFileSizeMb: 5,
      },
    ],
  };

  const validEligibilityRules: EligibilityRulesSchema = {
    version: "1.0",
    rules: [
      {
        ruleKey: "ST_VERIFICATION",
        name: "ST Category Verification",
        description: "Must be ST",
        source: "FORM_DATA",
        sourceField: "casteCategory",
        operator: "EQUALS",
        threshold: "ST",
        failureMessage: "Must be ST",
        severity: "HARD_FAIL",
        isActive: true,
      },
      {
        ruleKey: "INCOME_CEILING",
        name: "Income Ceiling",
        description: "Income <= 800000",
        source: "FORM_DATA",
        sourceField: "annualFamilyIncome",
        operator: "LESS_THAN_OR_EQUALS",
        threshold: 800000,
        failureMessage: "Income exceeds 8 Lakhs",
        severity: "HARD_FAIL",
        isActive: true,
      },
    ],
  };

  const validWorkflowConfig: WorkflowConfig = {
    version: "1.0",
    stages: [
      {
        stageKey: "SUBMITTED",
        label: "Received",
        order: 1,
        slaDays: 1,
        assignableRoles: ["SYSTEM"],
      },
      {
        stageKey: "AUTOMATED_VERIFICATION",
        label: "Check",
        order: 2,
        slaDays: 1,
        assignableRoles: ["SYSTEM"],
        autoAdvanceOnPass: true,
      },
      {
        stageKey: "OFFICER_REVIEW",
        label: "Desk",
        order: 3,
        slaDays: 5,
        assignableRoles: ["VERIFICATION_OFFICER"],
      },
      {
        stageKey: "SANCTIONED",
        label: "Sanctioned",
        order: 4,
        slaDays: 3,
        assignableRoles: ["SCHEME_ADMIN"],
      },
    ],
    deficiencyResponseWindowDays: 14,
    maxResubmissionAttempts: 2,
    allowWithdrawal: true,
  };

  const validSelectionConfig: SelectionConfig = {
    version: "1.0",
    maxAwardees: 500,
    quotas: [{ id: "q1", label: "General Quota", percentage: 100 }],
    financialComponents: [
      { id: "fc1", label: "Monthly Stipend", amountInr: 31000, frequency: "MONTHLY" },
    ],
    meritBasis: "ACADEMIC_SCORE",
  };

  // ==========================================
  // 1. FORM SCHEMA DSL VALIDATION
  // ==========================================
  describe("Form Schema DSL", () => {
    it("should validate a well-formed FormSchema", () => {
      const parsed = FormSchemaValidator.safeParse(validFormSchema);
      expect(parsed.success).toBe(true);
    });

    it("should reject duplicate field IDs in semantic validation", () => {
      const invalidSchema: FormSchema = {
        ...validFormSchema,
        fields: [
          ...validFormSchema.fields,
          {
            id: "fullName", // Duplicate!
            label: "Duplicate Full Name",
            type: "text",
            validation: {},
            sectionId: "personal",
            order: 4,
          },
        ],
      };

      const result = schemeValidationService.validateVersionConfig({
        formSchema: invalidSchema,
        documentRequirements: validDocRequirements,
        eligibilityRules: validEligibilityRules,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.message.includes("Duplicate field ID"))).toBe(true);
    });

    it("should reject fields referencing non-existent sections", () => {
      const invalidSchema: FormSchema = {
        ...validFormSchema,
        fields: [
          {
            id: "orphanField",
            label: "Orphan",
            type: "text",
            validation: {},
            sectionId: "non_existent_section",
            order: 1,
          },
        ],
      };

      const result = schemeValidationService.validateVersionConfig({
        formSchema: invalidSchema,
        documentRequirements: validDocRequirements,
        eligibilityRules: validEligibilityRules,
      });

      expect(result.isValid).toBe(false);
      expect(
        result.errors.some((e) => e.message.includes("references non-existent sectionId"))
      ).toBe(true);
    });

    it("should reject conditional visibility referencing non-existent fields", () => {
      const invalidSchema: FormSchema = {
        ...validFormSchema,
        fields: [
          ...validFormSchema.fields,
          {
            id: "specialHostCountry",
            label: "Host Country",
            type: "text",
            validation: {},
            conditionalVisibility: {
              dependsOnField: "unknownField999",
              showWhenValue: true,
            },
            sectionId: "personal",
            order: 4,
          },
        ],
      };

      const result = schemeValidationService.validateVersionConfig({
        formSchema: invalidSchema,
        documentRequirements: validDocRequirements,
        eligibilityRules: validEligibilityRules,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.message.includes("depends on non-existent field"))).toBe(
        true
      );
    });
  });

  // ==========================================
  // 2. DOCUMENT REQUIREMENTS DSL
  // ==========================================
  describe("Document Requirements Matrix", () => {
    it("should validate a well-formed DocumentRequirementsSchema", () => {
      const parsed = DocumentRequirementsValidator.safeParse(validDocRequirements);
      expect(parsed.success).toBe(true);
    });

    it("should reject matrices with zero MANDATORY documents", () => {
      const allOptionalMatrix: DocumentRequirementsSchema = {
        version: "1.0",
        requirements: [
          {
            id: "req_opt",
            documentType: "OTHER",
            label: "Optional Doc",
            description: "Some doc",
            level: "OPTIONAL",
            allowedMimeTypes: ["application/pdf"],
            maxFileSizeMb: 5,
          },
        ],
      };

      const result = schemeValidationService.validateVersionConfig({
        formSchema: validFormSchema,
        documentRequirements: allOptionalMatrix,
        eligibilityRules: validEligibilityRules,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.message.includes("at least one MANDATORY document"))).toBe(
        true
      );
    });

    it("should reject unsupported MIME types", () => {
      const invalidMime = {
        version: "1.0",
        requirements: [
          {
            id: "req_exe",
            documentType: "OTHER",
            label: "Executable",
            description: "Bad file",
            level: "MANDATORY",
            allowedMimeTypes: ["application/x-msdownload"], // Disallowed!
            maxFileSizeMb: 5,
          },
        ],
      };

      const parsed = DocumentRequirementsValidator.safeParse(invalidMime);
      expect(parsed.success).toBe(false);
    });

    it("should reject excessive file size limits (> 50MB)", () => {
      const hugeFile = {
        version: "1.0",
        requirements: [
          {
            id: "req_huge",
            documentType: "OTHER",
            label: "Huge File",
            description: "Too big",
            level: "MANDATORY",
            allowedMimeTypes: ["application/pdf"],
            maxFileSizeMb: 100, // Disallowed!
          },
        ],
      };

      const parsed = DocumentRequirementsValidator.safeParse(hugeFile);
      expect(parsed.success).toBe(false);
    });
  });

  // ==========================================
  // 3. ELIGIBILITY RULES DSL
  // ==========================================
  describe("Eligibility Rules DSL", () => {
    it("should validate a well-formed EligibilityRulesSchema", () => {
      const parsed = EligibilityRulesValidator.safeParse(validEligibilityRules);
      expect(parsed.success).toBe(true);
    });

    it("should reject rules with non-SCREAMING_SNAKE ruleKey", () => {
      const invalidKey = {
        version: "1.0",
        rules: [
          {
            ruleKey: "lowercase_invalid_key",
            name: "Bad Key",
            description: "Desc",
            source: "FORM_DATA",
            sourceField: "field",
            operator: "EQUALS",
            threshold: 10,
            failureMessage: "Fail",
            severity: "HARD_FAIL",
          },
        ],
      };

      const parsed = EligibilityRulesValidator.safeParse(invalidKey);
      expect(parsed.success).toBe(false);
    });

    it("should reject FORM_DATA rules referencing non-existent form fields", () => {
      const invalidRuleRef: EligibilityRulesSchema = {
        version: "1.0",
        rules: [
          {
            ruleKey: "ST_VERIFICATION",
            name: "ST Verify",
            description: "ST",
            source: "FORM_DATA",
            sourceField: "nonExistentFieldInForm",
            operator: "EQUALS",
            threshold: "ST",
            failureMessage: "Fail",
            severity: "HARD_FAIL",
            isActive: true,
          },
        ],
      };

      const result = schemeValidationService.validateVersionConfig({
        formSchema: validFormSchema,
        documentRequirements: validDocRequirements,
        eligibilityRules: invalidRuleRef,
      });

      expect(result.isValid).toBe(false);
      expect(
        result.errors.some((e) => e.message.includes("which does not exist in Form Schema"))
      ).toBe(true);
    });
  });

  // ==========================================
  // 4. WORKFLOW & SELECTION VALIDATION
  // ==========================================
  describe("Workflow & Selection Configuration", () => {
    it("should validate a well-formed WorkflowConfig", () => {
      const parsed = WorkflowConfigValidator.safeParse(validWorkflowConfig);
      expect(parsed.success).toBe(true);
    });

    it("should reject workflows missing terminal stages", () => {
      const brokenWorkflow: WorkflowConfig = {
        version: "1.0",
        stages: [
          {
            stageKey: "SUBMITTED",
            label: "Received",
            order: 1,
            slaDays: 1,
            assignableRoles: ["SYSTEM"],
          },
          {
            stageKey: "OFFICER_REVIEW",
            label: "Desk",
            order: 2,
            slaDays: 5,
            assignableRoles: ["VERIFICATION_OFFICER"],
          },
          // Missing terminal stage like SANCTIONED or REJECTED
        ],
        deficiencyResponseWindowDays: 14,
        maxResubmissionAttempts: 2,
        allowWithdrawal: true,
      };

      const result = schemeValidationService.validateVersionConfig({
        formSchema: validFormSchema,
        documentRequirements: validDocRequirements,
        eligibilityRules: validEligibilityRules,
        workflowConfig: brokenWorkflow,
      });

      expect(result.isValid).toBe(false);
      expect(
        result.errors.some((e) =>
          e.message.includes(
            "must include at least an entry stage, a review stage, and a terminal stage"
          )
        )
      ).toBe(true);
    });

    it("should reject quotas exceeding 100% in selection config", () => {
      const excessQuotas: SelectionConfig = {
        version: "1.0",
        maxAwardees: 100,
        quotas: [
          { id: "q1", label: "Quota 1", percentage: 70 },
          { id: "q2", label: "Quota 2", percentage: 50 }, // Total = 120%
        ],
        financialComponents: [
          { id: "fc1", label: "Stipend", amountInr: 30000, frequency: "MONTHLY" },
        ],
        meritBasis: "ACADEMIC_SCORE",
      };

      const result = schemeValidationService.validateVersionConfig({
        formSchema: validFormSchema,
        documentRequirements: validDocRequirements,
        eligibilityRules: validEligibilityRules,
        selectionConfig: excessQuotas,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.message.includes("cannot exceed 100%"))).toBe(true);
    });

    it("should reject application deadlines that precede opening dates", () => {
      const result = schemeValidationService.validateVersionConfig({
        formSchema: validFormSchema,
        documentRequirements: validDocRequirements,
        eligibilityRules: validEligibilityRules,
        applicationOpenDate: "2026-10-01T00:00:00.000Z",
        applicationDeadline: "2026-05-01T00:00:00.000Z", // Precedes open date!
      });

      expect(result.isValid).toBe(false);
      expect(
        result.errors.some((e) => e.message.includes("strictly after the application open date"))
      ).toBe(true);
    });
  });

  // ==========================================
  // 5. SCHEME SERVICE & DATABASE INTEGRATION
  // ==========================================
  describe("SchemeService Operations & Version Immutability", () => {
    const admin = getDemoUser("SCHEME_ADMIN");
    const officer = getDemoUser("VERIFICATION_OFFICER");
    const applicant = getDemoUser("APPLICANT");

    it("should list active schemes (NFST and NOS) for public access", async () => {
      const activeSchemes = await schemeService.listActiveSchemes();
      expect(activeSchemes.length).toBeGreaterThanOrEqual(2);

      const codes = activeSchemes.map((s) => s.code);
      expect(codes).toContain("NFST");
      expect(codes).toContain("NOS");
    });

    it("should retrieve full declarative SchemeVersionDTO for NFST", async () => {
      const nfstVersion = await schemeService.getActiveVersionByCode("NFST");
      expect(nfstVersion).not.toBeNull();
      expect(nfstVersion?.versionNumber).toBe(1);
      expect(nfstVersion?.formSchema.fields.length).toBeGreaterThan(5);
      expect(nfstVersion?.documentRequirements.requirements.length).toBeGreaterThanOrEqual(3);
      expect(nfstVersion?.eligibilityRules.rules.some((r) => r.ruleKey === "ST_VERIFICATION")).toBe(
        true
      );
    });

    it("should retrieve full declarative SchemeVersionDTO for NOS", async () => {
      const nosVersion = await schemeService.getActiveVersionByCode("NOS");
      expect(nosVersion).not.toBeNull();
      expect(nosVersion?.versionNumber).toBe(1);
      expect(nosVersion?.formSchema.fields.some((f) => f.id === "passportNumber")).toBe(true);
      expect(
        nosVersion?.documentRequirements.requirements.some((d) => d.documentType === "PASSPORT")
      ).toBe(true);
      expect(nosVersion?.eligibilityRules.rules.some((r) => r.ruleKey === "INCOME_CEILING")).toBe(
        true
      );
    });

    it("should block non-admin roles from publishing scheme versions (RBAC)", async () => {
      const candidateConfig: PublishSchemeVersionDTO = {
        formSchema: validFormSchema,
        documentRequirements: validDocRequirements,
        eligibilityRules: validEligibilityRules,
      };

      // Officer attempting to publish
      await expect(
        schemeService.publishVersion("sch_nfst_001", candidateConfig, officer)
      ).rejects.toThrow(/Forbidden/);

      // Applicant attempting to publish
      await expect(
        schemeService.publishVersion("sch_nfst_001", candidateConfig, applicant)
      ).rejects.toThrow(/Forbidden/);
    });

    it("should block non-admin roles from creating new schemes (RBAC)", async () => {
      await expect(
        schemeService.createScheme(
          {
            code: "TEST_SCHEME",
            name: "Test Scheme",
            description: "Description of test scheme",
          },
          officer
        )
      ).rejects.toThrow(/Forbidden/);
    });

    it("should atomically supersede old version when publishing a new version as SCHEME_ADMIN", async () => {
      // Create a dedicated test scheme to keep seed data pristine (max 16 chars)
      const testCode = `TS_${Date.now().toString().slice(-8)}`;
      const testScheme = await schemeService.createScheme(
        {
          code: testCode,
          name: "Test Supersession Scheme",
          description: "Testing version supersession and atomic transaction",
        },
        admin
      );

      const candidateConfig1: PublishSchemeVersionDTO = {
        formSchema: validFormSchema,
        documentRequirements: validDocRequirements,
        eligibilityRules: validEligibilityRules,
        workflowConfig: validWorkflowConfig,
        selectionConfig: validSelectionConfig,
        applicationOpenDate: "2026-04-01T00:00:00.000Z",
        applicationDeadline: "2026-11-30T23:59:59.000Z",
      };

      // 1. Publish v1
      const v1 = await schemeService.publishVersion(testScheme.id, candidateConfig1, admin);
      expect(v1.isActive).toBe(true);
      expect(v1.versionNumber).toBe(1);

      // 2. Publish v2
      const v2 = await schemeService.publishVersion(testScheme.id, candidateConfig1, admin);
      expect(v2.isActive).toBe(true);
      expect(v2.versionNumber).toBe(2);

      // 3. Verify scheme reports v2 as active
      const activeVersion = await schemeService.getActiveVersionByCode(testCode);
      expect(activeVersion?.id).toBe(v2.id);
      expect(activeVersion?.isActive).toBe(true);
      expect(activeVersion?.versionNumber).toBe(2);

      // 4. Verify previous version (v1) was superseded (effectiveTo set and isActive = false)
      const schemeDetails = await schemeService.getSchemeById(testScheme.id, admin);
      const v1Retrieved = schemeDetails?.versions.find((v) => v.versionNumber === 1);
      expect(v1Retrieved?.isActive).toBe(false);
      expect(v1Retrieved?.effectiveTo).not.toBeNull();
    });
  });
});
