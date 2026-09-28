/**
 * Deficiency Management & Targeted Recheck Service
 * Phase 2H: Deficiency Management & Targeted Recheck Engine
 *
 * Grounding Rule:
 * Implements Detect → Explain → Correct → Recheck → Resolve loop.
 * Pure deterministic policy. NO LLMs. NO autonomous final approval/rejection.
 */

import { prisma } from "../db";
import { AuthenticatedUser } from "../auth/roles";
import { assertCanAccessCase } from "../auth/case-access";
import {
  Deficiency,
  DeficiencyStatus,
  DeficiencyType,
  DocumentType,
  RecheckStatus,
  UserRole,
  CaseStage,
  CaseState,
  ResponsibleActor,
  Prisma,
} from "@prisma/client";
import {
  ApplicantDeficiencyDTO,
  DeficiencyCreationInput,
  DeficiencySummaryDTO,
  OfficerDeficiencyDTO,
  OfficerResolutionInput,
  ApplicantResponseInput,
} from "../domain/deficiency/types";
import { generateDeficiencyExplanation } from "../domain/deficiency/explanation";
import {
  calculateResponseDeadline,
  isDeficiencyExpired,
  isValidDeficiencyTransition,
} from "../domain/deficiency/policy";
import { deficiencyRepository } from "../repositories/deficiency.repository";
import { documentProcessingService } from "./document-processing.service";
import { eligibilityEngineService } from "./eligibility-engine.service";
import { evaluateDeficiencyEvidence } from "../domain/deficiency/targeted-recheck";

export class DeficiencyService {
  /**
   * Issues a structured deficiency with plain-English explanation.
   * Enforces deduplication against already open deficiencies on the same case/target.
   */
  async issueDeficiency(
    input: DeficiencyCreationInput,
    actor: AuthenticatedUser | { id: string; role: "SYSTEM" }
  ): Promise<Deficiency> {
    // 1. Authorize Actor
    if (actor.role !== "SYSTEM") {
      const allowedRoles: UserRole[] = [
        UserRole.VERIFICATION_OFFICER,
        UserRole.SCHEME_ADMIN,
        UserRole.OPERATIONS_DIRECTOR,
      ];
      if (!allowedRoles.includes(actor.role as UserRole)) {
        throw new Error(
          `Forbidden: User with role '${actor.role}' is not authorized to issue deficiencies.`
        );
      }
    }

    // 2. Fetch CaseDossier with SchemeVersion workflow configuration
    const caseDossier = await prisma.caseDossier.findUnique({
      where: { id: input.caseDossierId },
      include: {
        application: {
          include: {
            schemeVersion: true,
          },
        },
      },
    });

    if (!caseDossier) {
      throw new Error(`CaseDossier with ID '${input.caseDossierId}' not found.`);
    }
    if (actor.role !== "SYSTEM") assertCanAccessCase(actor, caseDossier, "act");

    // 3. Deduplication Check: Do not create duplicate OPEN deficiencies for the same target
    const existingOpen = await deficiencyRepository.findOpenExisting({
      caseDossierId: input.caseDossierId,
      deficiencyType: input.deficiencyType,
      documentType: input.documentType,
      targetDocumentId: input.targetDocumentId,
      ruleResultId: input.ruleResultId,
    });

    if (existingOpen) {
      return existingOpen;
    }

    // 4. Generate Plain-English Explanation & Title
    const explanation = generateDeficiencyExplanation({
      deficiencyType: input.deficiencyType,
      documentType: input.documentType,
      customDescription: input.description,
    });

    // 5. Calculate Response Deadline from Scheme Workflow SLA
    const responseDeadline =
      input.responseDeadline ||
      calculateResponseDeadline(caseDossier.application.schemeVersion.workflowConfig as any);

    // 6. Create Deficiency Entity
    const deficiency = await deficiencyRepository.create({
      caseDossier: { connect: { id: input.caseDossierId } },
      issuedBy: { connect: { id: actor.id } },
      deficiencyType: input.deficiencyType,
      documentType: input.documentType || null,
      ...(input.targetDocumentId
        ? { targetDocument: { connect: { id: input.targetDocumentId } } }
        : {}),
      ...(input.ruleResultId ? { ruleResult: { connect: { id: input.ruleResultId } } } : {}),
      description: explanation.description,
      responseDeadline,
      status: DeficiencyStatus.OPEN,
    });

    // 7. Update CaseDossier Lifecycle State
    await prisma.caseDossier.update({
      where: { id: input.caseDossierId },
      data: {
        currentStage: CaseStage.DEFICIENCY_PENDING,
        currentState: CaseState.ACTION_REQUIRED,
        responsibleActor: ResponsibleActor.APPLICANT,
        blocker: explanation.title,
        nextAction:
          "Action required: Review and remediate outstanding application deficiency before the deadline.",
        deadline: responseDeadline,
      },
    });

    // 8. Write Audit Log Entry
    await prisma.auditLog.create({
      data: {
        caseDossierId: input.caseDossierId,
        actorId: actor.id,
        actorRole: (actor.role as UserRole) || null,
        actionType: "DEFICIENCY_ISSUED",
        newState: "DEFICIENCY_PENDING",
        payload: {
          deficiencyId: deficiency.id,
          deficiencyType: deficiency.deficiencyType,
          documentType: deficiency.documentType,
          title: explanation.title,
          deadline: responseDeadline.toISOString(),
        } as unknown as Prisma.InputJsonValue,
      },
    });

    return deficiency;
  }

  /**
   * Evaluates application findings from Phase 2F/2G and creates actionable deficiencies automatically.
   */
  async detectAndCreateDeficiencies(
    applicationId: string,
    actor: AuthenticatedUser | { id: string; role: "SYSTEM" }
  ): Promise<Deficiency[]> {
    const evalResult = await eligibilityEngineService.evaluateApplication(applicationId, actor);
    const created: Deficiency[] = [];

    const caseDossier = await prisma.caseDossier.findUnique({
      where: { id: evalResult.caseDossierId },
      include: {
        documents: { where: { isLatestVersion: true } },
      },
    });

    if (!caseDossier) return [];

    // 1. Process Rule Evaluation Findings
    for (const rule of evalResult.ruleResults) {
      if (rule.outcome === "FAIL" && rule.severity === "HARD_FAIL") {
        let defType: DeficiencyType = "DATA_MISMATCH";
        let docType: DocumentType | null = null;

        if (rule.ruleKey === "ST_VERIFICATION") {
          defType = "DOCUMENT_MISSING";
          docType = DocumentType.CASTE_CERTIFICATE;
        } else if (rule.ruleKey === "INCOME_CEILING") {
          defType = "DATA_MISMATCH";
          docType = DocumentType.INCOME_CERTIFICATE;
        } else if (rule.ruleKey === "ACADEMIC_MIN_SCORE") {
          defType = "DATA_MISMATCH";
          docType = DocumentType.DEGREE_TRANSCRIPT;
        }

        const issued = await this.issueDeficiency(
          {
            caseDossierId: caseDossier.id,
            issuedById: actor.id,
            deficiencyType: defType,
            documentType: docType,
            description: rule.failureReason,
          },
          actor
        );
        created.push(issued);
      }
    }

    // 2. Process Cross-Document Consistency Inconsistencies
    for (const chk of evalResult.consistencyChecks) {
      if (!chk.isConsistent && chk.mismatchExplanation) {
        const issued = await this.issueDeficiency(
          {
            caseDossierId: caseDossier.id,
            issuedById: actor.id,
            deficiencyType: DeficiencyType.DATA_MISMATCH,
            documentType: chk.documentType as DocumentType,
            targetDocumentId: chk.documentId,
            description: chk.mismatchExplanation,
          },
          actor
        );
        created.push(issued);
      }
    }

    return created;
  }

  /**
   * Lists deficiencies for applicant viewing (sanitized, PII/ML-free).
   */
  async listApplicantDeficiencies(
    applicationId: string,
    actor: AuthenticatedUser
  ): Promise<ApplicantDeficiencyDTO[]> {
    if (actor.role !== UserRole.APPLICANT)
      throw new Error("Forbidden: Applicant-only deficiency endpoint.");
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: { caseDossier: true },
    });

    if (!application || !application.caseDossier) {
      throw new Error(`Application '${applicationId}' not found.`);
    }

    // Strict Applicant Ownership Check
    if (actor.role === UserRole.APPLICANT && application.submittedById !== actor.id) {
      throw new Error("Forbidden: You cannot access another applicant's deficiencies.");
    }

    const rawDeficiencies = await deficiencyRepository.listByCaseId(application.caseDossier.id);

    return rawDeficiencies.map((d) => this.mapToApplicantDTO(d, application.id));
  }

  /**
   * Retrieves a single deficiency for applicant view with ownership guard.
   */
  async getApplicantDeficiency(
    applicationId: string,
    deficiencyId: string,
    actor: AuthenticatedUser
  ): Promise<ApplicantDeficiencyDTO> {
    if (actor.role !== UserRole.APPLICANT)
      throw new Error("Forbidden: Applicant-only deficiency endpoint.");
    const deficiency = await deficiencyRepository.findById(deficiencyId);

    if (
      !deficiency ||
      !deficiency.caseDossier?.application ||
      deficiency.caseDossier.application.id !== applicationId
    ) {
      throw new Error(`Deficiency '${deficiencyId}' not found for application '${applicationId}'.`);
    }

    // Strict Applicant Ownership Check
    if (
      actor.role === UserRole.APPLICANT &&
      deficiency.caseDossier.application.submittedById !== actor.id
    ) {
      throw new Error("Forbidden: You cannot access another applicant's deficiency.");
    }

    return this.mapToApplicantDTO(deficiency, applicationId);
  }

  /**
   * Handles applicant response (written clarification or attached replacement document).
   */
  async respondToDeficiency(
    applicationId: string,
    deficiencyId: string,
    input: ApplicantResponseInput,
    actor: AuthenticatedUser
  ): Promise<ApplicantDeficiencyDTO> {
    if (actor.role !== UserRole.APPLICANT)
      throw new Error("Forbidden: Applicant-only deficiency endpoint.");
    const deficiency = await deficiencyRepository.findById(deficiencyId);

    if (
      !deficiency ||
      !deficiency.caseDossier?.application ||
      deficiency.caseDossier.application.id !== applicationId
    ) {
      throw new Error(`Deficiency '${deficiencyId}' not found for application '${applicationId}'.`);
    }

    if (
      actor.role === UserRole.APPLICANT &&
      deficiency.caseDossier.application.submittedById !== actor.id
    ) {
      throw new Error("Forbidden: You cannot respond to another applicant's deficiency.");
    }

    if (input.resolvingDocumentId) {
      const doc = await prisma.document.findUnique({ where: { id: input.resolvingDocumentId } });
      const expectedType = deficiency.documentType || deficiency.targetDocument?.documentType;
      if (
        !doc ||
        doc.caseDossierId !== deficiency.caseDossierId ||
        doc.deficiencyId !== deficiency.id ||
        doc.uploadedById !== actor.id ||
        !doc.isLatestVersion ||
        (expectedType && doc.documentType !== expectedType)
      ) {
        throw new Error("Forbidden: Replacement evidence is not valid for this deficiency.");
      }
    }
    if (deficiency.status !== DeficiencyStatus.OPEN) {
      throw new Error(`Cannot respond to deficiency in status '${deficiency.status}'.`);
    }

    // 1. Record Applicant Response
    const updated = await deficiencyRepository.recordApplicantResponse(deficiencyId, {
      clarificationText: input.clarificationText,
      resolvingDocumentId: input.resolvingDocumentId,
    });

    // 2. Update CaseDossier to IN_PROGRESS
    await prisma.caseDossier.update({
      where: { id: deficiency.caseDossierId },
      data: {
        currentState: CaseState.IN_PROGRESS,
        nextAction: "Applicant response submitted. Automated verification recheck underway.",
      },
    });

    // 3. Write Audit Log
    await prisma.auditLog.create({
      data: {
        caseDossierId: deficiency.caseDossierId,
        actorId: actor.id,
        actorRole: (actor.role as UserRole) || null,
        actionType: "DEFICIENCY_APPLICANT_RESPONSE_SUBMITTED",
        payload: {
          deficiencyId,
          hasClarification: Boolean(input.clarificationText),
          resolvingDocumentId: input.resolvingDocumentId || null,
        } as unknown as Prisma.InputJsonValue,
      },
    });

    // 4. Trigger Targeted Recheck
    await this.executeTargetedRecheck(deficiencyId, actor);

    const reloaded = await deficiencyRepository.findById(deficiencyId);
    return this.mapToApplicantDTO(reloaded || updated, applicationId);
  }

  /**
   * Executes targeted recheck for a specific deficiency:
   * 1. Runs Phase 2F processing on newly attached replacement document.
   * 2. Evaluates affected Phase 2G eligibility rules.
   * 3. Resolves or leaves deficiency OPEN based on deterministic evidence.
   */
  async executeTargetedRecheck(
    deficiencyId: string,
    actor?: AuthenticatedUser | { id: string; role: "SYSTEM" }
  ): Promise<Deficiency> {
    const deficiency = await deficiencyRepository.findById(deficiencyId);
    if (!deficiency || !deficiency.caseDossier)
      throw new Error(`Deficiency '${deficiencyId}' not found.`);
    if (actor && actor.role !== "SYSTEM") {
      if (actor.role === UserRole.APPLICANT) {
        if (deficiency.caseDossier.application.submittedById !== actor.id) {
          throw new Error("Forbidden: You cannot recheck another applicant's deficiency.");
        }
      } else {
        assertCanAccessCase(actor, deficiency.caseDossier, "act");
      }
    }

    await prisma.auditLog.create({
      data: {
        caseDossierId: deficiency.caseDossierId,
        actorId: actor?.id || null,
        actorRole: actor && actor.role !== "SYSTEM" ? (actor.role as UserRole) : null,
        actionType: "DEFICIENCY_RECHECK_STARTED",
        payload: { deficiencyId },
      },
    });

    const replacement = deficiency.resolutionDocuments.find(
      (doc) => doc.deficiencyId === deficiency.id && doc.caseDossierId === deficiency.caseDossierId
    );
    let documentStatus: any = replacement?.processingStatus || null;
    let replacementEvidence: Array<{
      fieldKey: string;
      normalizedValue: string | null;
      rawValue: string;
    }> = [];
    let targetedResult: Awaited<
      ReturnType<typeof eligibilityEngineService.evaluateTargetedRules>
    > | null = null;
    if (replacement && (documentStatus === "PENDING" || documentStatus === "PROCESSING")) {
      const job = await documentProcessingService.enqueueDocument(replacement.id);
      await documentProcessingService.processJob(job.id);
    }
    if (replacement) {
      const processedDocument = await prisma.document.findUnique({
        where: { id: replacement.id },
        include: { extractedFields: true },
      });
      documentStatus = processedDocument?.processingStatus || null;
      replacementEvidence = (processedDocument?.extractedFields || []).map((field) => ({
        fieldKey: field.fieldKey,
        normalizedValue: field.normalizedValue,
        rawValue: field.rawValue,
      }));
    }
    if (replacement && documentStatus === "COMPLETED") {
      targetedResult = await eligibilityEngineService.evaluateTargetedRules(
        deficiency.caseDossier.applicationId,
        replacement.id,
        deficiency.ruleResult?.ruleKey,
        actor
      );
    }
    const requirementSchema = deficiency.caseDossier.application.schemeVersion
      .documentRequirements as any;
    const documentRequirement = requirementSchema?.requirements?.find(
      (item: { documentType: string }) =>
        item.documentType === (deficiency.documentType || replacement?.documentType)
    );
    const condition = evaluateDeficiencyEvidence({
      deficiencyType: deficiency.deficiencyType,
      documentStatus,
      hasReplacement: Boolean(replacement),
      affectedRules: targetedResult?.ruleResults || [],
      consistencyChecks: targetedResult?.consistencyChecks || [],
      validityWindowMonths: documentRequirement?.validityWindowMonths,
      extractedFields: replacementEvidence,
    });
    const newStatus = condition.isResolved ? DeficiencyStatus.RESOLVED : DeficiencyStatus.OPEN;
    const recheckStatus = condition.isResolved
      ? RecheckStatus.RECHECKED_PASS
      : condition.reviewRequired
        ? RecheckStatus.PENDING_RECHECK
        : RecheckStatus.RECHECKED_FAIL;
    const updated = await deficiencyRepository.updateStatus(deficiencyId, {
      status: newStatus,
      recheckStatus,
      recheckAt: new Date(),
      officerResolutionRemark: condition.explanation,
      resolvedAt: condition.isResolved ? new Date() : null,
    });

    const metrics = await deficiencyRepository.countMetrics(deficiency.caseDossierId);
    if (metrics.open === 0 && condition.isResolved) {
      await prisma.caseDossier.update({
        where: { id: deficiency.caseDossierId },
        data: {
          currentStage: CaseStage.OFFICER_REVIEW,
          currentState: CaseState.PENDING,
          responsibleActor: ResponsibleActor.VERIFICATION_OFFICER,
          blocker: null,
          nextAction: "All deficiencies resolved. Ready for officer verification review.",
        },
      });
    }
    await prisma.auditLog.create({
      data: {
        caseDossierId: deficiency.caseDossierId,
        actorId: actor?.id || null,
        actorRole: actor && actor.role !== "SYSTEM" ? (actor.role as UserRole) : null,
        actionType: condition.isResolved ? "DEFICIENCY_RESOLVED" : "DEFICIENCY_RECHECK_COMPLETED",
        previousState: deficiency.status,
        newState: newStatus,
        payload: {
          deficiencyId,
          replacementDocumentId: replacement?.id || null,
          affectedRuleKeys: targetedResult?.ruleResults.map((result) => result.ruleKey) || [],
          recheckStatus,
          isResolved: condition.isResolved,
          explanation: condition.explanation,
        } as unknown as Prisma.InputJsonValue,
      },
    });
    return updated;
  }

  /**
   * Officer manual resolution, waiver, or reopening.
   */
  async officerResolveOrWaive(
    deficiencyId: string,
    input: OfficerResolutionInput,
    actor: AuthenticatedUser
  ): Promise<Deficiency> {
    const allowedRoles: UserRole[] = [UserRole.VERIFICATION_OFFICER, UserRole.SCHEME_ADMIN];
    if (!allowedRoles.includes(actor.role as UserRole)) {
      throw new Error(
        `Forbidden: User with role '${actor.role}' is not authorized to resolve/waive deficiencies.`
      );
    }

    const deficiency = await deficiencyRepository.findById(deficiencyId);
    if (!deficiency) {
      throw new Error(`Deficiency '${deficiencyId}' not found.`);
    }
    assertCanAccessCase(actor, deficiency.caseDossier, "act");

    let targetStatus: DeficiencyStatus = DeficiencyStatus.RESOLVED;
    if (input.action === "WAIVE") targetStatus = DeficiencyStatus.WAIVED;
    if (input.action === "REOPEN") targetStatus = DeficiencyStatus.OPEN;

    if (input.action !== "REOPEN" && (!input.remark || input.remark.trim().length === 0)) {
      throw new Error("Resolution remark is mandatory.");
    }

    if (!isValidDeficiencyTransition(deficiency.status, targetStatus)) {
      throw new Error(
        `Invalid status transition from '${deficiency.status}' to '${targetStatus}'.`
      );
    }

    const updated = await deficiencyRepository.updateStatus(deficiencyId, {
      status: targetStatus,
      officerResolutionRemark: input.remark,
      resolvedAt: targetStatus === DeficiencyStatus.RESOLVED ? new Date() : null,
    });

    // If all deficiencies resolved/waived, transition case to OFFICER_REVIEW
    const metrics = await deficiencyRepository.countMetrics(deficiency.caseDossierId);
    if (metrics.open === 0) {
      await prisma.caseDossier.update({
        where: { id: deficiency.caseDossierId },
        data: {
          currentStage: CaseStage.OFFICER_REVIEW,
          currentState: CaseState.PENDING,
          responsibleActor: ResponsibleActor.VERIFICATION_OFFICER,
          blocker: null,
          nextAction: "All deficiencies resolved or waived. Ready for officer review.",
        },
      });
    }

    // Write Audit Log
    await prisma.auditLog.create({
      data: {
        caseDossierId: deficiency.caseDossierId,
        actorId: actor.id,
        actorRole: (actor.role as UserRole) || null,
        actionType: `DEFICIENCY_${input.action}`,
        previousState: deficiency.status,
        newState: targetStatus,
        payload: {
          deficiencyId,
          remark: input.remark,
        } as unknown as Prisma.InputJsonValue,
      },
    });

    return updated;
  }

  /**
   * Retrieves deficiency summary statistics for application status view.
   */
  async getDeficiencySummary(
    applicationId: string,
    actor: AuthenticatedUser
  ): Promise<DeficiencySummaryDTO> {
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: { caseDossier: true },
    });

    if (!application || !application.caseDossier) {
      return {
        totalDeficiencies: 0,
        openCount: 0,
        resolvedCount: 0,
        waivedCount: 0,
        applicantActionRequired: false,
        nextAction: "No deficiencies found.",
      };
    }

    if (actor.role === UserRole.APPLICANT) {
      if (application.submittedById !== actor.id)
        throw new Error("Forbidden: You cannot access another applicant's summary.");
    } else {
      assertCanAccessCase(
        actor,
        { ...application.caseDossier, application: { submittedById: application.submittedById } },
        "read"
      );
    }

    const metrics = await deficiencyRepository.countMetrics(application.caseDossier.id);

    const openDefs = await deficiencyRepository.listByCaseId(
      application.caseDossier.id,
      DeficiencyStatus.OPEN
    );

    let nearestDeadline: Date | null = null;
    for (const d of openDefs) {
      if (!nearestDeadline || d.responseDeadline < nearestDeadline) {
        nearestDeadline = d.responseDeadline;
      }
    }

    return {
      totalDeficiencies: metrics.total,
      openCount: metrics.open,
      resolvedCount: metrics.resolved,
      waivedCount: metrics.waived,
      applicantActionRequired: metrics.open > 0,
      nextAction:
        metrics.open > 0
          ? `Action required: Resolve ${metrics.open} outstanding deficienc${metrics.open > 1 ? "ies" : "y"}.`
          : "All deficiencies resolved.",
      deadline: nearestDeadline,
    };
  }

  /**
   * Maps Prisma Deficiency to sanitized ApplicantDeficiencyDTO.
   */
  private mapToApplicantDTO(d: any, applicationId: string): ApplicantDeficiencyDTO {
    const explanation = generateDeficiencyExplanation({
      deficiencyType: d.deficiencyType,
      documentType: d.documentType,
      customDescription: d.description,
    });

    return {
      id: d.id,
      caseDossierId: d.caseDossierId,
      applicationId,
      deficiencyType: d.deficiencyType,
      title: explanation.title,
      description: d.description || explanation.description,
      remedyAction: explanation.remedyAction,
      documentType: d.documentType,
      targetDocumentFilename: d.targetDocument?.originalFilename || null,
      status: d.status,
      recheckStatus: d.recheckStatus,
      recheckAt: d.recheckAt,
      responseDeadline: d.responseDeadline,
      isExpired: isDeficiencyExpired(d.responseDeadline),
      applicantResponseText: d.applicantResponseText,
      applicantRespondedAt: d.applicantRespondedAt,
      resolvedAt: d.resolvedAt,
      issuedAt: d.issuedAt,
      resolutionDocuments: (d.resolutionDocuments || []).map((rd: any) => ({
        id: rd.id,
        originalFilename: rd.originalFilename,
        version: rd.version,
        uploadedAt: rd.uploadedAt,
        processingStatus: rd.processingStatus,
      })),
    };
  }
}

export const deficiencyService = new DeficiencyService();
