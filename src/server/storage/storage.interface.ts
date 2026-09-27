export interface StoredFileMeta {
  key: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  storedPath: string;
  checksumSha256?: string;
  uploadedAt: Date;
}

export interface IStorageAdapter {
  /**
   * Persists a file buffer with a given key and metadata.
   */
  upload(
    key: string,
    buffer: Buffer,
    meta: { originalName: string; mimeType: string }
  ): Promise<StoredFileMeta>;

  /**
   * Retrieves a file buffer by key.
   */
  download(key: string): Promise<Buffer>;

  /**
   * Deletes a stored file by key.
   */
  delete(key: string): Promise<boolean>;

  /**
   * Checks if a file exists.
   */
  exists(key: string): Promise<boolean>;

  /**
   * Returns a URL or access path for the stored asset.
   */
  getUrl(key: string): Promise<string>;
}
