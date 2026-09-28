import { describe, expect, it } from "vitest";
import { DeficiencyType } from "@prisma/client";
import { EligibilityRule } from "@/server/domain/scheme/types/eligibility-rules.types";
import {
  selectAffectedRules,
  evaluateDeficiencyEvidence,
} from "@/server/domain/deficiency/targeted-recheck";

const rule = (ruleKey: string, sourceField: string, documentTypes?: any[]): EligibilityRule => ({
  ruleKey,
  name: ruleKey,
  description: ruleKey,
  source: "EXTRACTED_FIELD",
  sourceField,
  operator: "IS_PRESENT",
  threshold: true,
  failureMessage: "Missing",
  severity: "HARD_FAIL",
  isActive: true,
  ...(documentTypes ? { dependsOnDocumentTypes: documentTypes } : {}),
});

describe("targeted deficiency rechecks", () => {
  it("selects only rules dependent on corrected fields and document type", () => {
    const selected = selectAffectedRules(
      [
        rule("NAME_MATCH", "applicantName", ["CASTE_CERTIFICATE"]),
        rule("INCOME_MATCH", "annualIncome", ["INCOME_CERTIFICATE"]),
        { ...rule("DISABLED", "applicantName"), isActive: false },
      ],
      "CASTE_CERTIFICATE",
      ["applicantName"]
    );
    expect(selected.map((item) => item.ruleKey)).toEqual(["NAME_MATCH"]);
  });
  it("targets the deficiency-linked rule even when no other field changed", () => {
    expect(
      selectAffectedRules(
        [rule("RULE_A", "income"), rule("RULE_B", "name")],
        "OTHER",
        [],
        "RULE_B"
      ).map((r) => r.ruleKey)
    ).toEqual(["RULE_B"]);
  });
  it("resolves only a missing-document deficiency after completed replacement processing", () => {
    expect(
      evaluateDeficiencyEvidence({
        deficiencyType: DeficiencyType.DOCUMENT_MISSING,
        documentStatus: "COMPLETED",
        hasReplacement: true,
        affectedRules: [],
        consistencyChecks: [],
      }).isResolved
    ).toBe(true);
    expect(
      evaluateDeficiencyEvidence({
        deficiencyType: DeficiencyType.DOCUMENT_MISSING,
        documentStatus: "FAILED",
        hasReplacement: true,
        affectedRules: [],
        consistencyChecks: [],
      }).isResolved
    ).toBe(false);
  });
  it("checks expired replacements against their configured validity window", () => {
    const now = new Date("2026-09-01T00:00:00Z");
    const args = {
      deficiencyType: DeficiencyType.DOCUMENT_EXPIRED,
      documentStatus: "COMPLETED" as const,
      hasReplacement: true,
      affectedRules: [],
      consistencyChecks: [],
      validityWindowMonths: 12,
      now,
    };
    expect(
      evaluateDeficiencyEvidence({
        ...args,
        extractedFields: [{ fieldKey: "issueDate", rawValue: "2026-03-01", normalizedValue: null }],
      }).isResolved
    ).toBe(true);
    expect(
      evaluateDeficiencyEvidence({
        ...args,
        extractedFields: [{ fieldKey: "issueDate", rawValue: "2024-03-01", normalizedValue: null }],
      }).isResolved
    ).toBe(false);
    expect(evaluateDeficiencyEvidence({ ...args, extractedFields: [] }).reviewRequired).toBe(true);
  });

  it("requires the affected condition to pass and keeps ambiguity for officer review", () => {
    const passing = {
      ruleKey: "R",
      ruleName: "R",
      ruleDescription: "",
      outcome: "PASS",
      severity: "HARD_FAIL",
      source: "EXTRACTED_FIELD",
      sourceField: "name",
      operator: "IS_PRESENT",
      evidenceFieldIds: [],
    } as any;
    const failing = { ...passing, outcome: "FAIL" };
    expect(
      evaluateDeficiencyEvidence({
        deficiencyType: DeficiencyType.CUSTOM,
        documentStatus: "COMPLETED",
        hasReplacement: true,
        affectedRules: [passing],
        consistencyChecks: [],
      }).isResolved
    ).toBe(true);
    expect(
      evaluateDeficiencyEvidence({
        deficiencyType: DeficiencyType.CUSTOM,
        documentStatus: "COMPLETED",
        hasReplacement: true,
        affectedRules: [failing],
        consistencyChecks: [],
      }).isResolved
    ).toBe(false);
    expect(
      evaluateDeficiencyEvidence({
        deficiencyType: DeficiencyType.DATA_MISMATCH,
        documentStatus: "REVIEW_REQUIRED",
        hasReplacement: true,
        affectedRules: [],
        consistencyChecks: [],
      }).reviewRequired
    ).toBe(true);
    expect(
      evaluateDeficiencyEvidence({
        deficiencyType: DeficiencyType.DATA_MISMATCH,
        documentStatus: "COMPLETED",
        hasReplacement: true,
        affectedRules: [],
        consistencyChecks: [],
      }).isResolved
    ).toBe(false);
  });
});
