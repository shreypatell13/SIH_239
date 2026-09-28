import { DocumentType } from "@prisma/client";
import { NormalizedBBox, OCRResult } from "../ocr-provider.interface";

export interface ExtractedEvidenceField {
  fieldKey: string;
  fieldLabel: string;
  rawValue: string;
  normalizedValue?: string;
  confidenceScore: number; // 0.0 - 1.0
  pageNumber: number;
  boundingBox?: NormalizedBBox;
  sourceSnippet?: string;
  extractorProvider: string;
  extractorVersion: string;
  extractionMethod: "REGEX" | "KEYWORD_PROXIMITY" | "POSITIONAL" | "MRZ";
}

export interface IFieldExtractor {
  readonly documentType: DocumentType;
  extract(
    ocrResult: OCRResult,
    context?: { schemeCode?: string }
  ): Promise<ExtractedEvidenceField[]>;
}
