import { prisma } from "../db";
import { Document, DocumentProcessingJob, ProcessingStatus, Prisma } from "@prisma/client";

export interface DocumentProcessingJobWithDoc extends DocumentProcessingJob {
  document: Document;
}

export class DocumentProcessingJobRepository {
  /**
   * Enqueues or resets a document processing job.
   */
  async createOrResetJob(documentId: string): Promise<DocumentProcessingJob> {
    return prisma.documentProcessingJob.upsert({
      where: { documentId },
      create: {
        documentId,
        status: ProcessingStatus.PENDING,
        attemptCount: 0,
        maxAttempts: 3,
      },
      update: {
        status: ProcessingStatus.PENDING,
        attemptCount: 0,
        lastError: null,
        failureReason: null,
        startedAt: null,
        completedAt: null,
        nextRetryAt: null,
      },
    });
  }

  async findById(id: string): Promise<DocumentProcessingJobWithDoc | null> {
    return prisma.documentProcessingJob.findUnique({
      where: { id },
      include: { document: true },
    });
  }

  async findByDocumentId(documentId: string): Promise<DocumentProcessingJob | null> {
    return prisma.documentProcessingJob.findUnique({
      where: { documentId },
    });
  }

  /**
   * Atomically claims the next pending job using PostgreSQL row-level lock (FOR UPDATE SKIP LOCKED).
   * Ensures zero race condition between concurrent sweep workers.
   */
  async claimNextPendingJob(): Promise<DocumentProcessingJobWithDoc | null> {
    const now = new Date();
    return prisma.$transaction(async (tx) => {
      const rawRows = await tx.$queryRaw<Array<{ id: string }>>`
        SELECT id FROM "document_processing_jobs"
        WHERE status = 'PENDING'
          AND ("nextRetryAt" IS NULL OR "nextRetryAt" <= NOW())
          AND "attemptCount" < "maxAttempts"
        ORDER BY "createdAt" ASC
        LIMIT 1
        FOR UPDATE SKIP LOCKED;
      `;

      if (!rawRows || rawRows.length === 0) {
        return null;
      }

      const jobId = rawRows[0].id;
      const claimed = await tx.documentProcessingJob.update({
        where: { id: jobId },
        data: {
          status: ProcessingStatus.PROCESSING,
          startedAt: now,
          attemptCount: { increment: 1 },
        },
        include: { document: true },
      });

      return claimed;
    });
  }

  /**
   * Recovers jobs that have been stuck in PROCESSING past the stale threshold.
   */
  async recoverStaleJobs(staleMinutes = 5): Promise<number> {
    const cutoff = new Date(Date.now() - staleMinutes * 60 * 1000);

    const staleJobs = await prisma.documentProcessingJob.findMany({
      where: {
        status: ProcessingStatus.PROCESSING,
        startedAt: { lt: cutoff },
      },
      include: { document: true },
    });

    let recovered = 0;
    for (const job of staleJobs) {
      if (job.attemptCount >= job.maxAttempts) {
        // Exceeded max attempts, mark failed
        await prisma.$transaction([
          prisma.documentProcessingJob.update({
            where: { id: job.id },
            data: {
              status: ProcessingStatus.FAILED,
              failureReason: "PROCESSING_TIMED_OUT_MAX_ATTEMPTS",
              completedAt: new Date(),
            },
          }),
          prisma.document.update({
            where: { id: job.documentId },
            data: { processingStatus: ProcessingStatus.FAILED },
          }),
        ]);
      } else {
        // Reset to pending for retry
        await prisma.documentProcessingJob.update({
          where: { id: job.id },
          data: {
            status: ProcessingStatus.PENDING,
            lastError: "Recovered from stale PROCESSING state",
          },
        });
      }
      recovered++;
    }

    return recovered;
  }

  /**
   * Updates job status and records errors or retry timing.
   */
  async updateJob(
    id: string,
    data: Prisma.DocumentProcessingJobUpdateInput
  ): Promise<DocumentProcessingJob> {
    return prisma.documentProcessingJob.update({
      where: { id },
      data,
    });
  }
}

export const documentProcessingJobRepository = new DocumentProcessingJobRepository();
