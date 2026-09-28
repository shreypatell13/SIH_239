-- AlterEnum
ALTER TYPE "ProcessingStatus" ADD VALUE 'REVIEW_REQUIRED';

-- AlterTable
ALTER TABLE "extracted_fields" ADD COLUMN     "extractionMethod" TEXT,
ADD COLUMN     "extractorProvider" TEXT,
ADD COLUMN     "extractorVersion" TEXT;

-- CreateTable
CREATE TABLE "document_processing_jobs" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "status" "ProcessingStatus" NOT NULL DEFAULT 'PENDING',
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "lastError" TEXT,
    "failureReason" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "nextRetryAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_processing_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "document_processing_jobs_documentId_key" ON "document_processing_jobs"("documentId");

-- CreateIndex
CREATE INDEX "document_processing_jobs_status_nextRetryAt_idx" ON "document_processing_jobs"("status", "nextRetryAt");

-- AddForeignKey
ALTER TABLE "document_processing_jobs" ADD CONSTRAINT "document_processing_jobs_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
