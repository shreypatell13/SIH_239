/**
 * Ambiguity & Confidence Verification Module
 * Phase 2G: Deterministic Eligibility & Evidence Verification Engine
 *
 * Core Principles:
 * 1. Low confidence is NOT a failure. Low confidence must produce AMBIGUOUS / REVIEW_REQUIRED.
 * 2. Documents requiring manual review or failed OCR must produce AMBIGUOUS.
 * 3. Conflicting evidence across documents must produce AMBIGUOUS.
 */

import { ExtractedFieldEvidence } from "./types";

export const MIN_CONFIDENCE_THRESHOLD = 0.5;

export interface AmbiguityAssessment {
  isAmbiguous: boolean;
  reasons: string[];
}

/**
 * Evaluates whether an extracted evidence item is ambiguous due to low confidence,
 * degraded document status, or missing extraction.
 */
export function checkEvidenceAmbiguity(
  evidence: ExtractedFieldEvidence | null | undefined,
  fieldKey: string
): AmbiguityAssessment {
  const reasons: string[] = [];

  if (!evidence) {
    reasons.push(
      `Required evidence field '${fieldKey}' was not extracted from any submitted document.`
    );
    return { isAmbiguous: true, reasons };
  }

  // 1. Confidence score threshold check (< 0.50)
  if (evidence.confidenceScore < MIN_CONFIDENCE_THRESHOLD) {
    const pct = Math.round(evidence.confidenceScore * 100);
    reasons.push(
      `OCR extraction confidence for '${fieldKey}' is low (${pct}% < 50%), requiring manual human verification.`
    );
  }

  // 2. Underlying document processing status
  if (evidence.documentStatus === "REVIEW_REQUIRED") {
    reasons.push(
      `Source document (${evidence.documentType}) has been flagged as 'REVIEW_REQUIRED'.`
    );
  } else if (evidence.documentStatus === "FAILED") {
    reasons.push(`Source document (${evidence.documentType}) processing failed during extraction.`);
  }

  return {
    isAmbiguous: reasons.length > 0,
    reasons,
  };
}

/**
 * Checks for conflicting extractions for the same fieldKey across multiple documents.
 */
export function checkConflictingEvidence(
  evidenceList: ExtractedFieldEvidence[],
  fieldKey: string
): AmbiguityAssessment {
  const reasons: string[] = [];
  const matches = evidenceList.filter((e) => e.fieldKey === fieldKey);

  if (matches.length <= 1) {
    return { isAmbiguous: false, reasons: [] };
  }

  // Compare normalized values across extractions
  const distinctValues = new Set(
    matches
      .map((e) => (e.normalizedValue || e.rawValue || "").trim().toLowerCase())
      .filter((v) => v.length > 0)
  );

  if (distinctValues.size > 1) {
    const valueDescriptions = matches
      .map(
        (m) =>
          `"${m.rawValue}" from ${m.documentType} (confidence: ${Math.round(m.confidenceScore * 100)}%)`
      )
      .join("; ");
    reasons.push(`Conflicting extracted values found for '${fieldKey}': ${valueDescriptions}`);
    return { isAmbiguous: true, reasons };
  }

  return { isAmbiguous: false, reasons: [] };
}
