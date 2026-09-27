import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { IStorageAdapter, StoredFileMeta } from "./storage.interface";

export class LocalStorageAdapter implements IStorageAdapter {
  private baseDir: string;

  constructor(baseDir: string = process.env.STORAGE_LOCAL_ROOT || "./uploads/documents") {
    this.baseDir = path.resolve(process.cwd(), baseDir);
  }

  private async ensureBaseDir(): Promise<void> {
    try {
      await fs.mkdir(this.baseDir, { recursive: true });
    } catch {
      // directory already exists or created
    }
  }

  private sanitizeKey(key: string): string {
    return key.replace(/[^a-zA-Z0-9_\-\.]/g, "_");
  }

  async upload(
    key: string,
    buffer: Buffer,
    meta: { originalName: string; mimeType: string }
  ): Promise<StoredFileMeta> {
    await this.ensureBaseDir();
    const safeKey = this.sanitizeKey(key);
    const targetPath = path.join(this.baseDir, safeKey);

    const hash = crypto.createHash("sha256").update(buffer).digest("hex");
    await fs.writeFile(targetPath, buffer);

    return {
      key: safeKey,
      originalName: meta.originalName,
      mimeType: meta.mimeType,
      sizeBytes: buffer.length,
      storedPath: targetPath,
      checksumSha256: hash,
      uploadedAt: new Date(),
    };
  }

  async download(key: string): Promise<Buffer> {
    const safeKey = this.sanitizeKey(key);
    const targetPath = path.join(this.baseDir, safeKey);
    return await fs.readFile(targetPath);
  }

  async delete(key: string): Promise<boolean> {
    try {
      const safeKey = this.sanitizeKey(key);
      const targetPath = path.join(this.baseDir, safeKey);
      await fs.unlink(targetPath);
      return true;
    } catch {
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const safeKey = this.sanitizeKey(key);
      const targetPath = path.join(this.baseDir, safeKey);
      await fs.access(targetPath);
      return true;
    } catch {
      return false;
    }
  }

  async getUrl(key: string): Promise<string> {
    const safeKey = this.sanitizeKey(key);
    return `/api/documents/preview/${safeKey}`;
  }
}

// Export singleton instance for app-wide use
export const defaultStorage = new LocalStorageAdapter();
