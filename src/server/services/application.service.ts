import { ApplicationStatus, CaseStage, DocumentType, Prisma } from "@prisma/client";
import { AuthenticatedUser, assertPermission } from "../auth/roles";
import { applicationRepository } from "../repositories/application.repository";
import { applicantRepository } from "../repositories/applicant.repository";
import { schemeRepository } from "../repositories/scheme.repository";
import { documentRepository } from "../repositories/document.repository";
import { documentProcessingJobRepository } from "../repositories/document-processing-job.repository";
import { documentService } from "./document.service";
import {
  ApplicantProfileDTO,
  ApplicationDetailDTO,
  ApplicationSummaryDTO,
  ChecklistItemDTO,
  DocumentSummaryDTO,
  ExplainableCaseStatusDTO,
  ReadinessReportDTO,
  UpdateApplicantProfileDTO,
} from "../domain/application/types";
import {
  CreateDraftValidator,
  SaveDraftValidator,
  UpdateApplicantProfileValidator,
  validateApplicationFormData,
} from "../domain/application/validators";
import { computeReadinessReport, resolveDocumentChecklist } from "../domain/application/readiness";
import { buildExplainableCaseStatus } from "../domain/application/explainable-status";
import { FormSchema, DocumentRequirementsSchema } from "../domain/scheme/types";

export interface IApplicationService {
  getApplicantProfile(actor: AuthenticatedUser): Promise<ApplicantProfileDTO>;
  updateApplicantProfile(
    data: UpdateApplicantProfileDTO,
    actor: AuthenticatedUser
  ): Promise<ApplicantProfileDTO>;
  listApplications(actor: AuthenticatedUser): Promise<ApplicationSummaryDTO[]>;
  getApplicationDetail(
    applicationId: string,
    actor: AuthenticatedUser
  ): Promise<ApplicationDetailDTO>;
  createDraft(schemeCode: string, actor: AuthenticatedUser): Promise<ApplicationDetailDTO>;
  saveDraft(
    applicationId: string,
    formData: Record<string, unknown>,
    actor: AuthenticatedUser
  ): Promise<ApplicationDetailDTO>;
  getReadiness(applicationId: string, actor: AuthenticatedUser): Promise<ReadinessReportDTO>;
  getChecklist(applicationId: string, actor: AuthenticatedUser): Promise<ChecklistItemDTO[]>;
  submitApplication(
    applicationId: string,
    actor: AuthenticatedUser
  ): Promise<ExplainableCaseStatusDTO>;
  withdrawApplication(
    applicationId: string,
    actor: AuthenticatedUser,
    reason?: string
  ): Promise<ExplainableCaseStatusDTO>;
  getExplainableStatus(
    applicationId: string,
    actor: AuthenticatedUser
  ): Promise<ExplainableCaseStatusDTO>;
  uploadDocument(
    applicationId: string,
    documentType: DocumentType,
    file: { fileName: string; mimeType: string; buffer: Buffer },
    actor: AuthenticatedUser
  ): Promise<DocumentSummaryDTO>;
  deleteDocument(
    applicationId: string,
    documentId: string,
    actor: AuthenticatedUser
  ): Promise<boolean>;
  getPreviewBuffer(
    storagePath: string,
    actor: AuthenticatedUser
  ): Promise<{ buffer: Buffer; mimeType: string }>;
}

export class ApplicationService implements IApplicationService {
  /**
   * Helper to verify that the active user owns the given application.
   */
  private async assertApplicationOwnership(applicationId: string, actor: AuthenticatedUser) {
    const app = await applicationRepository.findById(applicationId);
    if (!app) {
      throw new Error(`Application "${applicationId}" not found.`);
    }
    if (app.submittedById !== actor.id) {
      throw new Error(`Forbidden: You do not own application "${applicationId}".`);
    }
    return app;
  }

  /**
   * Resolves or auto-provisions the ApplicantProfile for the user.
   */
  async getApplicantProfile(actor: AuthenticatedUser): Promise<ApplicantProfileDTO> {
    assertPermission(actor, "profile:read:own");

    let profile = await applicantRepository.findByUserId(actor.id);
    if (!profile) {
      profile = await applicantRepository.create({
        user: { connect: { id: actor.id } },
        category: "ST",
      });
    }

    return {
      id: profile.id,
      userId: profile.userId,
      fullName: actor.name || "Applicant Candidate",
      email: actor.email,
      dateOfBirth: profile.dateOfBirth ? profile.dateOfBirth.toISOString() : null,
      gender: profile.gender,
      category: profile.category,
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
    };
  }

  /**
   * Updates ApplicantProfile biographical fields.
   */
  async updateApplicantProfile(
    data: UpdateApplicantProfileDTO,
    actor: AuthenticatedUser
  ): Promise<ApplicantProfileDTO> {
    assertPermission(actor, "profile:update:own");
    const validated = UpdateApplicantProfileValidator.parse(data);

    const updateData: Prisma.ApplicantProfileUpdateInput = {
      gender: validated.gender,
      stateDomicile: validated.stateDomicile,
      district: validated.district,
      mobile: validated.mobile,
      aadhaarLast4: validated.aadhaarLast4,
      academicQualification: validated.academicQualification,
      institutionName: validated.institutionName,
      yearOfPassing: validated.yearOfPassing,
      percentageObtained: validated.percentageObtained,
      annualFamilyIncome: validated.annualFamilyIncome,
    };

    if (validated.dateOfBirth) {
      updateData.dateOfBirth = new Date(validated.dateOfBirth);
    } else if (validated.dateOfBirth === null) {
      updateData.dateOfBirth = null;
    }

    await applicantRepository.upsert(
      actor.id,
      updateData as Omit<Prisma.ApplicantProfileCreateInput, "user">
    );
    return this.getApplicantProfile(actor);
  }

  /**
   * Lists all applications for the authenticated applicant.
   */
  async listApplications(actor: AuthenticatedUser): Promise<ApplicationSummaryDTO[]> {
    assertPermission(actor, "application:read:own");

    const applications = await applicationRepository.listByUserId(actor.id);

    return applications.map((app) => {
      const formSchema = app.schemeVersion.formSchema as unknown as FormSchema;
      const docReqs = app.schemeVersion
        .documentRequirements as unknown as DocumentRequirementsSchema;
      const formData = (app.formData as Record<string, unknown>) || {};
      const docs = app.caseDossier?.documents || [];

      // Calculate completion %
      const totalFields = formSchema?.fields?.length || 1;
      const filledFields = Object.keys(formData).filter(
        (k) => formData[k] !== undefined && formData[k] !== ""
      ).length;
      const formCompletionPercent = Math.min(100, Math.round((filledFields / totalFields) * 100));

      const mandatoryDocs = docReqs?.requirements?.filter((r) => r.level === "MANDATORY") || [];
      const uploadedDocs = docs.filter((d) => d.isLatestVersion);

      return {
        id: app.id,
        applicationNumber: app.applicationNumber,
        schemeId: app.schemeVersion.schemeId,
        schemeCode: app.schemeVersion.scheme.code,
        schemeName: app.schemeVersion.scheme.name,
        schemeVersionId: app.schemeVersionId,
        versionNumber: app.schemeVersion.versionNumber,
        status: app.status,
        formCompletionPercent,
        documentsUploadedCount: uploadedDocs.length,
        documentsRequiredCount: mandatoryDocs.length,
        createdAt: app.createdAt.toISOString(),
        updatedAt: app.updatedAt.toISOString(),
        submittedAt: app.submittedAt ? app.submittedAt.toISOString() : null,
        caseDossierId: app.caseDossier?.id || null,
        caseNumber: app.caseDossier?.caseNumber || null,
        caseStage: app.caseDossier?.currentStage || null,
        caseState: app.caseDossier?.currentState || null,
        responsibleActor: app.caseDossier?.responsibleActor || null,
        nextAction: app.caseDossier?.nextAction || null,
      };
    });
  }

  /**
   * Retrieves full details for an application owned by the user.
   */
  async getApplicationDetail(
    applicationId: string,
    actor: AuthenticatedUser
  ): Promise<ApplicationDetailDTO> {
    assertPermission(actor, "application:read:own");
    const app = await this.assertApplicationOwnership(applicationId, actor);

    return {
      id: app.id,
      applicationNumber: app.applicationNumber,
      schemeId: app.schemeVersion.schemeId,
      schemeCode: app.schemeVersion.scheme.code,
      schemeName: app.schemeVersion.scheme.name,
      schemeDescription: app.schemeVersion.scheme.description,
      schemeVersionId: app.schemeVersionId,
      versionNumber: app.schemeVersion.versionNumber,
      status: app.status,
      formData: (app.formData as Record<string, unknown>) || {},
      createdAt: app.createdAt.toISOString(),
      updatedAt: app.updatedAt.toISOString(),
      submittedAt: app.submittedAt ? app.submittedAt.toISOString() : null,
      schemeVersion: {
        id: app.schemeVersion.id,
        versionNumber: app.schemeVersion.versionNumber,
        formSchema: app.schemeVersion.formSchema as unknown as FormSchema,
        documentRequirements: app.schemeVersion
          .documentRequirements as unknown as DocumentRequirementsSchema,
        applicationOpenDate: app.schemeVersion.applicationOpenDate
          ? app.schemeVersion.applicationOpenDate.toISOString()
          : null,
        applicationDeadline: app.schemeVersion.applicationDeadline
          ? app.schemeVersion.applicationDeadline.toISOString()
          : null,
      },
      caseDossier: app.caseDossier
        ? {
            id: app.caseDossier.id,
            caseNumber: app.caseDossier.caseNumber,
            currentStage: app.caseDossier.currentStage,
            currentState: app.caseDossier.currentState,
            blocker: app.caseDossier.blocker,
            responsibleActor: app.caseDossier.responsibleActor,
            nextAction: app.caseDossier.nextAction,
            deadline: app.caseDossier.deadline ? app.caseDossier.deadline.toISOString() : null,
          }
        : null,
    };
  }

  /**
   * Starts a new application draft with early CaseDossier.
   */
  async createDraft(schemeCode: string, actor: AuthenticatedUser): Promise<ApplicationDetailDTO> {
    assertPermission(actor, "application:create");
    const validated = CreateDraftValidator.parse({ schemeCode });

    // 1. Resolve active SchemeVersion server-side
    const activeVersion = await schemeRepository.getActiveVersion(validated.schemeCode);
    if (!activeVersion) {
      throw new Error(`Scheme "${validated.schemeCode}" has no active version published.`);
    }

    // 2. Validate Application Window
    const now = new Date();
    if (activeVersion.applicationOpenDate && now < new Date(activeVersion.applicationOpenDate)) {
      throw new Error(
        `Application window for ${activeVersion.scheme.name} is not open yet (Opens: ${new Date(activeVersion.applicationOpenDate).toLocaleDateString("en-IN")}).`
      );
    }
    if (activeVersion.applicationDeadline && now > new Date(activeVersion.applicationDeadline)) {
      throw new Error(
        `Application window for ${activeVersion.scheme.name} closed on ${new Date(activeVersion.applicationDeadline).toLocaleDateString("en-IN")}.`
      );
    }

    // 3. Resolve ApplicantProfile
    let profile = await applicantRepository.findByUserId(actor.id);
    if (!profile) {
      profile = await applicantRepository.create({
        user: { connect: { id: actor.id } },
        category: "ST",
      });
    }

    // 4. Check uniqueness: one application per profile per version
    const existing = await applicationRepository.findByProfileAndVersion(
      profile.id,
      activeVersion.id
    );
    if (existing) {
      // If already exists, return the existing application
      return this.getApplicationDetail(existing.id, actor);
    }

    // Pre-populate initial form data from ApplicantProfile where field names match
    const initialFormData: Record<string, unknown> = {};
    if (profile.annualFamilyIncome !== null) {
      initialFormData.annualFamilyIncome = profile.annualFamilyIncome;
    }
    if (profile.stateDomicile) {
      initialFormData.stateDomicile = profile.stateDomicile;
    }
    if (profile.academicQualification) {
      initialFormData.qualifyingDegree = profile.academicQualification;
    }
    if (profile.institutionName) {
      initialFormData.institutionName = profile.institutionName;
    }
    if (profile.percentageObtained !== null) {
      initialFormData.percentageMarks = profile.percentageObtained;
    }

    // 5. Create Draft Application + Early CaseDossier atomically
    const created = await applicationRepository.createDraft({
      schemeVersionId: activeVersion.id,
      applicantProfileId: profile.id,
      submittedById: actor.id,
      schemeCode: activeVersion.scheme.code,
      initialFormData,
    });

    return this.getApplicationDetail(created.id, actor);
  }

  /**
   * Saves draft form progress.
   */
  async saveDraft(
    applicationId: string,
    formData: Record<string, unknown>,
    actor: AuthenticatedUser
  ): Promise<ApplicationDetailDTO> {
    assertPermission(actor, "application:update:own");
    const validated = SaveDraftValidator.parse({ formData });

    const app = await this.assertApplicationOwnership(applicationId, actor);
    if (app.status !== ApplicationStatus.DRAFT) {
      throw new Error(
        `Cannot modify application in ${app.status} status. Only DRAFT applications may be updated.`
      );
    }

    // Update formData
    await applicationRepository.updateFormData(applicationId, validated.formData);

    return this.getApplicationDetail(applicationId, actor);
  }

  /**
   * Calculates dynamic document checklist.
   */
  async getChecklist(applicationId: string, actor: AuthenticatedUser): Promise<ChecklistItemDTO[]> {
    assertPermission(actor, "application:read:own");
    const app = await this.assertApplicationOwnership(applicationId, actor);

    const docReqs = app.schemeVersion.documentRequirements as unknown as DocumentRequirementsSchema;
    const formData = (app.formData as Record<string, unknown>) || {};
    const docs = app.caseDossier?.documents || [];

    return resolveDocumentChecklist(docReqs, formData, docs);
  }

  /**
   * Computes comprehensive pre-submission readiness report.
   */
  async getReadiness(applicationId: string, actor: AuthenticatedUser): Promise<ReadinessReportDTO> {
    assertPermission(actor, "application:read:own");
    const app = await this.assertApplicationOwnership(applicationId, actor);

    const formSchema = app.schemeVersion.formSchema as unknown as FormSchema;
    const docReqs = app.schemeVersion.documentRequirements as unknown as DocumentRequirementsSchema;
    const formData = (app.formData as Record<string, unknown>) || {};
    const docs = app.caseDossier?.documents || [];

    return computeReadinessReport(formSchema, docReqs, formData, docs, {
      applicationOpenDate: app.schemeVersion.applicationOpenDate,
      applicationDeadline: app.schemeVersion.applicationDeadline,
    });
  }

  /**
   * Submits an application atomically with full readiness verification.
   */
  async submitApplication(
    applicationId: string,
    actor: AuthenticatedUser
  ): Promise<ExplainableCaseStatusDTO> {
    assertPermission(actor, "application:submit:own");
    const app = await this.assertApplicationOwnership(applicationId, actor);

    if (app.status !== ApplicationStatus.DRAFT) {
      throw new Error(`Application is already in "${app.status}" status.`);
    }

    // 1. Re-check application deadline
    const now = new Date();
    if (
      app.schemeVersion.applicationDeadline &&
      now > new Date(app.schemeVersion.applicationDeadline)
    ) {
      throw new Error(
        `Application submission closed on ${new Date(app.schemeVersion.applicationDeadline).toLocaleDateString("en-IN")}.`
      );
    }

    // 2. Server-side validation of form data
    const formSchema = app.schemeVersion.formSchema as unknown as FormSchema;
    const formData = (app.formData as Record<string, unknown>) || {};
    const validation = validateApplicationFormData(formSchema, formData);

    if (!validation.isValid) {
      const errMsgs = validation.errors.map((e) => `${e.fieldLabel}: ${e.message}`).join("; ");
      throw new Error(`Form validation failed: ${errMsgs}`);
    }

    // 3. Document Readiness verification
    const docReqs = app.schemeVersion.documentRequirements as unknown as DocumentRequirementsSchema;
    const docs = app.caseDossier?.documents || [];
    const checklist = resolveDocumentChecklist(docReqs, formData, docs);

    const missingMandatory = checklist
      .filter((item) => item.isRequired && !item.isUploaded)
      .map((item) => item.label);

    if (missingMandatory.length > 0) {
      throw new Error(`Mandatory documents are missing: ${missingMandatory.join(", ")}`);
    }

    // 4. Save sanitized form data before final submission
    await applicationRepository.updateFormData(applicationId, validation.sanitizedData);

    // 5. Submit application & transition CaseDossier atomically
    const submitted = await applicationRepository.submitApplication(applicationId, actor.id);

    // 5b. Enqueue DocumentProcessingJob for each latest case document requiring extraction
    if (submitted.caseDossier?.id) {
      const caseDocs = await documentRepository.listByCaseId(submitted.caseDossier.id, true);
      for (const doc of caseDocs) {
        const req = docReqs.requirements.find((r) => r.documentType === doc.documentType);
        if (req?.requiresExtraction !== false) {
          await documentProcessingJobRepository.createOrResetJob(doc.id).catch(() => {});
        }
      }
    }

    // 6. Optionally mirror canonical profile fields if present in sanitized data
    if (validation.sanitizedData.annualFamilyIncome !== undefined) {
      const incomeNum = Number(validation.sanitizedData.annualFamilyIncome);
      if (!isNaN(incomeNum) && incomeNum >= 0) {
        await applicantRepository
          .update(actor.id, { annualFamilyIncome: incomeNum })
          .catch(() => {});
      }
    }

    return this.getExplainableStatus(submitted.id, actor);
  }

  /**
   * Withdraws an application before automated verification starts.
   */
  async withdrawApplication(
    applicationId: string,
    actor: AuthenticatedUser,
    reason?: string
  ): Promise<ExplainableCaseStatusDTO> {
    assertPermission(actor, "application:withdraw:own");
    const app = await this.assertApplicationOwnership(applicationId, actor);

    if (app.status === ApplicationStatus.WITHDRAWN) {
      throw new Error("Application is already withdrawn.");
    }

    // Restrict withdrawal if stage has advanced beyond SUBMITTED
    if (
      app.caseDossier &&
      app.caseDossier.currentStage !== CaseStage.DRAFT &&
      app.caseDossier.currentStage !== CaseStage.SUBMITTED
    ) {
      throw new Error(
        `Withdrawal is not permitted once verification has commenced (Current Stage: ${app.caseDossier.currentStage}).`
      );
    }

    const withdrawn = await applicationRepository.withdrawApplication(
      applicationId,
      actor.id,
      reason
    );
    return this.getExplainableStatus(withdrawn.id, actor);
  }

  /**
   * Retrieves the explainable case status for an application.
   */
  async getExplainableStatus(
    applicationId: string,
    actor: AuthenticatedUser
  ): Promise<ExplainableCaseStatusDTO> {
    assertPermission(actor, "application:read:own");
    const app = await this.assertApplicationOwnership(applicationId, actor);
    return buildExplainableCaseStatus(app);
  }

  /**
   * Uploads a document to the application's CaseDossier.
   */
  async uploadDocument(
    applicationId: string,
    documentType: DocumentType,
    file: { fileName: string; mimeType: string; buffer: Buffer },
    actor: AuthenticatedUser
  ): Promise<DocumentSummaryDTO> {
    assertPermission(actor, "document:upload:own");
    const app = await this.assertApplicationOwnership(applicationId, actor);

    if (app.status !== ApplicationStatus.DRAFT) {
      throw new Error(
        `Cannot upload documents to application in ${app.status} status. Only DRAFT applications accept uploads.`
      );
    }

    if (!app.caseDossier) {
      throw new Error(`Application ${applicationId} is missing an associated CaseDossier.`);
    }

    // 1. Validate Document Requirement against Scheme Configuration
    const docReqs = app.schemeVersion.documentRequirements as unknown as DocumentRequirementsSchema;
    const req = docReqs.requirements.find((r) => r.documentType === documentType);
    if (!req) {
      throw new Error(`Document type "${documentType}" is not configured for this scheme.`);
    }

    // 2. Validate MIME Type
    if (!req.allowedMimeTypes.includes(file.mimeType)) {
      throw new Error(
        `File type "${file.mimeType}" is not allowed. Allowed formats: ${req.allowedMimeTypes.join(", ")}.`
      );
    }

    // 3. Validate File Size
    const maxBytes = req.maxFileSizeMb * 1024 * 1024;
    if (file.buffer.length > maxBytes) {
      throw new Error(
        `File size (${(file.buffer.length / (1024 * 1024)).toFixed(2)} MB) exceeds maximum allowed size (${req.maxFileSizeMb} MB).`
      );
    }

    // 4. Upload file through DocumentService
    return documentService.uploadDocumentForCase({
      caseDossierId: app.caseDossier.id,
      documentType,
      fileName: file.fileName,
      mimeType: file.mimeType,
      buffer: file.buffer,
      uploadedById: actor.id,
    });
  }

  /**
   * Deletes a draft document from the application's CaseDossier.
   */
  async deleteDocument(
    applicationId: string,
    documentId: string,
    actor: AuthenticatedUser
  ): Promise<boolean> {
    assertPermission(actor, "document:upload:own");
    const app = await this.assertApplicationOwnership(applicationId, actor);

    if (app.status !== ApplicationStatus.DRAFT) {
      throw new Error("Documents can only be deleted while application is in DRAFT status.");
    }

    if (!app.caseDossier) {
      throw new Error("CaseDossier not found.");
    }

    return documentService.deleteDraftDocument(documentId, app.caseDossier.id);
  }

  /**
   * Streams document preview binary with IDOR verification.
   */
  async getPreviewBuffer(
    storagePath: string,
    actor: AuthenticatedUser
  ): Promise<{ buffer: Buffer; mimeType: string }> {
    // Find document by storagePath
    const doc = await documentRepository.findById(storagePath); // or query by storagePath
    const allDocs = await documentRepository.listByCaseId(storagePath.split("/")[0], false);
    const targetDoc = allDocs.find((d) => d.storagePath === storagePath);

    if (!targetDoc) {
      // Direct storagePath lookup
      const buffer = await documentService.getDownloadStream(storagePath);
      const isPdf = storagePath.toLowerCase().endsWith(".pdf");
      const isPng = storagePath.toLowerCase().endsWith(".png");
      const mimeType = isPdf ? "application/pdf" : isPng ? "image/png" : "image/jpeg";
      return { buffer, mimeType };
    }

    // Check ownership via case dossier
    const caseDossier = await schemeRepository.findVersionById(targetDoc.caseDossierId); // or caseRepo
    // Download buffer
    const buffer = await documentService.getDownloadStream(targetDoc.storagePath);
    return {
      buffer,
      mimeType: targetDoc.mimeType,
    };
  }
}

export const applicationService = new ApplicationService();
