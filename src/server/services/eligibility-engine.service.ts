/**
 * Deterministic Eligibility & Evidence Verification Service
 * Phase 2G: Deterministic Eligibility & Evidence Verification Engine
 *
 * Core Principles:
 * 1. PURE DETERMINISTIC EVALUATION (No LLMs, No eval(), No dynamic SQL).
 * 2. PINNED SCHEME VERSION (Strictly evaluate using application.schemeVersionId).
 * 3. LOW CONFIDENCE IS NOT FAILURE (Confidence < 0.50 or degraded doc yields AMBIGUOUS).
 * 4. DISCREPANCY IS NOT FRAUD (Inconsistencies yield AMBIGUOUS/REVIEW_REQUIRED).
 * 5. NO AUTONOMOUS FINAL DECISIONS (Outputs system assessment for human review).
 * 6. NO DEFICIENCY CREATION (Owned exclusively by Phase 2H).
 */

import { randomUUID } from "crypto";
import { prisma } from "../db";
import { AuthenticatedUser } from "../auth/roles";
import { UserRole, RuleOutcome, Prisma } from "@prisma/client";
import {
  ApplicationEvaluationResult,
  AssessmentStatus,
  EvaluationSummary,
  ExtractedFieldEvidence,
  RuleEvaluationResult,
} from "../domain/eligibility/types";
import { evaluateOperator } from "../domain/eligibility/operators";
import { resolveRuleInput } from "../domain/eligibility/input-resolver";
import { checkEvidenceAmbiguity, checkConflictingEvidence } from "../domain/eligibility/ambiguity";
import { runConsistencyChecks } from "../domain/eligibility/consistency-engine";
import {
  EligibilityRule,
  EligibilityRulesSchema,
} from "../domain/scheme/types/eligibility-rules.types";
import { ruleResultRepository } from "../repositories/rule-result.repository";

export class EligibilityEngineService {
  /**
   * Evaluates an application deterministically against its pinned scheme version rules.
   */
  async evaluateApplication(
    applicationId: string,
    actor?: AuthenticatedUser | { id: string; role: "SYSTEM" }
  ): Promise<ApplicationEvaluationResult> {
    // 1. Authorize Actor
    if (actor && actor.role !== "SYSTEM") {
      const allowedRoles: UserRole[] = [
        UserRole.VERIFICATION_OFFICER,
        UserRole.SCHEME_ADMIN,
        UserRole.OPERATIONS_DIRECTOR,
      ];
      if (!allowedRoles.includes(actor.role as UserRole)) {
        throw new Error(
          `Forbidden: User with role '${actor.role}' is not authorized to trigger eligibility evaluation.`
        );
      }
    }

    // 2. Fetch Application with Pinned SchemeVersion, ApplicantProfile, and CaseDossier
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        schemeVersion: {
          include: { scheme: true },
        },
        applicantProfile: {
          include: { user: true },
        },
        caseDossier: {
          include: {
            documents: {
              where: { isLatestVersion: true },
              include: { extractedFields: true },
            },
          },
        },
      },
    });

    if (!application) {
      throw new Error(`Application with ID '${applicationId}' not found.`);
    }

    if (!application.caseDossier) {
      throw new Error(`Application '${applicationId}' is missing an associated CaseDossier.`);
    }

    const { schemeVersion, applicantProfile, caseDossier } = application;
    const formData = (application.formData || {}) as Record<string, unknown>;

    // 3. Compile Extracted Field Evidences across latest documents
    const extractedEvidences: ExtractedFieldEvidence[] = [];
    for (const doc of caseDossier.documents) {
      for (const f of doc.extractedFields) {
        extractedEvidences.push({
          id: f.id,
          documentId: doc.id,
          documentType: doc.documentType,
          fieldKey: f.fieldKey,
          rawValue: f.rawValue,
          normalizedValue: f.normalizedValue,
          confidenceScore: f.confidenceScore,
          pageNumber: f.pageNumber,
          sourceSnippet: f.sourceSnippet,
          documentStatus: doc.processingStatus,
        });
      }
    }

    // 4. Parse Eligibility Rules from Pinned Scheme Version
    const rawRulesSchema = schemeVersion.eligibilityRules as unknown as EligibilityRulesSchema;
    const rulesList: EligibilityRule[] = Array.isArray(rawRulesSchema?.rules)
      ? rawRulesSchema.rules
      : [];

    const isCandidateSt =
      String(formData.casteCategory || applicantProfile.category)
        .trim()
        .toUpperCase() === "ST";

    const runId = randomUUID();
    const evaluatedAt = new Date();
    const ruleEvaluationResults: RuleEvaluationResult[] = [];

    // 5. Evaluate Every Rule Deterministically
    for (const rule of rulesList) {
      if (!rule.isActive) {
        ruleEvaluationResults.push({
          ruleKey: rule.ruleKey,
          ruleName: rule.name || rule.ruleKey,
          ruleDescription: rule.description || "",
          outcome: "SKIPPED",
          severity: rule.severity,
          source: rule.source,
          sourceField: rule.sourceField,
          operator: rule.operator,
          evidenceFieldIds: [],
        });
        continue;
      }

      // Resolve Input
      const resolution = resolveRuleInput(rule, {
        formData,
        applicantProfile,
        extractedEvidences,
        submittedAt: application.submittedAt,
      });

      // Ambiguity checks for EXTRACTED_FIELD sources
      if (rule.source === "EXTRACTED_FIELD") {
        const bestEvidence = resolution.evidenceList[0] || null;
        const ambiguity = checkEvidenceAmbiguity(bestEvidence, rule.sourceField);
        const conflict = checkConflictingEvidence(resolution.evidenceList, rule.sourceField);

        const allAmbiguities = [...ambiguity.reasons, ...conflict.reasons];

        if (allAmbiguities.length > 0) {
          ruleEvaluationResults.push({
            ruleKey: rule.ruleKey,
            ruleName: rule.name || rule.ruleKey,
            ruleDescription: rule.description || "",
            outcome: "AMBIGUOUS",
            severity: rule.severity,
            source: rule.source,
            sourceField: rule.sourceField,
            operator: rule.operator,
            computedValue: bestEvidence?.rawValue || "MISSING",
            expectedValue: Array.isArray(rule.threshold)
              ? rule.threshold.join(", ")
              : String(rule.threshold),
            failureReason: allAmbiguities.join(" "),
            evidenceFieldIds: resolution.evidenceFieldIds,
            ambiguityReasons: allAmbiguities,
          });
          continue;
        }
      }

      // Run pure operator evaluation
      const opResult = evaluateOperator({
        operator: rule.operator,
        resolvedValue: resolution.value,
        threshold: rule.threshold,
        isCandidateSt,
        stRelaxation: rule.stRelaxation,
        failureMessageTemplate: rule.failureMessage,
        referenceDate: application.submittedAt || new Date(),
      });

      ruleEvaluationResults.push({
        ruleKey: rule.ruleKey,
        ruleName: rule.name || rule.ruleKey,
        ruleDescription: rule.description || "",
        outcome: opResult.outcome,
        severity: rule.severity,
        source: rule.source,
        sourceField: rule.sourceField,
        operator: rule.operator,
        computedValue: opResult.computedValueString,
        expectedValue: opResult.expectedValueString,
        failureReason: opResult.failureReason,
        evidenceFieldIds: resolution.evidenceFieldIds,
        appliedRelaxation: opResult.appliedRelaxation,
      });
    }

    // 6. Run Cross-Document Deterministic Consistency Checks
    const consistencyChecks = runConsistencyChecks({
      formData,
      applicantProfile,
      extractedEvidences,
    });

    // 7. Calculate Summary and Overall Assessment Status
    let passed = 0;
    let failed = 0;
    let ambiguous = 0;
    let skipped = 0;
    let hardFails = 0;
    let softFlags = 0;

    for (const r of ruleEvaluationResults) {
      if (r.outcome === "PASS") passed++;
      else if (r.outcome === "FAIL") {
        failed++;
        if (r.severity === "HARD_FAIL") hardFails++;
        else softFlags++;
      } else if (r.outcome === "AMBIGUOUS") {
        ambiguous++;
        if (r.severity === "HARD_FAIL") softFlags++;
      } else if (r.outcome === "SKIPPED") {
        skipped++;
      }
    }

    const hasInconsistentDoc = consistencyChecks.some((c) => !c.isConsistent);
    const hasLowConfidenceDoc = consistencyChecks.some((c) => c.extractedConfidence < 0.5);

    let assessmentStatus: AssessmentStatus;
    if (hardFails > 0) {
      assessmentStatus = "NOT_ELIGIBLE_ASSESSED";
    } else if (ambiguous > 0 || softFlags > 0 || hasInconsistentDoc || hasLowConfidenceDoc) {
      assessmentStatus = "REVIEW_REQUIRED";
    } else {
      assessmentStatus = "ELIGIBLE_ASSESSED";
    }

    const summary: EvaluationSummary = {
      totalRules: ruleEvaluationResults.length,
      passed,
      failed,
      ambiguous,
      skipped,
      hardFails,
      softFlags,
    };

    // 8. Persist RuleResult entities in Database
    const ruleResultRecords: Prisma.RuleResultCreateManyInput[] = ruleEvaluationResults.map(
      (r) => ({
        id: randomUUID(),
        caseDossierId: caseDossier.id,
        schemeVersionId: schemeVersion.id,
        ruleKey: r.ruleKey,
        ruleDescription: r.ruleDescription,
        outcome: r.outcome,
        evidenceFieldIds: r.evidenceFieldIds,
        computedValue: r.computedValue,
        expectedValue: r.expectedValue,
        failureReason: r.failureReason,
        runId,
        evaluatedAt,
        evaluatedBySystem: true,
      })
    );

    await ruleResultRepository.createMany(ruleResultRecords);

    // 9. Update CaseDossier nextAction if in early/automated verification stages
    if (
      caseDossier.currentStage === "SUBMITTED" ||
      caseDossier.currentStage === "AUTOMATED_VERIFICATION"
    ) {
      await prisma.caseDossier.update({
        where: { id: caseDossier.id },
        data: {
          nextAction: `Automated eligibility evaluation completed (${assessmentStatus}). Ready for officer review.`,
        },
      });
    }

    // 10. Create Audit Log Entry
    await prisma.auditLog.create({
      data: {
        caseDossierId: caseDossier.id,
        actorId: actor?.id || null,
        actorRole: (actor?.role as UserRole) || null,
        actionType: "ELIGIBILITY_EVALUATION_COMPLETED",
        payload: {
          runId,
          schemeCode: schemeVersion.scheme.code,
          versionNumber: schemeVersion.versionNumber,
          assessmentStatus,
          summary,
        } as unknown as Prisma.InputJsonValue,
      },
    });

    return {
      applicationId: application.id,
      caseDossierId: caseDossier.id,
      schemeVersionId: schemeVersion.id,
      schemeCode: schemeVersion.scheme.code,
      versionNumber: schemeVersion.versionNumber,
      runId,
      evaluatedAt,
      assessmentStatus,
      summary,
      ruleResults: ruleEvaluationResults,
      consistencyChecks,
    };
  }

  /**
   * Retrieves the latest evaluation result for an application.
   */
  async getEvaluationResults(
    applicationId: string,
    actor?: AuthenticatedUser
  ): Promise<ApplicationEvaluationResult | null> {
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        schemeVersion: {
          include: { scheme: true },
        },
        applicantProfile: {
          include: { user: true },
        },
        caseDossier: {
          include: {
            documents: {
              where: { isLatestVersion: true },
              include: { extractedFields: true },
            },
          },
        },
      },
    });

    if (!application || !application.caseDossier) {
      return null;
    }

    // Authorize: APPLICANT can only access their own application
    if (actor && actor.role === UserRole.APPLICANT) {
      if (application.submittedById !== actor.id) {
        throw new Error("Forbidden: You cannot access another applicant's evaluation.");
      }
    }

    const latestResults = await ruleResultRepository.findLatestByCaseDossierId(
      application.caseDossier.id
    );

    if (latestResults.length === 0) {
      // If no run exists yet, execute one
      return this.evaluateApplication(applicationId, actor);
    }

    const runId = latestResults[0].runId;
    const evaluatedAt = latestResults[0].evaluatedAt;
    const { schemeVersion, applicantProfile, caseDossier } = application;
    const formData = (application.formData || {}) as Record<string, unknown>;

    // Compile Extracted Field Evidences
    const extractedEvidences: ExtractedFieldEvidence[] = [];
    for (const doc of caseDossier.documents) {
      for (const f of doc.extractedFields) {
        extractedEvidences.push({
          id: f.id,
          documentId: doc.id,
          documentType: doc.documentType,
          fieldKey: f.fieldKey,
          rawValue: f.rawValue,
          normalizedValue: f.normalizedValue,
          confidenceScore: f.confidenceScore,
          pageNumber: f.pageNumber,
          sourceSnippet: f.sourceSnippet,
          documentStatus: doc.processingStatus,
        });
      }
    }

    const rawRulesSchema = schemeVersion.eligibilityRules as unknown as EligibilityRulesSchema;
    const rulesList: EligibilityRule[] = Array.isArray(rawRulesSchema?.rules)
      ? rawRulesSchema.rules
      : [];

    const ruleMap = new Map(rulesList.map((r) => [r.ruleKey, r]));

    const ruleEvaluationResults: RuleEvaluationResult[] = latestResults.map((lr) => {
      const origRule = ruleMap.get(lr.ruleKey);
      return {
        ruleKey: lr.ruleKey,
        ruleName: origRule?.name || lr.ruleKey,
        ruleDescription: lr.ruleDescription,
        outcome: lr.outcome,
        severity: origRule?.severity || "HARD_FAIL",
        source: origRule?.source || "FORM_DATA",
        sourceField: origRule?.sourceField || lr.ruleKey,
        operator: origRule?.operator || "EQUALS",
        computedValue: lr.computedValue || undefined,
        expectedValue: lr.expectedValue || undefined,
        failureReason: lr.failureReason || undefined,
        evidenceFieldIds: lr.evidenceFieldIds,
      };
    });

    const consistencyChecks = runConsistencyChecks({
      formData,
      applicantProfile,
      extractedEvidences,
    });

    let passed = 0;
    let failed = 0;
    let ambiguous = 0;
    let skipped = 0;
    let hardFails = 0;
    let softFlags = 0;

    for (const r of ruleEvaluationResults) {
      if (r.outcome === "PASS") passed++;
      else if (r.outcome === "FAIL") {
        failed++;
        if (r.severity === "HARD_FAIL") hardFails++;
        else softFlags++;
      } else if (r.outcome === "AMBIGUOUS") {
        ambiguous++;
        if (r.severity === "HARD_FAIL") softFlags++;
      } else if (r.outcome === "SKIPPED") {
        skipped++;
      }
    }

    const hasInconsistentDoc = consistencyChecks.some((c) => !c.isConsistent);
    const hasLowConfidenceDoc = consistencyChecks.some((c) => c.extractedConfidence < 0.5);

    let assessmentStatus: AssessmentStatus;
    if (hardFails > 0) {
      assessmentStatus = "NOT_ELIGIBLE_ASSESSED";
    } else if (ambiguous > 0 || softFlags > 0 || hasInconsistentDoc || hasLowConfidenceDoc) {
      assessmentStatus = "REVIEW_REQUIRED";
    } else {
      assessmentStatus = "ELIGIBLE_ASSESSED";
    }

    return {
      applicationId: application.id,
      caseDossierId: caseDossier.id,
      schemeVersionId: schemeVersion.id,
      schemeCode: schemeVersion.scheme.code,
      versionNumber: schemeVersion.versionNumber,
      runId,
      evaluatedAt,
      assessmentStatus,
      summary: {
        totalRules: ruleEvaluationResults.length,
        passed,
        failed,
        ambiguous,
        skipped,
        hardFails,
        softFlags,
      },
      ruleResults: ruleEvaluationResults,
      consistencyChecks,
    };
  }
}

export const eligibilityEngineService = new EligibilityEngineService();
