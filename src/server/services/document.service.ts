import { IStorageAdapter } from "../storage/storage.interface";
import { defaultStorage } from "../storage/local-storage.adapter";
import { DocumentType } from "../documents/document-ai.interface";

export interface StoredDocument {
  documentId: string;
  applicationId: string;
  documentType: DocumentType;
  fileName: string;
  storageKey: string;
  isVerified: boolean;
  uploadedAt: Date;
}

export interface IDocumentService {
  uploadDocument(
    applicationId: string,
    documentType: DocumentType,
    fileName: string,
    buffer: Buffer
  ): Promise<StoredDocument>;
  getDocumentById(documentId: string): Promise<StoredDocument | null>;
  listApplicationDocuments(applicationId: string): Promise<StoredDocument[]>;
}

export class DocumentService implements IDocumentService {
  constructor(private storage: IStorageAdapter = defaultStorage) {}

  async uploadDocument(
    applicationId: string,
    documentType: DocumentType,
    fileName: string,
    buffer: Buffer
  ): Promise<StoredDocument> {
    const key = `${applicationId}_${documentType}_${Date.now()}_${fileName}`;
    const meta = await this.storage.upload(key, buffer, {
      originalName: fileName,
      mimeType: fileName.endsWith(".pdf") ? "application/pdf" : "image/jpeg",
    });

    return {
      documentId: `doc_${Date.now()}`,
      applicationId,
      documentType,
      fileName,
      storageKey: meta.key,
      isVerified: false,
      uploadedAt: meta.uploadedAt,
    };
  }

  async getDocumentById(_documentId: string): Promise<StoredDocument | null> {
    // Stub: Implementation in Phase 2B
    return null;
  }

  async listApplicationDocuments(_applicationId: string): Promise<StoredDocument[]> {
    // Stub: Implementation in Phase 2B
    return [];
  }
}

export const documentService = new DocumentService();
