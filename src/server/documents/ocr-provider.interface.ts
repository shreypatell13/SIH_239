/**
 * OCR Provider Abstraction & Types
 * Phase 2F: Document Intelligence & Multilingual OCR Pipeline
 */

export interface NormalizedBBox {
  x: number; // 0.0 - 1.0 (relative to page width)
  y: number; // 0.0 - 1.0 (relative to page height)
  width: number; // 0.0 - 1.0
  height: number; // 0.0 - 1.0
}

export interface OCRWord {
  text: string;
  confidence: number; // 0.0 - 1.0
  bbox: NormalizedBBox | null;
  pageNumber: number;
}

export interface OCRRegion {
  regionText: string;
  confidence: number;
  bbox: NormalizedBBox | null;
  pageNumber: number;
  words: OCRWord[];
}

export interface PageOCRResult {
  pageNumber: number;
  rawText: string;
  confidence: number; // 0.0 - 1.0
  detectedLanguage?: string;
  wordCount: number;
  words: OCRWord[];
  regions: OCRRegion[];
}

export interface OCRResult {
  pages: PageOCRResult[];
  fullText: string;
  averageConfidence: number;
  detectedLanguages: string[];
  processingTimeMs: number;
  providerName: string;
  providerVersion: string;
}

export interface IOCRProvider {
  readonly providerName: string;
  readonly providerVersion: string;

  extractText(
    fileBuffer: Buffer,
    mimeType: string,
    hints?: { expectedLanguages?: string[]; deskew?: boolean }
  ): Promise<OCRResult>;

  extractFromImage(
    imageBuffer: Buffer,
    pageNumber: number,
    hints?: { expectedLanguages?: string[]; deskew?: boolean }
  ): Promise<PageOCRResult>;
}
