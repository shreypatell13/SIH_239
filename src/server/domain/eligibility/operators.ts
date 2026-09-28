/**
 * Deterministic Eligibility Operators Evaluator
 * Phase 2G: Deterministic Eligibility & Evidence Verification Engine
 *
 * Implements pure mathematical & relational operators for eligibility DSL.
 * Grounding Rule: NO dynamic code execution. Pure, side-effect free logic.
 */

import { RuleOperator, StRelaxationConfig } from "../scheme/types/eligibility-rules.types";
import { RuleOutcome, StRelaxationApplied } from "./types";

export interface OperatorEvaluationInput {
  operator: RuleOperator;
  resolvedValue: unknown;
  threshold: string | number | boolean | string[];
  isCandidateSt: boolean;
  stRelaxation?: StRelaxationConfig;
  failureMessageTemplate?: string;
  referenceDate?: Date;
}

export interface OperatorEvaluationOutput {
  outcome: RuleOutcome;
  computedValueString: string;
  expectedValueString: string;
  failureReason?: string;
  appliedRelaxation?: StRelaxationApplied;
}

/**
 * Format explainable failure message by replacing placeholders:
 * {computedValue}, {expectedValue}, {threshold}
 */
export function formatFailureMessage(
  template: string | undefined,
  computedValue: string,
  expectedValue: string
): string {
  if (!template || template.trim() === "") {
    return `Value '${computedValue}' did not meet the required criteria (expected: '${expectedValue}').`;
  }
  return template
    .replace(/{computedValue}/g, computedValue)
    .replace(/{expectedValue}/g, expectedValue)
    .replace(/{threshold}/g, expectedValue);
}

/**
 * Safe numeric conversion helper.
 */
function parseNumeric(val: unknown): number | null {
  if (val === null || val === undefined) return null;
  if (typeof val === "number" && !isNaN(val)) return val;
  if (typeof val === "string") {
    // Strip common currency symbols, commas, percent signs
    const cleaned = val.replace(/[₹$,%]/g, "").trim();
    const num = Number(cleaned);
    return isNaN(num) ? null : num;
  }
  return null;
}

/**
 * Safe string normalization helper for comparison.
 */
function normalizeString(val: unknown): string {
  if (val === null || val === undefined) return "";
  return String(val).trim().toLowerCase();
}

/**
 * Evaluates a single rule operator deterministically against the resolved value.
 */
export function evaluateOperator(input: OperatorEvaluationInput): OperatorEvaluationOutput {
  const {
    operator,
    resolvedValue,
    threshold,
    isCandidateSt,
    stRelaxation,
    failureMessageTemplate,
    referenceDate = new Date(),
  } = input;

  let computedValueString =
    resolvedValue === null || resolvedValue === undefined
      ? "NOT_PROVIDED"
      : typeof resolvedValue === "object"
        ? JSON.stringify(resolvedValue)
        : String(resolvedValue);

  let expectedValueString = Array.isArray(threshold) ? threshold.join(", ") : String(threshold);

  let effectiveThreshold = threshold;
  let appliedRelaxation: StRelaxationApplied | undefined;

  // Handle ST relaxation if candidate is verified ST and numeric threshold is applicable
  if (isCandidateSt && stRelaxation && typeof stRelaxation.addToThreshold === "number") {
    const origNum = parseNumeric(threshold);
    if (origNum !== null) {
      const relaxedNum = origNum + stRelaxation.addToThreshold;
      effectiveThreshold = relaxedNum;
      expectedValueString = `${relaxedNum} (Base: ${origNum} + ST Relaxation: +${stRelaxation.addToThreshold})`;
      appliedRelaxation = {
        originalThreshold: threshold,
        relaxedThreshold: relaxedNum,
        addToThreshold: stRelaxation.addToThreshold,
        reason: `ST relaxation of +${stRelaxation.addToThreshold} applied to standard threshold.`,
      };
    }
  }

  // If value is missing / undefined / null
  if (resolvedValue === null || resolvedValue === undefined) {
    if (operator === "IS_PRESENT") {
      return {
        outcome: "FAIL",
        computedValueString: "NOT_PROVIDED",
        expectedValueString: "PRESENT",
        failureReason: formatFailureMessage(
          failureMessageTemplate,
          "NOT_PROVIDED",
          expectedValueString
        ),
      };
    }
    return {
      outcome: "AMBIGUOUS",
      computedValueString: "NOT_PROVIDED",
      expectedValueString,
      failureReason: `Input value for rule is missing or not provided.`,
    };
  }

  let isPass = false;

  switch (operator) {
    case "EQUALS": {
      if (typeof resolvedValue === "boolean" || typeof effectiveThreshold === "boolean") {
        isPass = Boolean(resolvedValue) === Boolean(effectiveThreshold);
      } else {
        const strVal = normalizeString(resolvedValue);
        const strThreshold = normalizeString(effectiveThreshold);
        isPass = strVal === strThreshold;
      }
      break;
    }

    case "NOT_EQUALS": {
      if (typeof resolvedValue === "boolean" || typeof effectiveThreshold === "boolean") {
        isPass = Boolean(resolvedValue) !== Boolean(effectiveThreshold);
      } else {
        const strVal = normalizeString(resolvedValue);
        const strThreshold = normalizeString(effectiveThreshold);
        isPass = strVal !== strThreshold;
      }
      break;
    }

    case "LESS_THAN": {
      const valNum = parseNumeric(resolvedValue);
      const threshNum = parseNumeric(effectiveThreshold);
      if (valNum === null || threshNum === null) {
        return {
          outcome: "AMBIGUOUS",
          computedValueString,
          expectedValueString,
          failureReason: `Cannot perform numeric comparison on non-numeric value '${computedValueString}'.`,
        };
      }
      isPass = valNum < threshNum;
      break;
    }

    case "LESS_THAN_OR_EQUALS": {
      const valNum = parseNumeric(resolvedValue);
      const threshNum = parseNumeric(effectiveThreshold);
      if (valNum === null || threshNum === null) {
        return {
          outcome: "AMBIGUOUS",
          computedValueString,
          expectedValueString,
          failureReason: `Cannot perform numeric comparison on non-numeric value '${computedValueString}'.`,
        };
      }
      isPass = valNum <= threshNum;
      break;
    }

    case "GREATER_THAN": {
      const valNum = parseNumeric(resolvedValue);
      const threshNum = parseNumeric(effectiveThreshold);
      if (valNum === null || threshNum === null) {
        return {
          outcome: "AMBIGUOUS",
          computedValueString,
          expectedValueString,
          failureReason: `Cannot perform numeric comparison on non-numeric value '${computedValueString}'.`,
        };
      }
      isPass = valNum > threshNum;
      break;
    }

    case "GREATER_THAN_OR_EQUALS": {
      const valNum = parseNumeric(resolvedValue);
      const threshNum = parseNumeric(effectiveThreshold);
      if (valNum === null || threshNum === null) {
        return {
          outcome: "AMBIGUOUS",
          computedValueString,
          expectedValueString,
          failureReason: `Cannot perform numeric comparison on non-numeric value '${computedValueString}'.`,
        };
      }
      isPass = valNum >= threshNum;
      break;
    }

    case "IN": {
      const allowedList: string[] = Array.isArray(effectiveThreshold)
        ? (effectiveThreshold as string[]).map(normalizeString)
        : typeof effectiveThreshold === "string"
          ? effectiveThreshold.split(",").map((s) => s.trim().toLowerCase())
          : [normalizeString(effectiveThreshold)];

      const valStr = normalizeString(resolvedValue);
      isPass = allowedList.includes(valStr);
      break;
    }

    case "NOT_IN": {
      const disallowedList: string[] = Array.isArray(effectiveThreshold)
        ? (effectiveThreshold as string[]).map(normalizeString)
        : typeof effectiveThreshold === "string"
          ? effectiveThreshold.split(",").map((s) => s.trim().toLowerCase())
          : [normalizeString(effectiveThreshold)];

      const valStr = normalizeString(resolvedValue);
      isPass = !disallowedList.includes(valStr);
      break;
    }

    case "MATCHES_REGEX": {
      try {
        const patternStr = String(effectiveThreshold);
        const regex = new RegExp(patternStr, "i");
        isPass = regex.test(String(resolvedValue));
      } catch (err) {
        return {
          outcome: "AMBIGUOUS",
          computedValueString,
          expectedValueString,
          failureReason: `Invalid regular expression pattern: ${String(effectiveThreshold)}.`,
        };
      }
      break;
    }

    case "IS_PRESENT": {
      if (resolvedValue === null || resolvedValue === undefined) {
        isPass = false;
      } else if (typeof resolvedValue === "string") {
        isPass = resolvedValue.trim().length > 0;
      } else {
        isPass = true;
      }
      break;
    }

    case "WITHIN_MONTHS": {
      const maxMonths = parseNumeric(effectiveThreshold);
      if (maxMonths === null || maxMonths <= 0) {
        return {
          outcome: "AMBIGUOUS",
          computedValueString,
          expectedValueString,
          failureReason: `WITHIN_MONTHS requires a positive numeric threshold.`,
        };
      }

      const dateVal =
        resolvedValue instanceof Date
          ? resolvedValue
          : typeof resolvedValue === "string" || typeof resolvedValue === "number"
            ? new Date(resolvedValue)
            : null;

      if (!dateVal || isNaN(dateVal.getTime())) {
        return {
          outcome: "AMBIGUOUS",
          computedValueString,
          expectedValueString,
          failureReason: `Value '${computedValueString}' cannot be parsed as a valid date for WITHIN_MONTHS comparison.`,
        };
      }

      const diffTime = Math.abs(referenceDate.getTime() - dateVal.getTime());
      const diffMonths = diffTime / (1000 * 60 * 60 * 24 * 30.4375);
      isPass = diffMonths <= maxMonths;
      computedValueString = `${Math.round(diffMonths * 10) / 10} months ago (${dateVal.toISOString().split("T")[0]})`;
      expectedValueString = `Within ${maxMonths} months`;
      break;
    }

    default:
      return {
        outcome: "AMBIGUOUS",
        computedValueString,
        expectedValueString,
        failureReason: `Unsupported rule operator '${operator}'.`,
      };
  }

  if (isPass) {
    return {
      outcome: "PASS",
      computedValueString,
      expectedValueString,
      appliedRelaxation,
    };
  } else {
    const failureReason = formatFailureMessage(
      failureMessageTemplate,
      computedValueString,
      expectedValueString
    );
    return {
      outcome: "FAIL",
      computedValueString,
      expectedValueString,
      failureReason,
      appliedRelaxation,
    };
  }
}
