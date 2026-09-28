import { IStorageAdapter } from "../storage/storage.interface";
import { defaultStorage } from "../storage/local-storage.adapter";
import { documentRepository } from "../repositories/document.repository";
import { Document, DocumentType, ProcessingStatus } from "@prisma/client";
import { DocumentSummaryDTO } from "../domain/application/types";

export interface IDocumentService {
  uploadDocumentForCase(params: {
    caseDossierId: string;
    documentType: DocumentType;
    fileName: string;
    mimeType: string;
    buffer: Buffer;
    uploadedById: string;
    deficiencyId?: string;
  }): Promise<DocumentSummaryDTO>;

  getDocumentById(documentId: string): Promise<Document | null>;
  listCaseDocuments(caseDossierId: string, latestOnly?: boolean): Promise<DocumentSummaryDTO[]>;
  deleteDraftDocument(documentId: string, caseDossierId: string): Promise<boolean>;
  getDownloadStream(storagePath: string): Promise<Buffer>;
}

export class DocumentService implements IDocumentService {
  constructor(private storage: IStorageAdapter = defaultStorage) {}

  private mapToSummaryDTO(doc: Document): DocumentSummaryDTO {
    return {
      id: doc.id,
      caseDossierId: doc.caseDossierId,
      documentType: doc.documentType,
      originalFilename: doc.originalFilename,
      storagePath: doc.storagePath,
      mimeType: doc.mimeType,
      fileSizeBytes: doc.fileSizeBytes,
      version: doc.version,
      isLatestVersion: doc.isLatestVersion,
      processingStatus: doc.processingStatus,
      uploadedAt: doc.uploadedAt.toISOString(),
      previewUrl: `/api/documents/preview/${doc.storagePath}`,
    };
  }

  /**
   * Uploads a document attached to a CaseDossier, replacing previous versions if any exist.
   */
  async uploadDocumentForCase(params: {
    caseDossierId: string;
    documentType: DocumentType;
    fileName: string;
    mimeType: string;
    buffer: Buffer;
    uploadedById: string;
    deficiencyId?: string;
  }): Promise<DocumentSummaryDTO> {
    const timestamp = Date.now();
    const sanitizedName = params.fileName.replace(/[^a-zA-Z0-9_\-\.]/g, "_");
    const storageKey = `${params.caseDossierId}/${params.documentType}/${timestamp}_${sanitizedName}`;

    // 1. Store the binary file via IStorageAdapter
    const meta = await this.storage.upload(storageKey, params.buffer, {
      originalName: params.fileName,
      mimeType: params.mimeType,
    });

    // 2. Persist Document record using atomic replacement in repository
    const createdDoc = await documentRepository.replaceDocument(
      params.caseDossierId,
      params.documentType,
      {
        documentType: params.documentType,
        originalFilename: params.fileName,
        storagePath: meta.key,
        mimeType: params.mimeType,
        fileSizeBytes: meta.sizeBytes,
        uploadedById: params.uploadedById,
        ...(params.deficiencyId ? { deficiency: { connect: { id: params.deficiencyId } } } : {}),
        processingStatus: ProcessingStatus.PENDING,
      }
    );

    return this.mapToSummaryDTO(createdDoc);
  }

  async getDocumentById(documentId: string): Promise<Document | null> {
    return documentRepository.findById(documentId);
  }

  async listCaseDocuments(
    caseDossierId: string,
    latestOnly: boolean = true
  ): Promise<DocumentSummaryDTO[]> {
    const docs = await documentRepository.listByCaseId(caseDossierId, latestOnly);
    return docs.map((d) => this.mapToSummaryDTO(d));
  }

  async deleteDraftDocument(documentId: string, caseDossierId: string): Promise<boolean> {
    const doc = await documentRepository.findById(documentId);
    if (!doc || doc.caseDossierId !== caseDossierId) {
      return false;
    }

    // Delete physically from storage adapter if possible
    await this.storage.delete(doc.storagePath).catch(() => false);

    // Delete record from DB
    await documentRepository.delete(documentId);
    return true;
  }

  async getDownloadStream(storagePath: string): Promise<Buffer> {
    return this.storage.download(storagePath);
  }
}

export const documentService = new DocumentService();
