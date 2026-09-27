export type DocumentType =
  | "CASTE_CERTIFICATE"
  | "INCOME_CERTIFICATE"
  | "DEGREE_TRANSCRIPT"
  | "ADMISSION_OFFER_LETTER"
  | "RESEARCH_PROPOSAL"
  | "PASSPORT"
  | "UNKNOWN";

export interface BoundingBox {
  pageNumber: number;
  x: number; // Normalized 0..1
  y: number; // Normalized 0..1
  width: number; // Normalized 0..1
  height: number; // Normalized 0..1
}

export interface ExtractedEvidence {
  fieldKey: string;
  fieldLabel: string;
  extractedValue: string;
  normalizedValue?: string | number | Date;
  confidenceScore: number; // 0..1
  boundingBox?: BoundingBox;
  sourceSnippet?: string;
}

export interface ClassificationResult {
  classifiedType: DocumentType;
  confidenceScore: number; // 0..1
  detectedLanguage?: string;
  pageCount: number;
}

export interface DocumentAnalysisResult {
  documentId: string;
  classification: ClassificationResult;
  extractedText: string;
  extractedFields: Record<string, ExtractedEvidence>;
  crossDocumentDiscrepancies: Array<{
    targetDocumentId: string;
    fieldKey: string;
    description: string;
    similarityScore: number;
    isSeverityWarning: boolean;
  }>;
  analyzedAt: Date;
}

export interface IDocumentAIService {
  classifyDocument(fileBuffer: Buffer, mimeType: string): Promise<ClassificationResult>;
  extractText(fileBuffer: Buffer, mimeType: string): Promise<{ text: string; confidence: number }>;
  extractFields(
    fileBuffer: Buffer,
    expectedType: DocumentType,
    schemeContext?: string
  ): Promise<Record<string, ExtractedEvidence>>;
  analyzeFullDocument(
    documentId: string,
    fileBuffer: Buffer,
    mimeType: string,
    expectedType?: DocumentType
  ): Promise<DocumentAnalysisResult>;
}
