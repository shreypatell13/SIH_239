// @vitest-environment node
import { describe, it, expect, vi } from "vitest";
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

describe("OCR provider routing", () => {
  const page = (pageNumber: number, rawText: string) => ({
    pageNumber,
    rawText,
    confidence: 0.9,
    wordCount: rawText.split(/\s+/).length,
    words: [],
    regions: [],
  });
  const provider = (parser: any, rasterizer: any) =>
    new TesseractOCRProvider(1000, undefined, parser, rasterizer, 3);

  it("routes image files through the image OCR path", async () => {
    const instance = provider(vi.fn(), vi.fn());
    const imageOcr = vi
      .spyOn(instance, "extractFromImage")
      .mockResolvedValue(page(1, "image text"));
    const result = await instance.extractText(Buffer.from("image"), "image/jpeg");
    expect(imageOcr).toHaveBeenCalledOnce();
    expect(result.fullText).toBe("image text");
  });

  it("uses digital PDF text without invoking the rasterizer", async () => {
    const rasterizer = vi.fn();
    const instance = provider(
      vi.fn().mockResolvedValue({ text: "TribalScholar AI digital text", numpages: 1 }),
      rasterizer
    );
    const result = await instance.extractText(Buffer.from("pdf"), "application/pdf");
    expect(result.fullText).toContain("TribalScholar AI");
    expect(result.pages[0].regions[0].bbox).toBeNull();
    expect(rasterizer).not.toHaveBeenCalled();
  });

  it("rasterizes each scanned PDF page and preserves page numbers", async () => {
    const rasterizer = vi.fn().mockResolvedValue([Buffer.from("p1"), Buffer.from("p2")]);
    const instance = provider(vi.fn().mockResolvedValue({ text: "", numpages: 2 }), rasterizer);
    vi.spyOn(instance, "extractFromImage").mockImplementation(async (_buffer, pageNumber = 1) =>
      page(pageNumber, `scanned page ${pageNumber}`)
    );
    const result = await instance.extractText(Buffer.from("scanned-pdf"), "application/pdf");
    expect(rasterizer).toHaveBeenCalledWith(expect.any(Buffer), 2);
    expect(result.pages.map((item) => item.pageNumber)).toEqual([1, 2]);
    expect(result.fullText).toContain("scanned page 2");
  });

  it("propagates scanned PDF OCR failures for the job failure handler", async () => {
    const instance = provider(
      vi.fn().mockResolvedValue({ text: "", numpages: 1 }),
      vi.fn().mockRejectedValue(new Error("renderer unavailable"))
    );
    await expect(
      instance.extractText(Buffer.from("scanned-pdf"), "application/pdf")
    ).rejects.toThrow(/renderer unavailable/);
  });
});
