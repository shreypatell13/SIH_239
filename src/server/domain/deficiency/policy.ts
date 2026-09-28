/**
 * Deficiency Business Policy & Lifecycle Rules
 * Phase 2H: Deficiency Management & Targeted Recheck Engine
 *
 * Grounding Rule: Enforces strict state transitions and server-side policy.
 */

import { DeficiencyStatus, RecheckStatus } from "@prisma/client";
import { WorkflowConfig } from "../scheme/types/workflow-config.types";

export const DEFAULT_DEFICIENCY_WINDOW_DAYS = 14;

/**
 * Valid state transitions for DeficiencyStatus
 */
const ALLOWED_STATUS_TRANSITIONS: Record<DeficiencyStatus, DeficiencyStatus[]> = {
  OPEN: ["RESOLVED", "WAIVED", "EXPIRED"],
  RESOLVED: ["OPEN"], // Can be reopened if a subsequent check fails
  WAIVED: ["OPEN"],
  EXPIRED: ["OPEN"],
};

/**
 * Validates whether a proposed status transition is permitted by the state machine.
 */
export function isValidDeficiencyTransition(
  currentStatus: DeficiencyStatus,
  targetStatus: DeficiencyStatus
): boolean {
  if (currentStatus === targetStatus) return true;
  const allowed = ALLOWED_STATUS_TRANSITIONS[currentStatus] || [];
  return allowed.includes(targetStatus);
}

/**
 * Calculates response deadline based on scheme workflow configuration or defaults.
 */
export function calculateResponseDeadline(
  workflowConfig?: WorkflowConfig | null,
  fromDate: Date = new Date()
): Date {
  const windowDays =
    workflowConfig?.deficiencyResponseWindowDays && workflowConfig.deficiencyResponseWindowDays > 0
      ? workflowConfig.deficiencyResponseWindowDays
      : DEFAULT_DEFICIENCY_WINDOW_DAYS;

  const deadline = new Date(fromDate.getTime());
  deadline.setDate(deadline.getDate() + windowDays);
  return deadline;
}

/**
 * Checks if a deficiency has passed its response deadline.
 */
export function isDeficiencyExpired(
  deadline: Date | string | null | undefined,
  referenceDate: Date = new Date()
): boolean {
  if (!deadline) return false;
  const target = typeof deadline === "string" ? new Date(deadline) : deadline;
  return target.getTime() < referenceDate.getTime();
}

/**
 * Determines whether a targeted recheck result qualifies for automatic deficiency resolution.
 */
export function evaluateDeficiencyResolution(params: {
  documentStatus?: string;
  hasPassingEvidence: boolean;
  ruleOutcome?: string;
}): { isResolved: boolean; recheckStatus: RecheckStatus; explanation: string } {
  const { documentStatus, hasPassingEvidence, ruleOutcome } = params;

  // If document processing failed, cannot resolve
  if (documentStatus === "FAILED") {
    return {
      isResolved: false,
      recheckStatus: "RECHECKED_FAIL",
      explanation: "Replacement document processing failed during automated OCR/extraction.",
    };
  }

  // If document requires manual review, remains open for officer
  if (documentStatus === "REVIEW_REQUIRED") {
    return {
      isResolved: false,
      recheckStatus: "PENDING_RECHECK",
      explanation: "Replacement document requires verification officer inspection.",
    };
  }

  // If rule failed, remains open
  if (ruleOutcome === "FAIL") {
    return {
      isResolved: false,
      recheckStatus: "RECHECKED_FAIL",
      explanation: "Eligibility rule evaluation criteria still not satisfied by new submission.",
    };
  }

  // If document completed and evidence / rule passes
  if (documentStatus === "COMPLETED" && (hasPassingEvidence || ruleOutcome === "PASS")) {
    return {
      isResolved: true,
      recheckStatus: "RECHECKED_PASS",
      explanation: "Replacement document verified successfully against required criteria.",
    };
  }

  // Default: Pending recheck
  return {
    isResolved: false,
    recheckStatus: "PENDING_RECHECK",
    explanation: "Recheck in progress or requires further verification.",
  };
}
