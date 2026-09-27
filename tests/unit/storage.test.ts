import { describe, it, expect, afterAll } from "vitest";
import { LocalStorageAdapter } from "@/server/storage/local-storage.adapter";
import fs from "fs/promises";
import path from "path";

describe("Local Storage Adapter Tests", () => {
  const testDir = "./uploads/test_storage";
  const storage = new LocalStorageAdapter(testDir);

  afterAll(async () => {
    try {
      await fs.rm(path.resolve(process.cwd(), testDir), { recursive: true, force: true });
    } catch {
      // cleanup ignored
    }
  });

  it("should upload, check existence, download, and delete a file buffer", async () => {
    const testKey = "test_caste_cert.pdf";
    const testContent = Buffer.from("%PDF-1.4 Mock Tribal Certificate for Testing");

    const meta = await storage.upload(testKey, testContent, {
      originalName: "caste_cert.pdf",
      mimeType: "application/pdf",
    });

    expect(meta.key).toBe(testKey);
    expect(meta.sizeBytes).toBe(testContent.length);

    const exists = await storage.exists(testKey);
    expect(exists).toBe(true);

    const downloaded = await storage.download(testKey);
    expect(downloaded.toString()).toBe(testContent.toString());

    const deleted = await storage.delete(testKey);
    expect(deleted).toBe(true);

    const existsAfterDelete = await storage.exists(testKey);
    expect(existsAfterDelete).toBe(false);
  });
});
