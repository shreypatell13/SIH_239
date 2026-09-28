import {
  CaseStage,
  CaseState,
  DocumentType,
  ProcessingStatus,
  ResponsibleActor,
  RuleOutcome,
  UserRole,
} from "@prisma/client";
import { AuthenticatedUser, assertAuthorized, assertActiveUser } from "../auth/roles";
import { canOfficerTransition } from "../domain/officer/workflow";
import { assertCanAccessCase, canListCaseQueue } from "../auth/case-access";
import { caseRepository } from "../repositories/case.repository";
import { deficiencyRepository } from "../repositories/deficiency.repository";
import { auditRepository } from "../repositories/audit.repository";
import { eligibilityEngineService } from "./eligibility-engine.service";
import { toOfficerDeficiencyDTO } from "../domain/deficiency/explanation";
import {
  OfficerQueueFilterQuery,
  OfficerQueueResponseDTO,
  OfficerQueueItemDTO,
  OfficerCaseDetailDTO,
  OfficerDocumentItemDTO,
  ExtractedEvidenceFieldDTO,
  CaseTimelineEventDTO,
  AddOfficerNoteDTO,
  TransitionCaseStageDTO,
} from "../domain/officer/types";

export class OfficerService {
  /**
   * Retrieves paginated case queue with transparent filters and aggregate KPI counts.
   */
  async listCaseQueue(
    filters: OfficerQueueFilterQuery,
    actor: AuthenticatedUser
  ): Promise<OfficerQueueResponseDTO> {
    assertActiveUser(actor);
    if (!canListCaseQueue(actor)) throw new Error("Forbidden: Case queue access required.");

    const isGlobal =
      actor.role === UserRole.SCHEME_ADMIN || actor.role === UserRole.OPERATIONS_DIRECTOR;
    const { total, items, page, pageSize } = await caseRepository.listQueue(
      filters,
      actor.id,
      isGlobal
    );

    const counts = await caseRepository.countQueueMetrics(
      actor.role === UserRole.VERIFICATION_OFFICER ? actor.id : undefined
    );

    const queueItems: OfficerQueueItemDTO[] = items.map((c) => {
      const app = c.application;
      const profile = app.applicantProfile;
      const user = profile.user;
      const version = app.schemeVersion;
      const scheme = version.scheme;

      // Determine latest eligibility assessment
      let eligibilityAssessment: OfficerQueueItemDTO["eligibilityAssessment"] = "UNASSESSED";
      if (c.ruleResults && c.ruleResults.length > 0) {
        const latestRunId = c.ruleResults[0].runId;
        const latestResults = c.ruleResults.filter((r) => r.runId === latestRunId);
        const hasFail = latestResults.some((r) => r.outcome === RuleOutcome.FAIL);
        const hasAmbiguous = latestResults.some((r) => r.outcome === RuleOutcome.AMBIGUOUS);

        if (hasFail) {
          eligibilityAssessment = "NOT_ELIGIBLE_ASSESSED";
        } else if (hasAmbiguous) {
          eligibilityAssessment = "REVIEW_REQUIRED";
        } else if (latestResults.length > 0) {
          eligibilityAssessment = "ELIGIBLE_ASSESSED";
        }
      }

      const hasReviewRequiredDocs = c.documents.some(
        (d) => d.processingStatus === ProcessingStatus.REVIEW_REQUIRED
      );

      return {
        caseId: c.id,
        caseNumber: c.caseNumber,
        applicationId: app.id,
        applicationNumber: app.applicationNumber,
        schemeCode: scheme.code,
        schemeName: scheme.name,
        schemeVersionNumber: version.versionNumber,
        applicantName: user.name || "Unnamed Applicant",
        applicantCategory: profile.category,
        stateDomicile: profile.stateDomicile,
        submittedAt: app.submittedAt ? app.submittedAt.toISOString() : c.createdAt.toISOString(),
        currentStage: c.currentStage,
        currentState: c.currentState,
        responsibleActor: c.responsibleActor,
        blocker: c.blocker,
        nextAction: c.nextAction,
        eligibilityAssessment,
        openDeficiencyCount: c.deficiencies.length,
        documentCount: c.documents.length,
        processedDocumentCount: c.documents.filter(
          (d) => d.processingStatus === ProcessingStatus.COMPLETED
        ).length,
        hasReviewRequiredDocs,
        assignedOfficerId: c.officerAssignedId,
        assignedOfficerName: c.officerAssigned?.name || null,
      };
    });

    return {
      total,
      page,
      pageSize,
      items: queueItems,
      counts,
    };
  }

  /**
   * Retrieves aggregated case workspace detail for the split-screen console.
   */
  async getCaseWorkspaceDetail(
    caseIdOrNumber: string,
    actor: AuthenticatedUser
  ): Promise<OfficerCaseDetailDTO> {
    assertActiveUser(actor);
    let c = await caseRepository.findById(caseIdOrNumber);
    if (!c) {
      c = await caseRepository.findByCaseNumber(caseIdOrNumber);
    }
    if (!c) {
      c = await caseRepository.findByApplicationId(caseIdOrNumber);
    }

    if (!c) {
      throw new Error("Case Dossier not found.");
    }
    assertCanAccessCase(actor, c, "read");
    assertCanAccessCase(actor, c, "document-read");

    const app = c.application;
    const profile = app.applicantProfile;
    const user = profile.user;
    const version = app.schemeVersion;
    const scheme = version.scheme;

    // 1. Format Documents with Extracted Fields & Bounding Boxes
    const documents: OfficerDocumentItemDTO[] = (c.documents || []).map((doc) => {
      const fields: ExtractedEvidenceFieldDTO[] = (doc.extractedFields || []).map((f) => {
        let boundingBox = null;
        if (
          f.boundingBoxX !== null &&
          f.boundingBoxY !== null &&
          f.boundingBoxWidth !== null &&
          f.boundingBoxHeight !== null
        ) {
          boundingBox = {
            x: f.boundingBoxX,
            y: f.boundingBoxY,
            width: f.boundingBoxWidth,
            height: f.boundingBoxHeight,
          };
        }

        const label = f.fieldKey
          .replace(/([A-Z])/g, " $1")
          .replace(/^./, (str) => str.toUpperCase())
          .trim();

        return {
          id: f.id,
          documentId: doc.id,
          fieldKey: f.fieldKey,
          label,
          rawValue: f.rawValue,
          normalizedValue: f.normalizedValue,
          confidenceScore: f.confidenceScore,
          pageNumber: f.pageNumber,
          boundingBox,
          sourceSnippet: f.sourceSnippet,
          extractorProvider: f.extractorProvider,
          extractorVersion: f.extractorVersion,
          extractionMethod: f.extractionMethod,
          extractedBy: f.extractedBy as "AI" | "HUMAN_OVERRIDE",
          isAmbiguous: f.confidenceScore < 0.5,
        };
      });

      return {
        id: doc.id,
        documentType: doc.documentType,
        classifiedAs: doc.classifiedAs,
        classificationConfidence: doc.classificationConfidence,
        originalFilename: doc.originalFilename,
        storagePath: doc.storagePath,
        mimeType: doc.mimeType,
        fileSizeBytes: doc.fileSizeBytes,
        version: doc.version,
        isLatestVersion: doc.isLatestVersion,
        processingStatus: doc.processingStatus,
        pageCount: doc.pageCount,
        uploadedAt: doc.uploadedAt.toISOString(),
        extractedFields: fields,
      };
    });

    // 2. Fetch Latest Eligibility Evaluation
    let eligibilityAssessment: OfficerCaseDetailDTO["eligibility"] = {
      assessmentStatus: "UNASSESSED",
      latestRunId: null,
      evaluatedAt: null,
      passedRulesCount: 0,
      failedRulesCount: 0,
      ambiguousRulesCount: 0,
      totalRulesCount: 0,
      rules: [],
      consistencyChecks: [],
    };

    try {
      const evaluation = await eligibilityEngineService.getEvaluationResults(app.id, actor);
      if (evaluation) {
        eligibilityAssessment = {
          assessmentStatus: evaluation.assessmentStatus,
          latestRunId: evaluation.runId,
          evaluatedAt: evaluation.evaluatedAt ? evaluation.evaluatedAt.toISOString() : null,
          passedRulesCount: evaluation.summary.passed,
          failedRulesCount: evaluation.summary.failed,
          ambiguousRulesCount: evaluation.summary.ambiguous,
          totalRulesCount: evaluation.summary.totalRules,
          rules: evaluation.ruleResults,
          consistencyChecks: evaluation.consistencyChecks,
        };
      }
    } catch {
      // In case evaluation has not yet occurred
    }

    // 3. Format Deficiencies
    const rawDeficiencies = await deficiencyRepository.listByCaseId(c.id);
    const deficiencies = rawDeficiencies.map((d) => toOfficerDeficiencyDTO(d));

    // 4. Format Timeline Events
    const timeline: CaseTimelineEventDTO[] = (c.auditLogs || []).map((log) => {
      const payload = (log.payload as Record<string, unknown>) || null;
      let title = log.actionType.replace(/_/g, " ");
      let description = `State changed from ${log.previousState || "N/A"} to ${log.newState || "N/A"}.`;

      if (log.actionType === "APPLICATION_SUBMITTED") {
        title = "Application Submitted";
        description = "Applicant submitted formal application for verification.";
      } else if (log.actionType === "DOCUMENT_PROCESSED") {
        title = "Document OCR Processed";
        description = `Document extraction completed.`;
      } else if (log.actionType === "ELIGIBILITY_EVALUATION_COMPLETED") {
        title = "Deterministic Eligibility Evaluated";
        description = `Automated rules evaluated. Outcome: ${payload?.status || "COMPLETED"}`;
      } else if (log.actionType === "DEFICIENCY_ISSUED") {
        title = "Deficiency Issued";
        description = `Officer requested applicant clarification: ${payload?.deficiencyType || ""}`;
      } else if (log.actionType === "DEFICIENCY_RESPONDED") {
        title = "Applicant Remediation Submitted";
        description = `Applicant submitted response/clarification.`;
      } else if (log.actionType === "DEFICIENCY_RESOLVED") {
        title = "Deficiency Resolved";
        description = `Deficiency cleared: ${payload?.resolutionRemark || "Condition met"}`;
      } else if (log.actionType === "OFFICER_REVIEW_NOTE_ADDED") {
        title = "Officer Review Note";
        description = (payload?.note as string) || "Note recorded by verification officer.";
      } else if (log.actionType === "OFFICER_CASE_CLAIMED") {
        title = "Case Assigned";
        description = `Case claimed by officer ${payload?.officerName || ""}.`;
      } else if (log.actionType === "OFFICER_CASE_TRANSITIONED") {
        title = "Case Stage Advanced";
        description = `Officer advanced stage to ${log.newState}: ${payload?.remark || ""}`;
      }

      return {
        id: log.id,
        actionType: log.actionType,
        actorId: log.actorId,
        actorName:
          (payload?.actorName as string) ||
          (payload?.officerName as string) ||
          (log.actorRole === "APPLICANT" ? user.name : "Officer"),
        actorRole: log.actorRole,
        title,
        description,
        previousState: log.previousState,
        newState: log.newState,
        payload,
        createdAt: log.createdAt.toISOString(),
      };
    });

    return {
      caseDossier: {
        id: c.id,
        caseNumber: c.caseNumber,
        currentStage: c.currentStage,
        currentState: c.currentState,
        blocker: c.blocker,
        responsibleActor: c.responsibleActor,
        nextAction: c.nextAction,
        deadline: c.deadline ? c.deadline.toISOString() : null,
        officerAssignedId: c.officerAssignedId,
        officerAssignedName: c.officerAssigned?.name || null,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
      },
      application: {
        id: app.id,
        applicationNumber: app.applicationNumber,
        status: app.status,
        submittedAt: app.submittedAt ? app.submittedAt.toISOString() : null,
        formData: (app.formData as Record<string, unknown>) || {},
      },
      applicant: {
        userId: user.id,
        name: user.name || "Unnamed Applicant",
        email: user.email,
        category: profile.category,
        dateOfBirth: profile.dateOfBirth ? profile.dateOfBirth.toISOString() : null,
        gender: profile.gender,
        stateDomicile: profile.stateDomicile,
        district: profile.district,
        mobile: profile.mobile,
        aadhaarLast4: profile.aadhaarLast4,
        academicQualification: profile.academicQualification,
        institutionName: profile.institutionName,
        yearOfPassing: profile.yearOfPassing,
        percentageObtained: profile.percentageObtained,
        annualFamilyIncome: profile.annualFamilyIncome,
        casteCertificateVerified: profile.casteCertificateVerified,
      },
      scheme: {
        id: scheme.id,
        code: scheme.code,
        name: scheme.name,
        versionId: version.id,
        versionNumber: version.versionNumber,
        effectiveFrom: version.effectiveFrom.toISOString(),
        formSchema: (version.formSchema as Record<string, unknown>) || {},
        documentRequirements: (version.documentRequirements as Record<string, unknown>) || {},
        eligibilityRules: (version.eligibilityRules as Record<string, unknown>) || {},
      },
      documents,
      eligibility: eligibilityAssessment,
      deficiencies,
      timeline,
    };
  }

  /**
   * Assigns / claims case to active verification officer.
   */
  async claimCase(caseId: string, actor: AuthenticatedUser) {
    assertActiveUser(actor);
    assertAuthorized(actor, UserRole.VERIFICATION_OFFICER, "case:claim");
    const dossier = await caseRepository.findById(caseId);
    if (!dossier) throw new Error("Case Dossier not found.");
    assertCanAccessCase(actor, dossier, "act");

    const updated = await caseRepository.assignOfficer(caseId, actor.id);

    await auditRepository.create({
      caseDossierId: caseId,
      actorId: actor.id,
      actorRole: actor.role,
      actionType: "OFFICER_CASE_CLAIMED",
      previousState: "UNASSIGNED",
      newState: "ASSIGNED",
      payload: {
        officerId: actor.id,
        officerName: actor.name,
        assignedAt: new Date().toISOString(),
      },
    });

    return updated;
  }

  /**
   * Records an internal, auditable review note on the case dossier.
   */
  async addOfficerNote(caseId: string, data: AddOfficerNoteDTO, actor: AuthenticatedUser) {
    assertActiveUser(actor);
    const c = await caseRepository.findById(caseId);
    if (!c) {
      throw new Error("Case Dossier not found.");
    }
    assertCanAccessCase(actor, c, "act");

    const noteLog = await auditRepository.create({
      caseDossierId: c.id,
      actorId: actor.id,
      actorRole: actor.role,
      actionType: "OFFICER_REVIEW_NOTE_ADDED",
      previousState: c.currentState,
      newState: c.currentState,
      payload: {
        note: data.note,
        officerId: actor.id,
        officerName: actor.name,
        recordedAt: new Date().toISOString(),
      },
    });

    return {
      success: true,
      noteId: noteLog.id,
      createdAt: noteLog.createdAt,
    };
  }

  /**
   * Validates and advances the case stage according to workflow state machine.
   */
  async transitionCaseStage(
    caseId: string,
    data: TransitionCaseStageDTO,
    actor: AuthenticatedUser
  ) {
    assertActiveUser(actor);
    const c = await caseRepository.findById(caseId);
    if (!c) {
      throw new Error("Case Dossier not found.");
    }
    assertCanAccessCase(actor, c, "act");

    const previousStage = c.currentStage;
    const previousState = c.currentState;
    if (!canOfficerTransition(c.currentStage, data.targetStage)) {
      throw new Error(`Invalid case transition from '${c.currentStage}' to '${data.targetStage}'.`);
    }
    let targetState = c.currentState;
    let blocker = data.blocker !== undefined ? data.blocker : c.blocker;
    let nextAction = data.nextAction || c.nextAction;

    if (data.targetStage === CaseStage.DEFICIENCY_PENDING) {
      targetState = CaseState.ACTION_REQUIRED;
      blocker = blocker || "Applicant clarification / replacement document required.";
      nextAction = "Awaiting applicant deficiency resolution.";
    } else if (data.targetStage === CaseStage.COMMITTEE_SELECTION) {
      // Verify no open deficiencies exist before committee recommendation
      const openDeficiencies = await deficiencyRepository.listByCaseId(c.id);
      const hasOpen = openDeficiencies.some((d) => d.status === "OPEN");
      if (hasOpen) {
        throw new Error(
          "Cannot advance case to Committee Selection while open deficiencies remain unresolved."
        );
      }
      targetState = CaseState.PENDING;
      blocker = null;
      nextAction = "Case verified and queued for Selection Committee review.";
    } else if (data.targetStage === CaseStage.OFFICER_REVIEW) {
      targetState = CaseState.IN_PROGRESS;
      blocker = null;
      nextAction = "Officer review in progress.";
    } else if (data.targetStage === CaseStage.REJECTED) {
      targetState = CaseState.COMPLETED;
      blocker = null;
      nextAction = "Officer rejection recorded; applicant may view the decision history.";
    }

    return caseRepository.transitionWithAudit({
      caseId: c.id,
      targetStage: data.targetStage,
      targetState,
      blocker,
      nextAction,
      actorId: actor.id,
      actorRole: actor.role,
      previousState: `${previousStage}:${previousState}`,
      remark: data.remark,
      decision:
        data.targetStage === CaseStage.COMMITTEE_SELECTION
          ? "RECOMMEND_FOR_SELECTION"
          : data.targetStage === CaseStage.REJECTED
            ? "REJECT"
            : data.targetStage === CaseStage.DEFICIENCY_PENDING
              ? "REQUEST_DEFICIENCY"
              : "CONTINUE_REVIEW",
    });
  }
}

export const officerService = new OfficerService();
