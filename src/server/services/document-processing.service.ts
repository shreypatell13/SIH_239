import { Document, DocumentProcessingJob, DocumentType, ProcessingStatus } from "@prisma/client";
import { prisma } from "../db";
import { IStorageAdapter } from "../storage/storage.interface";
import { defaultStorage } from "../storage/local-storage.adapter";
import { documentRepository } from "../repositories/document.repository";
import { documentProcessingJobRepository } from "../repositories/document-processing-job.repository";
import { auditRepository } from "../repositories/audit.repository";
import { IOCRProvider } from "../documents/ocr-provider.interface";
import { TesseractOCRProvider } from "../documents/tesseract-ocr.provider";
import { MagicByteValidator } from "../documents/security/magic-byte.validator";
import { DocumentClassifier } from "../documents/classification/document.classifier";
import { FieldExtractorRegistry } from "../documents/field-extractors";
import { ConfidenceModel } from "../documents/confidence.model";
import { AuthenticatedUser, assertPermission } from "../auth/roles";

export interface OfficerDocumentExtractionDTO {
  documentId: string;
  caseDossierId: string;
  documentType: DocumentType;
  classifiedAs: DocumentType | null;
  classificationConfidence: number | null;
  processingStatus: ProcessingStatus;
  pageCount: number | null;
  extractedFields: Array<{
    id: string;
    fieldKey: string;
    rawValue: string;
    normalizedValue: string | null;
    confidenceScore: number;
    pageNumber: number;
    boundingBox?: {
      x: number | null;
      y: number | null;
      width: number | null;
      height: number | null;
    };
    sourceSnippet: string | null;
    extractorProvider: string | null;
    extractorVersion: string | null;
    extractionMethod: string | null;
    extractedBy: string;
  }>;
}

export interface ApplicantDocumentExtractionDTO {
  documentId: string;
  documentType: DocumentType;
  processingStatus: ProcessingStatus;
  extractedFields: Array<{
    fieldKey: string;
    isDetected: boolean;
  }>;
}

export interface ApplicationProcessingStatusDTO {
  applicationId: string;
  allProcessed: boolean;
  documents: Array<{
    documentId: string;
    documentType: DocumentType;
    processingStatus: ProcessingStatus;
    classifiedAs: DocumentType | null;
    classificationConfidence: number | null;
    requiresReview: boolean;
    fieldCount: number;
    pageCount: number | null;
  }>;
}

export class DocumentProcessingService {
  constructor(
    private storage: IStorageAdapter = defaultStorage,
    private ocrProvider: IOCRProvider = new TesseractOCRProvider()
  ) {}

  /**
   * Calculates exponential backoff retry time.
   * 1st retry: 30s, 2nd retry: 120s, 3rd retry: 300s
   */
  static calculateNextRetry(attemptCount: number): Date {
    const backoffSeconds = attemptCount === 1 ? 30 : attemptCount === 2 ? 120 : 300;
    return new Date(Date.now() + backoffSeconds * 1000);
  }

  /**
   * Enqueues a document for OCR and intelligence processing.
   */
  async enqueueDocument(documentId: string): Promise<DocumentProcessingJob> {
    const job = await documentProcessingJobRepository.createOrResetJob(documentId);
    const doc = await documentRepository.findById(documentId);

    if (doc) {
      await auditRepository.create({
        caseDossierId: doc.caseDossierId,
        actionType: "DOCUMENT_PROCESSING_QUEUED",
        payload: {
          documentId,
          documentType: doc.documentType,
          jobId: job.id,
        },
      });
    }

    return job;
  }

  /**
   * Executes the full document intelligence pipeline for a claimed job.
   */
  async processJob(jobId: string): Promise<DocumentProcessingJob> {
    const job = await documentProcessingJobRepository.findById(jobId);
    if (!job || !job.document) {
      throw new Error(`Document processing job ${jobId} not found`);
    }

    const doc = job.document;
    const caseDossierId = doc.caseDossierId;

    await auditRepository.create({
      caseDossierId,
      actionType: "DOCUMENT_PROCESSING_STARTED",
      payload: {
        documentId: doc.id,
        jobId: job.id,
        attemptCount: job.attemptCount,
      },
    });

    try {
      // Step 1: Download binary from storage adapter
      const buffer = await this.storage.download(doc.storagePath);

      // Step 2: Magic-Byte security validation
      const magicValidation = MagicByteValidator.validate(buffer, doc.mimeType);
      if (!magicValidation.isValid) {
        await documentProcessingJobRepository.updateJob(job.id, {
          status: ProcessingStatus.FAILED,
          failureReason: "SECURITY_REJECTED",
          lastError: magicValidation.error,
          completedAt: new Date(),
        });

        await documentRepository.updateProcessingResult(doc.id, {
          processingStatus: ProcessingStatus.FAILED,
        });

        await auditRepository.create({
          caseDossierId,
          actionType: "DOCUMENT_SECURITY_REJECTED",
          payload: {
            documentId: doc.id,
            reason: magicValidation.error,
          },
        });

        await auditRepository.create({
          caseDossierId,
          actionType: "DOCUMENT_PROCESSING_FAILED",
          payload: {
            documentId: doc.id,
            reason: "SECURITY_REJECTED",
            attemptCount: job.attemptCount,
          },
        });

        const updated = await documentProcessingJobRepository.findById(job.id);
        return updated!;
      }

      // Step 3: OCR Text and Region Extraction
      const ocrResult = await this.ocrProvider.extractText(buffer, doc.mimeType);

      await auditRepository.create({
        caseDossierId,
        actionType: "DOCUMENT_OCR_COMPLETED",
        payload: {
          documentId: doc.id,
          pageCount: ocrResult.pages.length,
          averageConfidence: ocrResult.averageConfidence,
          providerName: ocrResult.providerName,
        },
      });

      // Step 4: Classification
      const classification = DocumentClassifier.classify(ocrResult);

      await auditRepository.create({
        caseDossierId,
        actionType: "DOCUMENT_CLASSIFIED",
        payload: {
          documentId: doc.id,
          declaredType: doc.documentType,
          classifiedAs: classification.classifiedType,
          confidence: classification.confidenceScore,
          typeMismatch: doc.documentType !== classification.classifiedType,
        },
      });

      // Step 5: Field Extraction using declared document type
      const extractor = FieldExtractorRegistry.getExtractor(doc.documentType);
      const extractedFields = extractor ? await extractor.extract(ocrResult) : [];

      await auditRepository.create({
        caseDossierId,
        actionType: "DOCUMENT_FIELDS_EXTRACTED",
        payload: {
          documentId: doc.id,
          fieldCount: extractedFields.length,
          fields: extractedFields.map((f) => ({
            fieldKey: f.fieldKey,
            confidence: f.confidenceScore,
          })),
        },
      });

      // Step 6: Composite Confidence Evaluation
      const evaluation = ConfidenceModel.evaluate({
        declaredType: doc.documentType,
        classifiedType: classification.classifiedType,
        classificationConfidence: classification.confidenceScore,
        ocrAverageConfidence: ocrResult.averageConfidence,
        extractedFields,
      });

      // Step 7: Persist Extracted Fields with Provenance
      if (extractedFields.length > 0) {
        await documentRepository.saveExtractedFieldsBatch(
          doc.id,
          extractedFields.map((f) => ({
            fieldKey: f.fieldKey,
            rawValue: f.rawValue,
            normalizedValue: f.normalizedValue,
            confidenceScore: f.confidenceScore,
            pageNumber: f.pageNumber,
            boundingBoxX: f.boundingBox?.x,
            boundingBoxY: f.boundingBox?.y,
            boundingBoxWidth: f.boundingBox?.width,
            boundingBoxHeight: f.boundingBox?.height,
            sourceSnippet: f.sourceSnippet,
            extractorProvider: f.extractorProvider,
            extractorVersion: f.extractorVersion,
            extractionMethod: f.extractionMethod,
          }))
        );
      }

      // Step 8: Update Document and Job status
      await documentRepository.updateProcessingResult(doc.id, {
        classifiedAs: classification.classifiedType,
        classificationConfidence: classification.confidenceScore,
        processingStatus: evaluation.status,
        pageCount: ocrResult.pages.length,
      });

      const updatedJob = await documentProcessingJobRepository.updateJob(job.id, {
        status: evaluation.status,
        completedAt: new Date(),
      });

      await auditRepository.create({
        caseDossierId,
        actionType: "DOCUMENT_PROCESSING_COMPLETED",
        payload: {
          documentId: doc.id,
          finalStatus: evaluation.status,
          isReviewRequired: evaluation.isReviewRequired,
        },
      });

      return updatedJob;
    } catch (err: any) {
      const errorMessage = err?.message || "Unknown processing error";

      if (job.attemptCount < job.maxAttempts) {
        const nextRetry = DocumentProcessingService.calculateNextRetry(job.attemptCount);
        const updated = await documentProcessingJobRepository.updateJob(job.id, {
          status: ProcessingStatus.PENDING,
          lastError: errorMessage,
          nextRetryAt: nextRetry,
        });

        await auditRepository.create({
          caseDossierId,
          actionType: "DOCUMENT_PROCESSING_FAILED",
          payload: {
            documentId: doc.id,
            reason: errorMessage,
            attemptCount: job.attemptCount,
            willRetry: true,
            nextRetryAt: nextRetry.toISOString(),
          },
        });

        return updated;
      } else {
        // Max attempts exhausted: Mark FAILED without creating deficiency
        const updated = await documentProcessingJobRepository.updateJob(job.id, {
          status: ProcessingStatus.FAILED,
          failureReason: errorMessage,
          lastError: errorMessage,
          completedAt: new Date(),
        });

        await documentRepository.updateProcessingResult(doc.id, {
          processingStatus: ProcessingStatus.FAILED,
        });

        await auditRepository.create({
          caseDossierId,
          actionType: "DOCUMENT_PROCESSING_FAILED",
          payload: {
            documentId: doc.id,
            reason: errorMessage,
            attemptCount: job.attemptCount,
            willRetry: false,
          },
        });

        return updated;
      }
    }
  }

  /**
   * Allows verification officers to correct AI-inferred classification.
   * Updates Document.classifiedAs and produces AuditLog. Does NOT create an ExtractedField.
   */
  async correctClassification(
    documentId: string,
    correctedType: DocumentType,
    actor: AuthenticatedUser
  ): Promise<Document> {
    assertPermission(actor, "document:annotate:assigned");

    const doc = await documentRepository.findById(documentId);
    if (!doc) {
      throw new Error(`Document ${documentId} not found`);
    }

    const previousType = doc.classifiedAs;

    const updated = await documentRepository.updateProcessingResult(doc.id, {
      classifiedAs: correctedType,
    });

    await auditRepository.create({
      caseDossierId: doc.caseDossierId,
      actorId: actor.id,
      actorRole: actor.role,
      actionType: "DOCUMENT_CLASSIFICATION_CORRECTED",
      payload: {
        documentId: doc.id,
        previousType,
        correctedType,
        officerId: actor.id,
      },
    });

    return updated;
  }

  /**
   * Allows verification officers to trigger document reprocessing.
   */
  async reprocessDocument(
    documentId: string,
    actor: AuthenticatedUser
  ): Promise<DocumentProcessingJob> {
    assertPermission(actor, "document:annotate:assigned");

    const doc = await documentRepository.findById(documentId);
    if (!doc) {
      throw new Error(`Document ${documentId} not found`);
    }

    const job = await documentProcessingJobRepository.createOrResetJob(documentId);
    await documentRepository.updateProcessingResult(documentId, {
      processingStatus: ProcessingStatus.PENDING,
    });

    await auditRepository.create({
      caseDossierId: doc.caseDossierId,
      actorId: actor.id,
      actorRole: actor.role,
      actionType: "DOCUMENT_REPROCESS_TRIGGERED",
      payload: {
        documentId,
        triggeredById: actor.id,
      },
    });

    return job;
  }

  /**
   * Retrieves full extraction data for Verification Officers (including bounding boxes and confidence).
   */
  async getOfficerDocumentExtraction(
    documentId: string,
    actor: AuthenticatedUser
  ): Promise<OfficerDocumentExtractionDTO> {
    assertPermission(actor, "evidence:inspect");

    const doc = await documentRepository.findById(documentId);
    if (!doc) {
      throw new Error(`Document ${documentId} not found`);
    }

    const fields = doc.extractedFields || [];

    return {
      documentId: doc.id,
      caseDossierId: doc.caseDossierId,
      documentType: doc.documentType,
      classifiedAs: doc.classifiedAs,
      classificationConfidence: doc.classificationConfidence,
      processingStatus: doc.processingStatus,
      pageCount: doc.pageCount,
      extractedFields: fields.map((f) => ({
        id: f.id,
        fieldKey: f.fieldKey,
        rawValue: f.rawValue,
        normalizedValue: f.normalizedValue,
        confidenceScore: f.confidenceScore,
        pageNumber: f.pageNumber,
        boundingBox: {
          x: f.boundingBoxX,
          y: f.boundingBoxY,
          width: f.boundingBoxWidth,
          height: f.boundingBoxHeight,
        },
        sourceSnippet: f.sourceSnippet,
        extractorProvider: f.extractorProvider,
        extractorVersion: f.extractorVersion,
        extractionMethod: f.extractionMethod,
        extractedBy: f.extractedBy,
      })),
    };
  }

  /**
   * Retrieves sanitized extraction metadata for Applicants (only field labels and detected status).
   */
  async getApplicantDocumentExtraction(
    documentId: string,
    actor: AuthenticatedUser
  ): Promise<ApplicantDocumentExtractionDTO> {
    const doc = await documentRepository.findById(documentId);
    if (!doc) {
      throw new Error(`Document ${documentId} not found`);
    }

    // Verify ownership through CaseDossier -> Application -> ApplicantProfile -> userId
    const application = await prisma.application.findFirst({
      where: {
        caseDossier: { id: doc.caseDossierId },
        applicantProfile: { userId: actor.id },
      },
    });

    if (!application) {
      throw new Error("Forbidden: You do not own this document");
    }

    const fields = doc.extractedFields || [];

    return {
      documentId: doc.id,
      documentType: doc.documentType,
      processingStatus: doc.processingStatus,
      extractedFields: fields.map((f) => ({
        fieldKey: f.fieldKey,
        isDetected: true,
      })),
    };
  }

  /**
   * Retrieves processing status for all documents in an application (for applicant polling).
   */
  async getApplicationProcessingStatus(
    applicationId: string,
    actor: AuthenticatedUser
  ): Promise<ApplicationProcessingStatusDTO> {
    const app = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        applicantProfile: true,
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

    if (!app) {
      throw new Error(`Application ${applicationId} not found`);
    }

    if (app.applicantProfile.userId !== actor.id && actor.role === "APPLICANT") {
      throw new Error("Forbidden: You do not own this application");
    }

    const docs = app.caseDossier?.documents || [];
    const allProcessed = docs.every(
      (d) =>
        d.processingStatus === ProcessingStatus.COMPLETED ||
        d.processingStatus === ProcessingStatus.REVIEW_REQUIRED ||
        d.processingStatus === ProcessingStatus.FAILED
    );

    return {
      applicationId: app.id,
      allProcessed,
      documents: docs.map((d) => ({
        documentId: d.id,
        documentType: d.documentType,
        processingStatus: d.processingStatus,
        classifiedAs: d.classifiedAs,
        classificationConfidence: d.classificationConfidence,
        requiresReview: d.processingStatus === ProcessingStatus.REVIEW_REQUIRED,
        fieldCount: d.extractedFields?.length || 0,
        pageCount: d.pageCount,
      })),
    };
  }
}

export const documentProcessingService = new DocumentProcessingService();
