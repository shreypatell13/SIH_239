import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getDemoOcrDelayMs, DEFAULT_DEMO_OCR_DELAY_MS } from "@/server/documents/demo-delay.config";
import { ProcessingStatus, DocumentType } from "@prisma/client";
import { IOCRProvider, OCRResult } from "@/server/documents/ocr-provider.interface";
import { IStorageAdapter } from "@/server/storage/storage.interface";

// Top-level module mocks
const mockJobsMap = new Map<string, any>();
const mockDocsMap = new Map<string, any>();

vi.mock("@/server/repositories/document-processing-job.repository", () => ({
  documentProcessingJobRepository: {
    findById: vi.fn(async (id: string) => mockJobsMap.get(id) || null),
    updateJob: vi.fn(async (id: string, data: any) => {
      const existing = mockJobsMap.get(id) || {};
      const updated = { ...existing, ...data };
      mockJobsMap.set(id, updated);
      return updated;
    }),
    createOrResetJob: vi.fn(async (docId: string) => {
      const job = { id: `job_${docId}`, documentId: docId, status: ProcessingStatus.PENDING };
      mockJobsMap.set(job.id, job);
      return job;
    }),
  },
}));

vi.mock("@/server/repositories/document.repository", () => ({
  documentRepository: {
    findById: vi.fn(async (id: string) => mockDocsMap.get(id) || null),
    updateProcessingResult: vi.fn(async (id: string, data: any) => {
      const existing = mockDocsMap.get(id) || {};
      const updated = { ...existing, ...data };
      mockDocsMap.set(id, updated);
      return updated;
    }),
    saveExtractedFieldsBatch: vi.fn(async () => {}),
  },
}));

vi.mock("@/server/repositories/audit.repository", () => ({
  auditRepository: {
    create: vi.fn(async () => ({})),
  },
}));

import { DocumentProcessingService } from "@/server/services/document-processing.service";
import { documentRepository } from "@/server/repositories/document.repository";
import { documentProcessingJobRepository } from "@/server/repositories/document-processing-job.repository";

describe("Demo OCR Processing Delay & Real Intelligence Pipeline Tests", () => {
  const originalEnv = process.env.DEMO_OCR_DELAY_MS;

  beforeEach(() => {
    mockJobsMap.clear();
    mockDocsMap.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.DEMO_OCR_DELAY_MS = originalEnv;
    } else {
      delete process.env.DEMO_OCR_DELAY_MS;
    }
  });

  describe("1. Configuration: DEMO_OCR_DELAY_MS", () => {
    it("returns default 2500ms when environment variable is not set", () => {
      delete process.env.DEMO_OCR_DELAY_MS;
      expect(getDemoOcrDelayMs()).toBe(DEFAULT_DEMO_OCR_DELAY_MS);
      expect(getDemoOcrDelayMs()).toBe(2500);
    });

    it("reads custom positive integer from DEMO_OCR_DELAY_MS", () => {
      process.env.DEMO_OCR_DELAY_MS = "40000";
      expect(getDemoOcrDelayMs()).toBe(40000);

      process.env.DEMO_OCR_DELAY_MS = "100";
      expect(getDemoOcrDelayMs()).toBe(100);
    });

    it("falls back safely to default on invalid or non-numeric env values", () => {
      process.env.DEMO_OCR_DELAY_MS = "invalid-ms";
      expect(getDemoOcrDelayMs()).toBe(DEFAULT_DEMO_OCR_DELAY_MS);

      process.env.DEMO_OCR_DELAY_MS = "";
      expect(getDemoOcrDelayMs()).toBe(DEFAULT_DEMO_OCR_DELAY_MS);
    });
  });

  describe("2. Real Processing Pipeline with Demo Delay Hold", () => {
    it("executes real OCR, persists fields, respects demo delay, and transitions to COMPLETED", async () => {
      process.env.DEMO_OCR_DELAY_MS = "150";

      const mockStorage: IStorageAdapter = {
        upload: vi.fn(),
        download: vi.fn().mockResolvedValue(Buffer.from("%PDF-1.4 Mock valid PDF document binary")),
        delete: vi.fn(),
        exists: vi.fn().mockResolvedValue(true),
      };

      const mockOcrResult: OCRResult = {
        fullText: "GOVERNMENT OF RAJASTHAN CASTE CERTIFICATE This is to certify that RAMESH KUMAR MEENA belongs to MEENA tribe under Category Scheduled Tribe (ST) Certificate No: ST/2024/09876 Issue Date: 12/04/2024",
        averageConfidence: 0.96,
        pages: [
          {
            pageNumber: 1,
            text: "CASTE CERTIFICATE",
            confidence: 0.96,
            blocks: [],
          },
        ],
        providerName: "tesseract-ocr",
        extractedAt: new Date(),
      };

      const mockOcrProvider: IOCRProvider = {
        name: "mock-ocr",
        extractText: vi.fn().mockResolvedValue(mockOcrResult),
      };

      const docObj = {
        id: "doc_test_001",
        caseDossierId: "case_test_001",
        documentType: DocumentType.CASTE_CERTIFICATE,
        originalFilename: "st_caste_cert.pdf",
        storagePath: "case_test_001/CASTE_CERTIFICATE/cert.pdf",
        mimeType: "application/pdf",
        fileSizeBytes: 1024,
        version: 1,
        isLatestVersion: true,
        processingStatus: ProcessingStatus.PENDING,
        classifiedAs: null,
        classificationConfidence: null,
        pageCount: null,
        deficiencyId: null,
        uploadedById: "user_001",
      };

      const jobObj = {
        id: "job_test_001",
        documentId: "doc_test_001",
        status: ProcessingStatus.PENDING,
        attemptCount: 1,
        maxAttempts: 3,
        document: docObj,
      };

      mockJobsMap.set(jobObj.id, jobObj);
      mockDocsMap.set(docObj.id, docObj);

      const service = new DocumentProcessingService(mockStorage, mockOcrProvider);

      const t0 = Date.now();
      const result = await service.processJob("job_test_001");
      const elapsed = Date.now() - t0;

      // 1. Assert real OCR provider was invoked
      expect(mockOcrProvider.extractText).toHaveBeenCalled();

      // 2. Assert fields were extracted and saved
      expect(documentRepository.saveExtractedFieldsBatch).toHaveBeenCalled();

      // 3. Assert demo delay was respected (elapsed >= 140ms)
      expect(elapsed).toBeGreaterThanOrEqual(140);

      // 4. Assert final job and document status is COMPLETED
      expect(result.status).toBe(ProcessingStatus.COMPLETED);
      expect(documentRepository.updateProcessingResult).toHaveBeenCalledWith("doc_test_001", expect.objectContaining({
        processingStatus: ProcessingStatus.COMPLETED,
      }));
    });

    it("rejects security/magic-byte failure immediately without demo delay hold", async () => {
      process.env.DEMO_OCR_DELAY_MS = "5000"; // Long demo delay

      const mockStorage: IStorageAdapter = {
        upload: vi.fn(),
        download: vi.fn().mockResolvedValue(Buffer.from([0x00, 0x01, 0x02, 0x03])), // Corrupt/invalid bytes
        delete: vi.fn(),
        exists: vi.fn().mockResolvedValue(true),
      };

      const mockOcrProvider: IOCRProvider = {
        name: "mock-ocr",
        extractText: vi.fn(),
      };

      const docFail = {
        id: "doc_test_fail",
        caseDossierId: "case_test_fail",
        documentType: DocumentType.CASTE_CERTIFICATE,
        originalFilename: "corrupt.pdf",
        storagePath: "case_test_fail/CASTE_CERTIFICATE/corrupt.pdf",
        mimeType: "application/pdf",
        fileSizeBytes: 4,
        version: 1,
        isLatestVersion: true,
        processingStatus: ProcessingStatus.PENDING,
      };

      const jobFail = {
        id: "job_test_fail",
        documentId: "doc_test_fail",
        status: ProcessingStatus.PENDING,
        attemptCount: 1,
        maxAttempts: 3,
        document: docFail,
      };

      mockJobsMap.set(jobFail.id, jobFail);
      mockDocsMap.set(docFail.id, docFail);

      const service = new DocumentProcessingService(mockStorage, mockOcrProvider);

      const t0 = Date.now();
      const result = await service.processJob("job_test_fail");
      const elapsed = Date.now() - t0;

      // Security failure MUST return fast without 5000ms delay
      expect(elapsed).toBeLessThan(1000);

      // OCR must NEVER be called on security failure
      expect(mockOcrProvider.extractText).not.toHaveBeenCalled();

      // Status MUST be FAILED
      expect(result.status).toBe(ProcessingStatus.FAILED);
      expect(documentRepository.updateProcessingResult).toHaveBeenCalledWith("doc_test_fail", expect.objectContaining({
        processingStatus: ProcessingStatus.FAILED,
      }));
    });

    it("processes multiple documents independently with per-document job isolation", async () => {
      process.env.DEMO_OCR_DELAY_MS = "100";

      const mockStorage: IStorageAdapter = {
        upload: vi.fn(),
        download: vi.fn().mockImplementation(async (path: string) => {
          if (path.includes("doc_b")) return Buffer.from("%PDF-1.4 Mock INCOME document");
          return Buffer.from("%PDF-1.4 Mock CASTE document");
        }),
        delete: vi.fn(),
        exists: vi.fn().mockResolvedValue(true),
      };

      const mockOcrResultA: OCRResult = {
        fullText: "GOVERNMENT OF RAJASTHAN CASTE CERTIFICATE This is to certify that RAMESH KUMAR MEENA belongs to MEENA tribe under Category Scheduled Tribe (ST) Certificate No: ST/2024/09876 Issue Date: 12/04/2024 Tehsildar",
        averageConfidence: 0.96,
        pages: [{ pageNumber: 1, text: "CASTE CERTIFICATE", confidence: 0.96, blocks: [] }],
        providerName: "tesseract-ocr",
        extractedAt: new Date(),
      };

      const mockOcrResultB: OCRResult = {
        fullText: "GOVERNMENT OF RAJASTHAN OFFICE OF THE TEHSILDAR INCOME CERTIFICATE Annual Family Income: INR 450,000 per annum Financial Year 2023-2024 Certificate No: INC/2024/54321 Date: 15/04/2024 Tehsildar",
        averageConfidence: 0.94,
        pages: [{ pageNumber: 1, text: "INCOME CERTIFICATE", confidence: 0.94, blocks: [] }],
        providerName: "tesseract-ocr",
        extractedAt: new Date(),
      };

      const mockOcrProvider: IOCRProvider = {
        name: "mock-ocr",
        extractText: vi.fn().mockImplementation(async (buf: Buffer) => {
          const str = buf.toString();
          if (str.includes("INCOME")) return mockOcrResultB;
          return mockOcrResultA;
        }),
      };

      const docA = {
        id: "doc_A",
        caseDossierId: "case_iso_001",
        documentType: DocumentType.CASTE_CERTIFICATE,
        storagePath: "case_iso_001/doc_a.pdf",
        mimeType: "application/pdf",
      };

      const jobA = {
        id: "job_doc_A",
        documentId: "doc_A",
        status: ProcessingStatus.PENDING,
        attemptCount: 1,
        maxAttempts: 3,
        document: docA,
      };

      const docB = {
        id: "doc_B",
        caseDossierId: "case_iso_001",
        documentType: DocumentType.INCOME_CERTIFICATE,
        storagePath: "case_iso_001/doc_b.pdf",
        mimeType: "application/pdf",
      };

      const jobB = {
        id: "job_doc_B",
        documentId: "doc_B",
        status: ProcessingStatus.PENDING,
        attemptCount: 1,
        maxAttempts: 3,
        document: docB,
      };

      mockJobsMap.set(jobA.id, jobA);
      mockDocsMap.set(docA.id, docA);
      mockJobsMap.set(jobB.id, jobB);
      mockDocsMap.set(docB.id, docB);

      const service = new DocumentProcessingService(mockStorage, mockOcrProvider);

      const [resA, resB] = await Promise.all([
        service.processJob("job_doc_A"),
        service.processJob("job_doc_B"),
      ]);

      expect(resA.status).toBe(ProcessingStatus.COMPLETED);
      expect(resB.status).toBe(ProcessingStatus.COMPLETED);
      expect(resA.id).toBe("job_doc_A");
      expect(resB.id).toBe("job_doc_B");
    });
  });
});
