import { createWorker, Worker } from "tesseract.js";
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

  async acquire(langs = "eng+hin+tam+tel+ben+mar+ori"): Promise<Worker> {
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
          const newWorker = await createWorker("eng+hin+tam+tel+ben+mar+ori");
          this.activeWorkers++;
          next(newWorker);
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
      try {
        await worker.terminate();
      } catch {
        // ignore
      }
      this.activeWorkers = Math.max(0, this.activeWorkers - 1);
    }
  }
}

export class TesseractOCRProvider implements IOCRProvider {
  readonly providerName = "tesseract-js";
  readonly providerVersion = "5.1.1";

  private timeoutMs: number;
  private pool: TesseractWorkerPool;

  constructor(
    timeoutMs = parseInt(process.env.DOCUMENT_PROCESSING_TIMEOUT_MS || "90000", 10),
    pool = TesseractWorkerPool.getInstance()
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
    const langs = hints?.expectedLanguages?.join("+") || "eng+hin+tam+tel+ben+mar+ori";
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
        const pdfData = await pdfParse(new Uint8Array(fileBuffer));
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
                bbox: { x: 0, y: 0, width: 0, height: 0 },
                pageNumber: idx + 1,
              })),
              regions: [
                {
                  regionText: pageText,
                  confidence: 0.95,
                  bbox: { x: 0, y: 0, width: 1, height: 1 },
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
        console.error("CATCH IN PROVIDER:", err);
        // pdf-parse failed, fall through to fallback
      }

      // If digital text was sparse or pdf-parse failed, this is a scanned PDF.
      // In prototype without heavy native canvas bindings, extract what is available or perform fallback
      return {
        pages: [
          {
            pageNumber: 1,
            rawText: "",
            confidence: 0.3, // Low confidence to trigger review
            wordCount: 0,
            words: [],
            regions: [],
          },
        ],
        fullText: "",
        averageConfidence: 0.3,
        detectedLanguages: [],
        processingTimeMs: Date.now() - startTime,
        providerName: this.providerName,
        providerVersion: this.providerVersion,
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
