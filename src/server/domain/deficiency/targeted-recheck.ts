import { DeficiencyType, DocumentType, ProcessingStatus } from "@prisma/client";
import { EligibilityRule } from "../scheme/types/eligibility-rules.types";
import { RuleEvaluationResult, ConsistencyCheckItem } from "../eligibility/types";

export function selectAffectedRules(
  rules: EligibilityRule[],
  documentType: string,
  changedFields: string[],
  linkedRuleKey?: string | null
): EligibilityRule[] {
  if (linkedRuleKey) {
    return rules.filter(
      (rule) =>
        rule.ruleKey === linkedRuleKey &&
        rule.isActive &&
        (!rule.dependsOnDocumentTypes?.length ||
          rule.dependsOnDocumentTypes.includes(documentType as DocumentType))
    );
  }
  const changed = new Set(changedFields.map((field) => field.toLowerCase()));
  return rules.filter((rule) => {
    if (!rule.isActive || rule.source !== "EXTRACTED_FIELD") return false;
    const fields = rule.dependsOnFields?.length ? rule.dependsOnFields : [rule.sourceField];
    if (!fields.some((field) => changed.has(field.toLowerCase()))) return false;
    return (
      !rule.dependsOnDocumentTypes?.length ||
      rule.dependsOnDocumentTypes.includes(documentType as DocumentType)
    );
  });
}

export interface TargetedDeficiencyEvidenceInput {
  deficiencyType: DeficiencyType;
  documentStatus: ProcessingStatus | null;
  hasReplacement: boolean;
  affectedRules: RuleEvaluationResult[];
  consistencyChecks: ConsistencyCheckItem[];
  validityWindowMonths?: number | null;
  extractedFields?: Array<{ fieldKey: string; normalizedValue: string | null; rawValue: string }>;
  now?: Date;
}

export function evaluateDeficiencyEvidence(params: TargetedDeficiencyEvidenceInput): {
  isResolved: boolean;
  reviewRequired: boolean;
  explanation: string;
} {
  const { deficiencyType, documentStatus, hasReplacement, affectedRules, consistencyChecks } =
    params;
  if (
    !hasReplacement ||
    !documentStatus ||
    documentStatus === "PENDING" ||
    documentStatus === "PROCESSING"
  ) {
    return {
      isResolved: false,
      reviewRequired: true,
      explanation: "Awaiting replacement evidence processing or officer clarification review.",
    };
  }
  if (documentStatus !== "COMPLETED") {
    return {
      isResolved: false,
      reviewRequired: documentStatus === "REVIEW_REQUIRED",
      explanation:
        documentStatus === "REVIEW_REQUIRED"
          ? "Replacement evidence requires officer review."
          : "Replacement evidence did not complete processing.",
    };
  }

  if (deficiencyType === DeficiencyType.DOCUMENT_EXPIRED) {
    const fields = params.extractedFields || [];
    const valueFor = (keys: string[]) =>
      fields.find((field) => keys.includes(field.fieldKey.toLowerCase()));
    const expiry = valueFor(["expirydate", "validuntil", "validitydate"]);
    const issue = valueFor(["issuedate", "issuedon", "dateofissue", "certificateissuedate"]);
    const text =
      expiry?.normalizedValue || expiry?.rawValue || issue?.normalizedValue || issue?.rawValue;
    const date = text ? new Date(text) : null;
    if (!date || Number.isNaN(date.getTime())) {
      return {
        isResolved: false,
        reviewRequired: true,
        explanation:
          "The replacement has no readable issue or expiry date; officer review is required.",
      };
    }
    let validUntil = date;
    if (expiry) {
      // Expiry values are compared directly.
    } else {
      if (!issue || params.validityWindowMonths == null) {
        return {
          isResolved: false,
          reviewRequired: true,
          explanation:
            "The configured validity period or issue date is unavailable; officer review is required.",
        };
      }
      validUntil = new Date(date);
      validUntil.setMonth(validUntil.getMonth() + params.validityWindowMonths);
    }
    const valid = validUntil.getTime() > (params.now || new Date()).getTime();
    return valid
      ? {
          isResolved: true,
          reviewRequired: false,
          explanation: expiry
            ? "The replacement document is valid through its extracted expiry date."
            : "The replacement document is within the configured validity period.",
        }
      : {
          isResolved: false,
          reviewRequired: false,
          explanation: expiry
            ? "The replacement document remains expired."
            : "The replacement document remains outside the configured validity period.",
        };
  }

  if (affectedRules.some((rule) => rule.outcome === "AMBIGUOUS" || rule.outcome === "SKIPPED")) {
    return {
      isResolved: false,
      reviewRequired: true,
      explanation: "The affected rule remains ambiguous and requires officer review.",
    };
  }
  if (affectedRules.some((rule) => rule.outcome === "FAIL")) {
    return {
      isResolved: false,
      reviewRequired: false,
      explanation: "The affected eligibility condition remains unmet.",
    };
  }
  if (deficiencyType === DeficiencyType.DATA_MISMATCH && consistencyChecks.length > 0) {
    const failed = consistencyChecks.some((check) => !check.isConsistent);
    return failed
      ? {
          isResolved: false,
          reviewRequired: false,
          explanation: "The document-specific consistency check still reports a mismatch.",
        }
      : {
          isResolved: true,
          reviewRequired: false,
          explanation: "The corrected document now passes its consistency check.",
        };
  }
  if (affectedRules.length > 0 && affectedRules.every((rule) => rule.outcome === "PASS")) {
    return {
      isResolved: true,
      reviewRequired: false,
      explanation: "The deficiency-linked rule passed using the replacement evidence.",
    };
  }
  if (deficiencyType === DeficiencyType.DOCUMENT_MISSING) {
    return {
      isResolved: true,
      reviewRequired: false,
      explanation: "The required replacement document was processed successfully.",
    };
  }
  if (deficiencyType === DeficiencyType.DOCUMENT_ILLEGIBLE) {
    if (params.extractedFields?.length)
      return {
        isResolved: true,
        reviewRequired: false,
        explanation: "The replacement document produced readable extracted evidence.",
      };
    return {
      isResolved: false,
      reviewRequired: true,
      explanation:
        "The replacement document did not produce readable fields and requires officer inspection.",
    };
  }
  return {
    isResolved: false,
    reviewRequired: true,
    explanation:
      "No specific passing rule or consistency check is linked to this deficiency; officer review is required.",
  };
}
