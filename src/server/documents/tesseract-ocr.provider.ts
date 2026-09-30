import { createWorker, Worker } from "tesseract.js";
import { spawn } from "child_process";
import fs from "fs/promises";
import os from "os";
import path from "path";
// eslint-disable-next-line
const pdfParse = require("pdf-parse/lib/pdf-parse.js");
import {
  IOCRProvider,
  NormalizedBBox,
  OCRRegion,
  OCRResult,
  OCRWord,
  PageOCRResult,
} from "./ocr-provider.interface";

export class TesseractWorkerPool {
  private static instance: TesseractWorkerPool;
  private maxWorkers: number;
  private activeWorkers = 0;
  private idleWorkers: Worker[] = [];
  private queue: Array<(worker: Worker) => void> = [];

  constructor(maxWorkers = parseInt(process.env.TESSERACT_WORKER_POOL_SIZE || "2", 10)) {
    this.maxWorkers = maxWorkers;
  }

  static getInstance(): TesseractWorkerPool {
    if (!TesseractWorkerPool.instance) {
      TesseractWorkerPool.instance = new TesseractWorkerPool();
    }
    return TesseractWorkerPool.instance;
  }

  async acquire(langs = "eng"): Promise<Worker> {
    if (this.idleWorkers.length > 0) {
      return this.idleWorkers.pop()!;
    }

    if (this.activeWorkers < this.maxWorkers) {
      this.activeWorkers++;
      try {
        const worker = await createWorker(langs);
        return worker;
      } catch (err) {
        this.activeWorkers--;
        throw err;
      }
    }

    return new Promise((resolve) => {
      this.queue.push(resolve);
    });
  }

  async release(worker: Worker, terminate = false): Promise<void> {
    if (terminate) {
      try {
        await worker.terminate();
      } catch {
        // ignore termination error
      }
      this.activeWorkers = Math.max(0, this.activeWorkers - 1);
      if (this.queue.length > 0) {
        const next = this.queue.shift();
        if (next) {
          try {
            const newWorker = await createWorker("eng");
            this.activeWorkers++;
            next(newWorker);
          } catch {
            // ignore
          }
        }
      }
    } else {
      if (this.queue.length > 0) {
        const next = this.queue.shift();
        if (next) {
          next(worker);
          return;
        }
      }
      // Keep worker alive in idle pool for instant reuse
      this.idleWorkers.push(worker);
    }
  }
}

type PdfParser = (buffer: Buffer) => Promise<{ text?: string; numpages?: number }>;
type PdfPageRasterizer = (buffer: Buffer, pageCount: number) => Promise<Buffer[]>;

async function rasterizePdfPages(buffer: Buffer, pageCount: number): Promise<Buffer[]> {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "tribalscholar-pdf-"));
  const inputPath = path.join(tempDir, "source.pdf");
  const outputPrefix = path.join(tempDir, "page");
  const executable = process.env.PDF_TO_PPM_PATH || "pdftoppm";
  try {
    await fs.writeFile(inputPath, buffer, { flag: "wx" });
    await new Promise<void>((resolve, reject) => {
      const child = spawn(
        executable,
        ["-f", "1", "-l", String(pageCount), "-png", "-scale-to", "2000", inputPath, outputPrefix],
        { windowsHide: true }
      );
      const timer = setTimeout(
        () => child.kill(),
        Number(process.env.DOCUMENT_PROCESSING_TIMEOUT_MS || 90000)
      );
      child.once("error", (error) => {
        clearTimeout(timer);
        reject(error);
      });
      child.once("close", (code) => {
        clearTimeout(timer);
        if (code === 0) resolve();
        else reject(new Error(`PDF rasterizer exited with status ${code}.`));
      });
    });
    const names = (await fs.readdir(tempDir))
      .filter((name) => /^page-\d+\.png$/i.test(name))
      .sort(
        (a, b) => Number(a.match(/-(\d+)\.png$/i)?.[1]) - Number(b.match(/-(\d+)\.png$/i)?.[1])
      );
    if (names.length === 0) throw new Error("PDF rasterizer returned no page images.");
    return await Promise.all(
      names.slice(0, pageCount).map((name) => fs.readFile(path.join(tempDir, name)))
    );
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

function extractEmbeddedImagesFromPdf(buffer: Buffer): Buffer[] {
  const images: Buffer[] = [];
  const jpegStart = Buffer.from([0xff, 0xd8, 0xff]);
  const jpegEnd = Buffer.from([0xff, 0xd9]);

  let offset = 0;
  while (offset < buffer.length) {
    const startIdx = buffer.indexOf(jpegStart, offset);
    if (startIdx === -1) break;
    const endIdx = buffer.indexOf(jpegEnd, startIdx + 3);
    if (endIdx === -1) break;

    const imgBuf = buffer.subarray(startIdx, endIdx + 2);
    if (imgBuf.length > 500) {
      images.push(imgBuf);
    }
    offset = endIdx + 2;
  }
  return images;
}

export class TesseractOCRProvider implements IOCRProvider {
  readonly providerName = "tesseract-js";
  readonly providerVersion = "5.1.1";

  private timeoutMs: number;
  private pool: TesseractWorkerPool;

  constructor(
    timeoutMs = parseInt(process.env.DOCUMENT_PROCESSING_TIMEOUT_MS || "25000", 10),
    pool = TesseractWorkerPool.getInstance(),
    private pdfParser: PdfParser = (buffer) => pdfParse(new Uint8Array(buffer)),
    private pdfRasterizer: PdfPageRasterizer = rasterizePdfPages,
    private maxPdfPages = 20
  ) {
    this.timeoutMs = timeoutMs;
    this.pool = pool;
  }

  /**
   * Processes a pre-rendered image buffer (PNG / JPEG) using Tesseract.js.
   */
  async extractFromImage(
    imageBuffer: Buffer,
    pageNumber = 1,
    hints?: { expectedLanguages?: string[]; deskew?: boolean }
  ): Promise<PageOCRResult> {
    const langs = hints?.expectedLanguages?.join("+") || "eng";
    const worker = await this.pool.acquire(langs);
    let workerTerminated = false;

    try {
      const recognitionPromise = (async () => {
        const ret = await worker.recognize(imageBuffer);
        return ret;
      })();

      let timer: NodeJS.Timeout | null = null;
      const timeoutPromise = new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          reject(new Error(`PROCESSING_TIMEOUT: OCR exceeded ${this.timeoutMs}ms`));
        }, this.timeoutMs);
      });

      const res = await Promise.race([recognitionPromise, timeoutPromise]).finally(() => {
        if (timer) clearTimeout(timer);
      });

      const ocrWords: OCRWord[] = (res.data.words || []).map((w) => {
        const bbox: NormalizedBBox = {
          x: w.bbox ? w.bbox.x0 / 1000 : 0,
          y: w.bbox ? w.bbox.y0 / 1000 : 0,
          width: w.bbox ? (w.bbox.x1 - w.bbox.x0) / 1000 : 0,
          height: w.bbox ? (w.bbox.y1 - w.bbox.y0) / 1000 : 0,
        };

        return {
          text: w.text || "",
          confidence: (w.confidence || 0) / 100, // Normalize 0..100 -> 0..1
          bbox,
          pageNumber,
        };
      });

      // Construct regional blocks from lines or paragraphs
      const regions: OCRRegion[] = (res.data.lines || []).map((line) => {
        const lineBBox: NormalizedBBox = {
          x: line.bbox ? line.bbox.x0 / 1000 : 0,
          y: line.bbox ? line.bbox.y0 / 1000 : 0,
          width: line.bbox ? (line.bbox.x1 - line.bbox.x0) / 1000 : 0,
          height: line.bbox ? (line.bbox.y1 - line.bbox.y0) / 1000 : 0,
        };

        return {
          regionText: line.text || "",
          confidence: (line.confidence || 0) / 100,
          bbox: lineBBox,
          pageNumber,
          words: ocrWords.filter((w) => line.text.includes(w.text)),
        };
      });

      return {
        pageNumber,
        rawText: res.data.text || "",
        confidence: (res.data.confidence || 0) / 100, // Normalize 0..1
        wordCount: ocrWords.length,
        words: ocrWords,
        regions,
      };
    } catch (err) {
      workerTerminated = true;
      await this.pool.release(worker, true);
      throw err;
    } finally {
      if (!workerTerminated) {
        await this.pool.release(worker, false);
      }
    }
  }

  /**
   * Main entry point for PDF or image buffers.
   */
  async extractText(
    fileBuffer: Buffer,
    mimeType: string,
    hints?: { expectedLanguages?: string[]; deskew?: boolean }
  ): Promise<OCRResult> {
    const startTime = Date.now();
    const normalizedMime = mimeType.toLowerCase();

    if (normalizedMime === "application/pdf") {
      // Step 1: Attempt digital PDF text extraction via pdf-parse
      try {
        const pdfData = await this.pdfParser(fileBuffer);
        const fullText = (pdfData?.text || "").trim();

        // Check if digital text is present
        if (fullText.length >= 10) {
          // Digital PDF path
          const pageChunks = fullText
            .split(/\f|\n\s*\n\s*\n/)
            .filter((c: string) => c.trim().length > 0);
          const effectivePages = pageChunks.length > 0 ? pageChunks : [fullText];

          const pages: PageOCRResult[] = effectivePages.map((pageText: string, idx: number) => {
            const words = pageText.split(/\s+/).filter(Boolean);
            return {
              pageNumber: idx + 1,
              rawText: pageText,
              confidence: 0.95, // Digital text extraction high baseline confidence
              wordCount: words.length,
              words: words.map((w: string) => ({
                text: w,
                confidence: 0.95,
                bbox: null,
                pageNumber: idx + 1,
              })),
              regions: [
                {
                  regionText: pageText,
                  confidence: 0.95,
                  bbox: null,
                  pageNumber: idx + 1,
                  words: [],
                },
              ],
            };
          });

          return {
            pages,
            fullText,
            averageConfidence: 0.95,
            detectedLanguages: ["eng"],
            processingTimeMs: Date.now() - startTime,
            providerName: "pdf-parse",
            providerVersion: "1.1.1",
          };
        }
      } catch (err) {
        console.error("PDF parse digital text extraction fallback:", err);
      }

      // Step 2: Scanned/Raster PDF - Try native image extraction first, then pdftoppm
      let images: Buffer[] = [];
      try {
        images = extractEmbeddedImagesFromPdf(fileBuffer);
      } catch {
        images = [];
      }

      if (images.length === 0) {
        try {
          const parsed = await this.pdfParser(fileBuffer).catch(() => ({ numpages: 1 }));
          const pageLimit = Math.max(1, Math.min(parsed.numpages || 1, this.maxPdfPages));
          images = await this.pdfRasterizer(fileBuffer, pageLimit);
        } catch {
          images = [];
        }
      }

      if (images.length > 0) {
        try {
          const pages: PageOCRResult[] = [];
          for (let index = 0; index < images.length; index++) {
            const pageRes = await this.extractFromImage(images[index], index + 1, hints);
            pages.push(pageRes);
          }
          if (pages.length > 0) {
            const fullText = pages.map((page) => page.rawText).join("\n\n");
            const avgConf =
              pages.reduce((sum, page) => sum + page.confidence, 0) / pages.length;
            return {
              pages,
              fullText,
              averageConfidence: avgConf,
              detectedLanguages: ["eng"],
              processingTimeMs: Date.now() - startTime,
              providerName: this.providerName,
              providerVersion: this.providerVersion,
            };
          }
        } catch (ocrErr) {
          console.error("OCR extraction on raster pages warning:", ocrErr);
        }
      }

      // Fallback for degraded/unparseable scanned PDF: Return low-confidence OCR result
      return {
        pages: [
          {
            pageNumber: 1,
            rawText: "DEGRADED_SCAN_UNREADABLE",
            confidence: 0.42,
            wordCount: 1,
            words: [{ text: "DEGRADED_SCAN_UNREADABLE", confidence: 0.42, bbox: null, pageNumber: 1 }],
            regions: [],
          },
        ],
        fullText: "DEGRADED_SCAN_UNREADABLE",
        averageConfidence: 0.42,
        detectedLanguages: ["eng"],
        processingTimeMs: Date.now() - startTime,
        providerName: "tesseract-js",
        providerVersion: "5.1.1",
      };
    }

    // Image path (JPEG / PNG)
    const pageRes = await this.extractFromImage(fileBuffer, 1, hints);
    return {
      pages: [pageRes],
      fullText: pageRes.rawText,
      averageConfidence: pageRes.confidence,
      detectedLanguages: pageRes.detectedLanguage ? [pageRes.detectedLanguage] : ["eng"],
      processingTimeMs: Date.now() - startTime,
      providerName: this.providerName,
      providerVersion: this.providerVersion,
    };
  }
}
