/**
 * Deterministic Eligibility & Verification Engine Domain Types
 * Phase 2G: Deterministic Eligibility & Evidence Verification Engine
 *
 * Grounding Rule: PURE DETERMINISTIC EVALUATION.
 * NO LLMs, NO arbitrary JS eval(), NO unsafe dynamic SQL.
 */

import { RuleOutcome } from "@prisma/client";
import {
  RuleOperator,
  RuleSource,
  RuleSeverity,
  StRelaxationConfig,
} from "../scheme/types/eligibility-rules.types";

export type { RuleOutcome, RuleSeverity, RuleOperator, RuleSource, StRelaxationConfig };

/**
 * High-level deterministic assessment outcome for the whole application.
 * Note: This does NOT autonomously approve or reject an application.
 * Final decisions belong strictly to human verification officers and committees.
 */
export type AssessmentStatus = "ELIGIBLE_ASSESSED" | "NOT_ELIGIBLE_ASSESSED" | "REVIEW_REQUIRED";

export interface StRelaxationApplied {
  originalThreshold: string | number | boolean | string[];
  relaxedThreshold: string | number | boolean | string[];
  addToThreshold: number;
  reason: string;
}

export interface RuleEvaluationResult {
  ruleKey: string;
  ruleName: string;
  ruleDescription: string;
  outcome: RuleOutcome;
  severity: RuleSeverity;
  source: RuleSource;
  sourceField: string;
  operator: RuleOperator;
  computedValue?: string;
  expectedValue?: string;
  failureReason?: string;
  evidenceFieldIds: string[];
  ambiguityReasons?: string[];
  appliedRelaxation?: StRelaxationApplied;
}

export interface ConsistencyCheckItem {
  fieldKey: string;
  fieldLabel: string;
  formValue: string;
  extractedValue: string;
  extractedConfidence: number;
  documentType: string;
  documentId: string;
  isConsistent: boolean;
  similarityScore?: number;
  mismatchExplanation?: string;
}

export interface EvaluationSummary {
  totalRules: number;
  passed: number;
  failed: number;
  ambiguous: number;
  skipped: number;
  hardFails: number;
  softFlags: number;
}

export interface ApplicationEvaluationResult {
  applicationId: string;
  caseDossierId: string;
  schemeVersionId: string;
  schemeCode: string;
  versionNumber: number;
  runId: string;
  evaluatedAt: Date;
  assessmentStatus: AssessmentStatus;
  summary: EvaluationSummary;
  ruleResults: RuleEvaluationResult[];
  consistencyChecks: ConsistencyCheckItem[];
}

export interface ExtractedFieldEvidence {
  id: string;
  documentId: string;
  documentType: string;
  fieldKey: string;
  rawValue: string;
  normalizedValue: string | null;
  confidenceScore: number;
  pageNumber: number;
  sourceSnippet: string | null;
  documentStatus: string;
}
