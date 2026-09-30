/**
 * Deterministic Input & Evidence Resolver
 * Phase 2G: Deterministic Eligibility & Evidence Verification Engine
 *
 * Grounding Rule: Resolves values strictly from Application, ApplicantProfile,
 * and CaseDossier documents/extractedFields without side-effects or external calls.
 */

import { EligibilityRule } from "../scheme/types/eligibility-rules.types";
import { ExtractedFieldEvidence } from "./types";

export interface ResolvedRuleInput {
  value: unknown;
  evidenceFieldIds: string[];
  evidenceList: ExtractedFieldEvidence[];
  isComputed: boolean;
  computedDescription?: string;
}

export interface ApplicationResolutionContext {
  formData: Record<string, unknown>;
  applicantProfile: {
    category?: string | null;
    dateOfBirth?: Date | string | null;
    annualFamilyIncome?: number | null;
    percentageObtained?: number | null;
    stateDomicile?: string | null;
    user?: { name?: string | null };
  };
  extractedEvidences: ExtractedFieldEvidence[];
  submittedAt?: Date | string | null;
}

/**
 * Calculates exact age in full years from date of birth relative to reference date.
 */
export function calculateAgeInYears(
  dateOfBirth: Date | string | null | undefined,
  referenceDate: Date = new Date()
): number | null {
  if (!dateOfBirth) return null;
  const dob = typeof dateOfBirth === "string" ? new Date(dateOfBirth) : dateOfBirth;
  if (isNaN(dob.getTime())) return null;

  let age = referenceDate.getFullYear() - dob.getFullYear();
  const monthDiff = referenceDate.getMonth() - dob.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && referenceDate.getDate() < dob.getDate())) {
    age--;
  }

  return age;
}

/**
 * Resolves the input value for a given eligibility rule based on its source declaration.
 */
export function resolveRuleInput(
  rule: EligibilityRule,
  ctx: ApplicationResolutionContext
): ResolvedRuleInput {
  const { formData, applicantProfile, extractedEvidences, submittedAt } = ctx;

  switch (rule.source) {
    case "FORM_DATA": {
      const formVal = formData[rule.sourceField];
      const profileVal = (applicantProfile as Record<string, unknown>)[rule.sourceField];
      const resolvedVal =
        formVal !== undefined && formVal !== null && formVal !== ""
          ? formVal
          : profileVal !== undefined && profileVal !== null && profileVal !== ""
            ? profileVal
            : null;

      // Associate corresponding extracted evidence fields for human-in-the-loop verification
      const targetKey = rule.sourceField.trim().toLowerCase();
      const matches = extractedEvidences.filter((e) => {
        const k = e.fieldKey.trim().toLowerCase();
        return (
          k === targetKey ||
          (targetKey === "academicpercentage" && (k === "percentagemarks" || k === "percentage")) ||
          (targetKey === "castecategory" && (k === "castecategory" || k === "tribename")) ||
          (targetKey === "annualfamilyincome" && k === "annualfamilyincome")
        );
      });

      return {
        value: resolvedVal,
        evidenceFieldIds: matches.map((m) => m.id),
        evidenceList: matches,
        isComputed: false,
      };
    }

    case "EXTRACTED_FIELD": {
      // Find matching extracted fields by fieldKey (case-insensitive)
      const targetKey = rule.sourceField.trim().toLowerCase();
      const matches = extractedEvidences.filter(
        (e) => e.fieldKey.trim().toLowerCase() === targetKey
      );

      if (matches.length === 0) {
        return {
          value: null,
          evidenceFieldIds: [],
          evidenceList: [],
          isComputed: false,
        };
      }

      // Pick highest confidence extraction
      const sorted = [...matches].sort((a, b) => b.confidenceScore - a.confidenceScore);
      const best = sorted[0];

      return {
        value: best.normalizedValue || best.rawValue,
        evidenceFieldIds: matches.map((m) => m.id),
        evidenceList: matches,
        isComputed: false,
      };
    }

    case "COMPUTED": {
      const compKey = rule.sourceField.trim().toLowerCase();
      const refDate = submittedAt ? new Date(submittedAt) : new Date();

      if (compKey === "age" || compKey === "ageinyears" || compKey === "applicantage") {
        const dob = formData.dateOfBirth || applicantProfile.dateOfBirth;
        const calculatedAge = calculateAgeInYears(dob as string | Date, refDate);
        return {
          value: calculatedAge,
          evidenceFieldIds: [],
          evidenceList: [],
          isComputed: true,
          computedDescription: `Calculated exact age (${calculatedAge} years) from Date of Birth relative to ${refDate.toISOString().split("T")[0]}.`,
        };
      }

      if (
        compKey === "academicpercentage" ||
        compKey === "percentage" ||
        compKey === "qualifyingscore"
      ) {
        const pct =
          formData.academicPercentage ??
          formData.percentageMarks ??
          applicantProfile.percentageObtained;
        return {
          value: pct,
          evidenceFieldIds: [],
          evidenceList: [],
          isComputed: true,
          computedDescription: `Derived academic score (${pct}%) from declared application records.`,
        };
      }

      if (compKey === "stcategoryverified" || compKey === "is_st") {
        const declaredCat = formData.casteCategory || applicantProfile.category;
        const isDeclaredSt = String(declaredCat).trim().toUpperCase() === "ST";
        return {
          value: isDeclaredSt,
          evidenceFieldIds: [],
          evidenceList: [],
          isComputed: true,
          computedDescription: `ST category assertion based on declared profile/form records.`,
        };
      }

      // If there is a generic custom computed field, attempt fallback to formData
      const genericVal =
        formData[rule.sourceField] ??
        (applicantProfile as Record<string, unknown>)[rule.sourceField];
      return {
        value: genericVal ?? null,
        evidenceFieldIds: [],
        evidenceList: [],
        isComputed: true,
        computedDescription: `Evaluated computed field '${rule.sourceField}'.`,
      };
    }

    default:
      return {
        value: null,
        evidenceFieldIds: [],
        evidenceList: [],
        isComputed: false,
      };
  }
}
