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

  /**
   * Sanitizes storage key and guarantees absolute path is contained strictly within baseDir.
   * Throws a security error if a path traversal attempt is detected.
   */
  public resolveSafePath(key: string): { safeKey: string; targetPath: string } {
    if (!key || typeof key !== "string") {
      throw new Error("SECURITY_ERROR: Storage key must be a non-empty string");
    }

    // Strip null bytes and control chars
    const cleaned = key.replace(/\0/g, "").trim();

    // Replace invalid characters while preserving clean alphanumeric separators
    const safeKey = cleaned.replace(/[^a-zA-Z0-9_\-\.]/g, "_");

    const targetPath = path.resolve(this.baseDir, safeKey);

    // Verify directory traversal containment
    const normalizedBase = path.normalize(this.baseDir);
    const normalizedTarget = path.normalize(targetPath);

    if (
      !normalizedTarget.startsWith(normalizedBase + path.sep) &&
      normalizedTarget !== normalizedBase
    ) {
      throw new Error("SECURITY_ERROR: Storage path traversal attempt detected");
    }

    return { safeKey, targetPath };
  }

  async upload(
    key: string,
    buffer: Buffer,
    meta: { originalName: string; mimeType: string }
  ): Promise<StoredFileMeta> {
    await this.ensureBaseDir();
    const { safeKey, targetPath } = this.resolveSafePath(key);

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
    const { targetPath } = this.resolveSafePath(key);
    return await fs.readFile(targetPath);
  }

  async delete(key: string): Promise<boolean> {
    try {
      const { targetPath } = this.resolveSafePath(key);
      await fs.unlink(targetPath);
      return true;
    } catch {
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const { targetPath } = this.resolveSafePath(key);
      await fs.access(targetPath);
      return true;
    } catch {
      return false;
    }
  }

  async getUrl(key: string): Promise<string> {
    const { safeKey } = this.resolveSafePath(key);
    return `/api/documents/preview/${safeKey}`;
  }
}

// Export singleton instance for app-wide use
export const defaultStorage = new LocalStorageAdapter();
