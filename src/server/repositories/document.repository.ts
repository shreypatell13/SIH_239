import { prisma } from "../db";
import { Document, DocumentType, ExtractedField, Prisma } from "@prisma/client";

export class DocumentRepository {
  async listByCaseId(caseDossierId: string, latestOnly: boolean = true): Promise<Document[]> {
    return prisma.document.findMany({
      where: {
        caseDossierId,
        ...(latestOnly ? { isLatestVersion: true } : {}),
      },
      include: {
        extractedFields: true,
      },
      orderBy: [{ documentType: "asc" }, { version: "desc" }],
    });
  }

  async findById(id: string): Promise<Document | null> {
    return prisma.document.findUnique({
      where: { id },
      include: { extractedFields: true },
    });
  }

  async create(data: Prisma.DocumentCreateInput): Promise<Document> {
    return prisma.document.create({ data });
  }

  async saveExtractedField(
    documentId: string,
    data: Omit<Prisma.ExtractedFieldCreateInput, "document">
  ): Promise<ExtractedField> {
    return prisma.extractedField.create({
      data: {
        ...data,
        document: { connect: { id: documentId } },
      },
    });
  }

  async replaceDocument(
    caseDossierId: string,
    docType: DocumentType,
    newDocData: Omit<Prisma.DocumentCreateInput, "caseDossier">
  ): Promise<Document> {
    return prisma.$transaction(async (tx) => {
      // Mark all previous documents of this type for this case as not latest
      await tx.document.updateMany({
        where: {
          caseDossierId,
          documentType: docType,
        },
        data: {
          isLatestVersion: false,
        },
      });

      // Find highest version number
      const existing = await tx.document.findMany({
        where: { caseDossierId, documentType: docType },
        orderBy: { version: "desc" },
        take: 1,
      });

      const nextVersion = existing.length > 0 ? existing[0].version + 1 : 1;

      return tx.document.create({
        data: {
          ...newDocData,
          version: nextVersion,
          isLatestVersion: true,
          caseDossier: { connect: { id: caseDossierId } },
        },
        include: { extractedFields: true },
      });
    });
  }

  async delete(id: string): Promise<Document> {
    return prisma.document.delete({
      where: { id },
    });
  }
}

export const documentRepository = new DocumentRepository();
