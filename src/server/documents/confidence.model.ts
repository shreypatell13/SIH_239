import { DocumentType, ProcessingStatus } from "@prisma/client";
import { ExtractedEvidenceField } from "./field-extractors";

export interface ConfidenceEvaluationParams {
  declaredType: DocumentType;
  classifiedType: DocumentType;
  classificationConfidence: number;
  ocrAverageConfidence: number;
  extractedFields: ExtractedEvidenceField[];
  requiresExtraction?: boolean;
}

export interface ConfidenceEvaluationResult {
  status: ProcessingStatus;
  reasons: string[];
  isReviewRequired: boolean;
}

export class ConfidenceModel {
  static readonly OCR_HIGH = 0.7;
  static readonly OCR_LOW = 0.45;

  static readonly CLASSIFICATION_HIGH = 0.8;
  static readonly CLASSIFICATION_MEDIUM = 0.6;

  static readonly FIELD_HIGH = 0.75;
  static readonly FIELD_LOW = 0.5;

  /**
   * Evaluates composite confidence and determines overall ProcessingStatus.
   */
  static evaluate(params: ConfidenceEvaluationParams): ConfidenceEvaluationResult {
    const reasons: string[] = [];

    // 1. Check OCR Average Confidence
    if (params.ocrAverageConfidence < this.OCR_LOW) {
      reasons.push(
        `OCR average confidence (${params.ocrAverageConfidence.toFixed(2)}) is below minimum threshold (${this.OCR_LOW})`
      );
      return {
        status: ProcessingStatus.FAILED,
        reasons,
        isReviewRequired: false,
      };
    }

    let isReviewRequired = false;

    // 2. Check Document Type Mismatch
    if (
      params.declaredType !== params.classifiedType &&
      params.classifiedType !== DocumentType.OTHER
    ) {
      isReviewRequired = true;
      reasons.push(
        `Declared document type (${params.declaredType}) differs from AI-classified type (${params.classifiedType})`
      );
    }

    // 3. Check Classification Confidence
    if (params.classificationConfidence < this.CLASSIFICATION_MEDIUM) {
      isReviewRequired = true;
      reasons.push(
        `Classification confidence (${params.classificationConfidence.toFixed(2)}) is below medium threshold (${this.CLASSIFICATION_MEDIUM})`
      );
    }

    // 4. Check Extracted Fields Confidence
    if (params.requiresExtraction !== false) {
      if (params.extractedFields.length === 0) {
        isReviewRequired = true;
        reasons.push("No structured fields could be extracted from document text");
      } else {
        const lowConfidenceFields = params.extractedFields.filter(
          (f) => f.confidenceScore < this.FIELD_LOW
        );
        if (lowConfidenceFields.length > 0) {
          isReviewRequired = true;
          reasons.push(
            `${lowConfidenceFields.length} extracted field(s) have confidence below minimum threshold (${this.FIELD_LOW}): ${lowConfidenceFields.map((f) => f.fieldKey).join(", ")}`
          );
        }
      }
    }

    if (isReviewRequired) {
      return {
        status: ProcessingStatus.REVIEW_REQUIRED,
        reasons,
        isReviewRequired: true,
      };
    }

    return {
      status: ProcessingStatus.COMPLETED,
      reasons: ["All confidence checks passed successfully"],
      isReviewRequired: false,
    };
  }
}
