import { describe, it, expect } from "vitest";
import path from "path";
import fs from "fs";
import { TesseractOCRProvider } from "@/server/documents/tesseract-ocr.provider";
import { DocumentClassifier } from "@/server/documents/classification/document.classifier";
import { FieldExtractorRegistry } from "@/server/documents/field-extractors";
import {
  runConsistencyChecks,
  parseNumericValue,
  stringSimilarity,
  normalizeName,
} from "@/server/domain/eligibility/consistency-engine";
import { evaluateDocumentAiAudit } from "@/server/domain/application/readiness";
import { DocumentType } from "@prisma/client";
import { DEMO_SCENARIOS, getDemoScenarioByFilename } from "@/server/documents/demo-scenarios.config";

describe("Document Intelligence Demo Scenarios Suite", () => {
  const ocrProvider = new TesseractOCRProvider();

  describe("PART 1 & 4 — Scenario Registry and File Structure", () => {
    it("should have all demo scenario entries registered cleanly", () => {
      expect(DEMO_SCENARIOS.length).toBeGreaterThanOrEqual(8);
      const normalDocs = DEMO_SCENARIOS.filter((s) => s.scenarioType === "NORMAL");
      const mismatchDocs = DEMO_SCENARIOS.filter((s) => s.scenarioType === "INFO_MISMATCH");
      const blurDocs = DEMO_SCENARIOS.filter((s) => s.scenarioType === "BLUR");

      expect(normalDocs.length).toBeGreaterThanOrEqual(4);
      expect(mismatchDocs.length).toBeGreaterThanOrEqual(3);
      expect(blurDocs.length).toBeGreaterThanOrEqual(2);
    });

    it("should verify all physical PDF files exist under tests/fixtures/documents/demo-scenarios/", () => {
      for (const item of DEMO_SCENARIOS) {
        const fullPath = path.resolve(process.cwd(), item.relativeFilePath);
        expect(fs.existsSync(fullPath)).toBe(true);
        const stats = fs.statSync(fullPath);
        expect(stats.size).toBeGreaterThan(1000);
      }
    });

    it("should resolve scenario by filename lookup helper", () => {
      const found = getDemoScenarioByFilename("demo-income-certificate-mismatch.pdf");
      expect(found).toBeDefined();
      expect(found?.scenarioType).toBe("INFO_MISMATCH");
    });
  });

  describe("PART 2 & 5 — Information Mismatch Comparison Engine", () => {
    it("should correctly parse and normalize various currency and numeric formats", () => {
      expect(parseNumericValue("₹3,00,000")).toBe(300000);
      expect(parseNumericValue("INR 300000")).toBe(300000);
      expect(parseNumericValue("300000")).toBe(300000);
      expect(parseNumericValue("Rs. 4,50,000/-")).toBe(450000);
      expect(parseNumericValue("72.5%")).toBe(72.5);
    });

    it("should detect information mismatch when Form Income (₹3,00,000) differs from Document (₹4,50,000)", () => {
      const results = runConsistencyChecks({
        formData: {
          fullName: "RAMESH KUMAR MEENA",
          annualFamilyIncome: 300000,
          casteCategory: "ST",
        },
        applicantProfile: {
          category: "ST",
          annualFamilyIncome: 300000,
          user: { name: "RAMESH KUMAR MEENA" },
        },
        extractedEvidences: [
          {
            id: "ev_income_001",
            documentId: "doc_income_mismatch",
            documentType: "INCOME_CERTIFICATE",
            fieldKey: "annualFamilyIncome",
            rawValue: "Rs. 4,50,000/-",
            normalizedValue: "450000",
            confidenceScore: 0.95,
            pageNumber: 1,
            sourceSnippet: "Total Gross Family Income: Rs. 4,50,000/-",
            documentStatus: "COMPLETED",
          },
        ],
      });

      expect(results.length).toBe(1);
      const finding = results[0];
      expect(finding.isConsistent).toBe(false);
      expect(finding.status).toBe("REVIEW_REQUIRED");
      expect(finding.fieldKey).toBe("annualFamilyIncome");
      expect(finding.formValue).toBe("₹3,00,000");
      expect(finding.extractedValue).toBe("₹4,50,000");
      expect(finding.difference).toBe("₹1,50,000");
      expect(finding.evidenceFieldId).toBe("ev_income_001");
      expect(finding.mismatchExplanation).toContain("Difference: ₹1,50,000");
    });

    it("should pass matching information without false mismatch when values match", () => {
      const results = runConsistencyChecks({
        formData: {
          fullName: "RAMESH KUMAR MEENA",
          annualFamilyIncome: 300000,
          casteCategory: "ST",
        },
        applicantProfile: {
          category: "ST",
          annualFamilyIncome: 300000,
          user: { name: "RAMESH KUMAR MEENA" },
        },
        extractedEvidences: [
          {
            id: "ev_income_002",
            documentId: "doc_income_normal",
            documentType: "INCOME_CERTIFICATE",
            fieldKey: "annualFamilyIncome",
            rawValue: "Rs. 3,00,000/-",
            normalizedValue: "300000",
            confidenceScore: 0.95,
            pageNumber: 1,
            sourceSnippet: "Total Gross Family Income: Rs. 3,00,000/-",
            documentStatus: "COMPLETED",
          },
        ],
      });

      expect(results.length).toBe(1);
      expect(results[0].isConsistent).toBe(true);
      expect(results[0].status).toBe("CONSISTENT");
      expect(results[0].difference).toBeUndefined();
    });

    it("should detect category mismatch when Document specifies OBC instead of ST", () => {
      const results = runConsistencyChecks({
        formData: {
          fullName: "RAMESH KUMAR MEENA",
          casteCategory: "ST",
        },
        applicantProfile: {
          category: "ST",
          user: { name: "RAMESH KUMAR MEENA" },
        },
        extractedEvidences: [
          {
            id: "ev_caste_001",
            documentId: "doc_caste_mismatch",
            documentType: "CASTE_CERTIFICATE",
            fieldKey: "casteCategory",
            rawValue: "OBC (OTHER BACKWARD CLASS)",
            normalizedValue: "OBC",
            confidenceScore: 0.94,
            pageNumber: 1,
            sourceSnippet: "Social Category: OBC (OTHER BACKWARD CLASS)",
            documentStatus: "COMPLETED",
          },
        ],
      });

      expect(results.length).toBe(1);
      expect(results[0].isConsistent).toBe(false);
      expect(results[0].mismatchExplanation).toContain("could not be confirmed against extracted");
    });
  });

  describe("PART 3 — Blurred Document Processing & OCR", () => {
    it("should load the physically blurred income certificate PDF", () => {
      const blurPdfPath = path.resolve(
        process.cwd(),
        "tests/fixtures/documents/demo-scenarios/blur/demo-income-certificate-blurred.pdf"
      );
      expect(fs.existsSync(blurPdfPath)).toBe(true);
      const buffer = fs.readFileSync(blurPdfPath);
      expect(buffer.length).toBeGreaterThan(20000); // Image-based raster PDF is substantially larger than vector
    });

    it("should flag blur / low clarity warning in readiness evaluation", () => {
      const audit = evaluateDocumentAiAudit(
        {
          id: "req_income",
          documentType: DocumentType.INCOME_CERTIFICATE,
          label: "Annual Income Certificate",
          level: "MANDATORY",
          allowedMimeTypes: ["application/pdf"],
          maxFileSizeMb: 5,
        },
        {
          id: "doc_blur_income",
          documentType: DocumentType.INCOME_CERTIFICATE,
          originalFilename: "demo-income-certificate-blurred.pdf",
          mimeType: "application/pdf",
          fileSizeBytes: 66383,
          processingStatus: "COMPLETED",
          classifiedAs: DocumentType.INCOME_CERTIFICATE,
          classificationConfidence: 0.52,
          extractedFields: [],
        },
        {
          fullName: "RAMESH KUMAR MEENA",
          annualFamilyIncome: 300000,
        }
      );

      expect(audit.qualityWarning?.isBlurryOrLowQuality).toBe(true);
      expect(audit.overallVerdict).toBe("QUALITY_WARNING");
      expect(audit.summaryTitle).toContain("Low Clarity / Blur Warning");
    });
  });

  describe("PART 6 & 7 — Applicant and Officer UI Integrity", () => {
    it("should format non-accusatory guidance for applicant when info mismatch occurs", () => {
      const audit = evaluateDocumentAiAudit(
        {
          id: "req_income",
          documentType: DocumentType.INCOME_CERTIFICATE,
          label: "Annual Income Certificate",
          level: "MANDATORY",
          allowedMimeTypes: ["application/pdf"],
          maxFileSizeMb: 5,
        },
        {
          id: "doc_income_mismatch",
          documentType: DocumentType.INCOME_CERTIFICATE,
          originalFilename: "demo-income-certificate-mismatch.pdf",
          mimeType: "application/pdf",
          fileSizeBytes: 6732,
          processingStatus: "COMPLETED",
          classifiedAs: DocumentType.INCOME_CERTIFICATE,
          classificationConfidence: 0.95,
          extractedFields: [
            {
              fieldKey: "annualFamilyIncome",
              rawValue: "Rs. 4,50,000/-",
              normalizedValue: "450000",
            },
          ],
        },
        {
          fullName: "RAMESH KUMAR MEENA",
          annualFamilyIncome: 300000,
        }
      );

      expect(audit.infoMismatches.length).toBe(1);
      expect(audit.overallVerdict).toBe("INFO_MISMATCH");
      expect(audit.actionableGuidance).toBe(
        "Please verify your document or update your application form details accordingly."
      );
    });

    it("should distinguish document type mismatch from information mismatch", () => {
      const auditTypeMismatch = evaluateDocumentAiAudit(
        {
          id: "req_caste",
          documentType: DocumentType.CASTE_CERTIFICATE,
          label: "Scheduled Tribe Certificate",
          level: "MANDATORY",
          allowedMimeTypes: ["application/pdf"],
          maxFileSizeMb: 5,
        },
        {
          id: "doc_passport_in_caste",
          documentType: DocumentType.CASTE_CERTIFICATE,
          originalFilename: "demo-passport.pdf",
          mimeType: "application/pdf",
          fileSizeBytes: 6559,
          processingStatus: "COMPLETED",
          classifiedAs: DocumentType.PASSPORT,
          classificationConfidence: 0.92,
          extractedFields: [],
        },
        {
          fullName: "RAMESH KUMAR MEENA",
        }
      );

      expect(auditTypeMismatch.mismatchDetected).toBe(true);
      expect(auditTypeMismatch.overallVerdict).toBe("MISMATCH_DETECTED");
      expect(auditTypeMismatch.mismatchDetails?.detectedType).toBe(DocumentType.PASSPORT);
      expect(auditTypeMismatch.mismatchDetails?.expectedType).toBe(DocumentType.CASTE_CERTIFICATE);
    });
  });
});
