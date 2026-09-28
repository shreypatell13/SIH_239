import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "fs";
import path from "path";
import { DocumentType, ProcessingStatus } from "@prisma/client";
import { MagicByteValidator } from "@/server/documents/security/magic-byte.validator";
import { DocumentClassifier } from "@/server/documents/classification/document.classifier";
import { ConfidenceModel } from "@/server/documents/confidence.model";
import {
  CasteCertificateExtractor,
  IncomeCertificateExtractor,
  DegreeTranscriptExtractor,
  AdmissionOfferExtractor,
  PassportExtractor,
  ResearchProposalExtractor,
  FieldExtractorRegistry,
} from "@/server/documents/field-extractors";
import { DocumentProcessingService } from "@/server/services/document-processing.service";
import { OCRResult } from "@/server/documents/ocr-provider.interface";

describe("Phase 2F — Document Intelligence & Multilingual OCR Pipeline Unit Tests", () => {
  const fixturesDir = path.join(process.cwd(), "tests", "fixtures");

  const loadOcrFixture = (name: string): OCRResult => {
    const raw = fs.readFileSync(path.join(fixturesDir, "ocr-results", name), "utf-8");
    return JSON.parse(raw);
  };

  const loadDocFixture = (name: string): Buffer => {
    return fs.readFileSync(path.join(fixturesDir, "documents", name));
  };

  describe("1. Security: MagicByteValidator", () => {
    it("accepts valid PDF magic bytes (%PDF-)", () => {
      const validPdfBuffer = loadDocFixture("synthetic-valid.pdf");
      const result = MagicByteValidator.validate(validPdfBuffer, "application/pdf");
      expect(result.isValid).toBe(true);
      expect(result.detectedMimeType).toBe("application/pdf");
    });

    it("rejects JPEG masquerading as PDF (magic byte mismatch)", () => {
      const fakePdfBuffer = loadDocFixture("synthetic-fake-pdf.jpg");
      const result = MagicByteValidator.validate(fakePdfBuffer, "application/pdf");
      expect(result.isValid).toBe(false);
      expect(result.detectedMimeType).toBe("image/jpeg");
      expect(result.error).toContain("MIME_SIGNATURE_MISMATCH");
    });

    it("accepts valid JPEG bytes (FF D8 FF)", () => {
      const validJpeg = loadDocFixture("synthetic-jpeg.jpg");
      const result = MagicByteValidator.validate(validJpeg, "image/jpeg");
      expect(result.isValid).toBe(true);
      expect(result.detectedMimeType).toBe("image/jpeg");
    });

    it("rejects empty or corrupt buffer", () => {
      const emptyBuffer = Buffer.from([]);
      const result = MagicByteValidator.validate(emptyBuffer, "application/pdf");
      expect(result.isValid).toBe(false);
      expect(result.error).toBe("FILE_TOO_SHORT_OR_EMPTY");
    });
  });

  describe("2. Field Extractors", () => {
    it("extracts structured fields from Caste Certificate OCR fixture", async () => {
      const ocr = loadOcrFixture("caste-certificate-ocr.json");
      const extractor = new CasteCertificateExtractor();
      const fields = await extractor.extract(ocr);

      expect(fields.length).toBeGreaterThan(0);

      const applicantName = fields.find((f) => f.fieldKey === "applicantName");
      expect(applicantName).toBeDefined();
      expect(applicantName?.normalizedValue).toBe("RAMESH KUMAR MEENA");
      expect(applicantName?.extractorProvider).toBe("deterministic-extractor");
      expect(applicantName?.extractionMethod).toBe("REGEX");

      const category = fields.find((f) => f.fieldKey === "casteCategory");
      expect(category).toBeDefined();
      expect(category?.normalizedValue).toBe("ST");

      const tribe = fields.find((f) => f.fieldKey === "tribeName");
      expect(tribe).toBeDefined();
      expect(tribe?.normalizedValue).toBe("MEENA");

      const certNo = fields.find((f) => f.fieldKey === "certificateNumber");
      expect(certNo).toBeDefined();
      expect(certNo?.normalizedValue).toBe("ST/2024/09876");
    });

    it("normalizes income strings ('Rs. 4,50,000/-' -> '450000') in Income Certificate", async () => {
      expect(IncomeCertificateExtractor.normalizeIncome("Rs. 4,50,000/-")).toBe("450000");
      expect(IncomeCertificateExtractor.normalizeIncome("₹4,50,000")).toBe("450000");
      expect(IncomeCertificateExtractor.normalizeIncome("4,50,000.00")).toBe("450000");

      const ocr = loadOcrFixture("income-certificate-ocr.json");
      const extractor = new IncomeCertificateExtractor();
      const fields = await extractor.extract(ocr);

      const incomeField = fields.find((f) => f.fieldKey === "annualFamilyIncome");
      expect(incomeField).toBeDefined();
      expect(incomeField?.normalizedValue).toBe("450000");
      expect(incomeField?.confidenceScore).toBeGreaterThanOrEqual(0.75);

      const fy = fields.find((f) => f.fieldKey === "financialYear");
      expect(fy).toBeDefined();
      expect(fy?.normalizedValue).toBe("2023-2024");
    });

    it("extracts degree transcript academic marks & CGPA correctly", async () => {
      const ocr = loadOcrFixture("degree-transcript-ocr.json");
      const extractor = new DegreeTranscriptExtractor();
      const fields = await extractor.extract(ocr);

      const marks = fields.find((f) => f.fieldKey === "percentageMarks");
      expect(marks).toBeDefined();
      expect(marks?.normalizedValue).toBe("74.28");

      const uni = fields.find((f) => f.fieldKey === "universityName");
      expect(uni).toBeDefined();
      expect(uni?.normalizedValue).toBe("UNIVERSITY OF DELHI");
    });

    it("extracts passport details and MRZ data", async () => {
      const ocr = loadOcrFixture("passport-ocr.json");
      const extractor = new PassportExtractor();
      const fields = await extractor.extract(ocr);

      const passNo = fields.find((f) => f.fieldKey === "passportNumber");
      expect(passNo).toBeDefined();
      expect(passNo?.normalizedValue).toBe("Z9876543");

      const nat = fields.find((f) => f.fieldKey === "nationality");
      expect(nat).toBeDefined();
      expect(nat?.normalizedValue).toBe("INDIAN");
    });

    it("retrieves extractors from FieldExtractorRegistry", () => {
      const casteExt = FieldExtractorRegistry.getExtractor(DocumentType.CASTE_CERTIFICATE);
      expect(casteExt).toBeInstanceOf(CasteCertificateExtractor);

      const incExt = FieldExtractorRegistry.getExtractor(DocumentType.INCOME_CERTIFICATE);
      expect(incExt).toBeInstanceOf(IncomeCertificateExtractor);

      const unkExt = FieldExtractorRegistry.getExtractor(DocumentType.OTHER);
      expect(unkExt).toBeUndefined();
    });
  });

  describe("3. Document Classifier", () => {
    it("classifies valid Caste Certificate OCR fixture as CASTE_CERTIFICATE with high confidence", () => {
      const ocr = loadOcrFixture("caste-certificate-ocr.json");
      const result = DocumentClassifier.classify(ocr);

      expect(result.classifiedType).toBe(DocumentType.CASTE_CERTIFICATE);
      expect(result.confidenceScore).toBeGreaterThanOrEqual(0.8);
      expect(result.classifierVersion).toBe(DocumentClassifier.VERSION);
    });

    it("classifies valid Income Certificate OCR fixture as INCOME_CERTIFICATE with high confidence", () => {
      const ocr = loadOcrFixture("income-certificate-ocr.json");
      const result = DocumentClassifier.classify(ocr);

      expect(result.classifiedType).toBe(DocumentType.INCOME_CERTIFICATE);
      expect(result.confidenceScore).toBeGreaterThanOrEqual(0.8);
    });

    it("handles garbage/unknown document by returning OTHER with low confidence", () => {
      const ocr = loadOcrFixture("unknown-document-ocr.json");
      const result = DocumentClassifier.classify(ocr);

      expect(result.classifiedType).toBe(DocumentType.OTHER);
      expect(result.confidenceScore).toBeLessThan(0.6);
    });
  });

  describe("4. Confidence Model & Thresholds", () => {
    it("returns COMPLETED when all OCR, classification, and field confidences meet HIGH/MEDIUM thresholds", () => {
      const result = ConfidenceModel.evaluate({
        declaredType: DocumentType.CASTE_CERTIFICATE,
        classifiedType: DocumentType.CASTE_CERTIFICATE,
        classificationConfidence: 0.92,
        ocrAverageConfidence: 0.9,
        extractedFields: [
          {
            fieldKey: "applicantName",
            fieldLabel: "Applicant Name",
            rawValue: "RAMESH",
            normalizedValue: "RAMESH",
            confidenceScore: 0.9,
            pageNumber: 1,
            extractorProvider: "test",
            extractorVersion: "1.0",
            extractionMethod: "REGEX",
          },
        ],
      });

      expect(result.status).toBe(ProcessingStatus.COMPLETED);
      expect(result.isReviewRequired).toBe(false);
    });

    it("flags REVIEW_REQUIRED when classification confidence < 0.60", () => {
      const result = ConfidenceModel.evaluate({
        declaredType: DocumentType.CASTE_CERTIFICATE,
        classifiedType: DocumentType.CASTE_CERTIFICATE,
        classificationConfidence: 0.45, // Low classification confidence
        ocrAverageConfidence: 0.85,
        extractedFields: [],
      });

      expect(result.status).toBe(ProcessingStatus.REVIEW_REQUIRED);
      expect(result.isReviewRequired).toBe(true);
      expect(result.reasons[0]).toContain("Classification confidence");
    });

    it("flags REVIEW_REQUIRED when declared document type differs from AI-classified type", () => {
      const result = ConfidenceModel.evaluate({
        declaredType: DocumentType.INCOME_CERTIFICATE,
        classifiedType: DocumentType.CASTE_CERTIFICATE, // Type mismatch
        classificationConfidence: 0.88,
        ocrAverageConfidence: 0.9,
        extractedFields: [],
      });

      expect(result.status).toBe(ProcessingStatus.REVIEW_REQUIRED);
      expect(result.isReviewRequired).toBe(true);
      expect(result.reasons[0]).toContain("differs from AI-classified type");
    });

    it("returns FAILED when OCR average confidence < 0.45", () => {
      const result = ConfidenceModel.evaluate({
        declaredType: DocumentType.CASTE_CERTIFICATE,
        classifiedType: DocumentType.CASTE_CERTIFICATE,
        classificationConfidence: 0.8,
        ocrAverageConfidence: 0.35, // Low OCR confidence
        extractedFields: [],
      });

      expect(result.status).toBe(ProcessingStatus.FAILED);
      expect(result.reasons[0]).toContain("OCR average confidence");
    });
  });

  describe("5. Queue & Retry Behavior", () => {
    it("calculates exponential backoff retry intervals (30s, 120s, 300s)", () => {
      const now = Date.now();
      const retry1 = DocumentProcessingService.calculateNextRetry(1);
      const retry2 = DocumentProcessingService.calculateNextRetry(2);
      const retry3 = DocumentProcessingService.calculateNextRetry(3);

      expect(retry1.getTime() - now).toBeGreaterThanOrEqual(29000);
      expect(retry1.getTime() - now).toBeLessThanOrEqual(31000);

      expect(retry2.getTime() - now).toBeGreaterThanOrEqual(119000);
      expect(retry2.getTime() - now).toBeLessThanOrEqual(121000);

      expect(retry3.getTime() - now).toBeGreaterThanOrEqual(299000);
      expect(retry3.getTime() - now).toBeLessThanOrEqual(301000);
    });
  });
});
