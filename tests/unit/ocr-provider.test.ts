// @vitest-environment node
import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { TesseractOCRProvider } from "@/server/documents/tesseract-ocr.provider";

describe("Phase 2F — TesseractOCRProvider Integration Tests", () => {
  const isSkipped = process.env.CI_SKIP_OCR_INTEGRATION === "true";

  it.skipIf(isSkipped)(
    "extracts text from synthetic valid PDF",
    async () => {
      const provider = new TesseractOCRProvider();
      const pdfPath = path.join(
        process.cwd(),
        "tests",
        "fixtures",
        "documents",
        "synthetic-valid.pdf"
      );
      const pdfBuffer = fs.readFileSync(pdfPath);

      const result = await provider.extractText(pdfBuffer, "application/pdf");

      expect(result).toBeDefined();
      expect(result.providerName).toBe("pdf-parse");
      expect(result.averageConfidence).toBeGreaterThan(0.7);
      expect(result.pages.length).toBeGreaterThan(0);
      expect(result.fullText).toContain("TribalScholar AI");
    },
    30000
  );
});
