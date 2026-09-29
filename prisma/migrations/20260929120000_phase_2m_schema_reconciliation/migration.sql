-- CreateEnum
CREATE TYPE "RenewalStatus" AS ENUM ('UPCOMING', 'DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'DEFICIENT', 'APPROVED', 'REJECTED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ScholarStatus" AS ENUM ('ACTIVE', 'ON_HOLD', 'RENEWAL_DUE', 'COMPLETED', 'TERMINATED');

-- CreateEnum
CREATE TYPE "DisbursementRecordStatus" AS ENUM ('PENDING', 'PROCESSING', 'PAID', 'FAILED', 'HELD');

-- AlterTable
ALTER TABLE "post_selection_records" ADD COLUMN     "currentYear" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "scholarStatus" "ScholarStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "totalTenureYears" INTEGER NOT NULL DEFAULT 3;

-- CreateTable
CREATE TABLE "scholar_renewals" (
    "id" TEXT NOT NULL,
    "postSelectionRecordId" TEXT NOT NULL,
    "renewalCycle" INTEGER NOT NULL DEFAULT 1,
    "academicYear" TEXT NOT NULL,
    "status" "RenewalStatus" NOT NULL DEFAULT 'UPCOMING',
    "progressSummary" TEXT,
    "publicationsCount" INTEGER NOT NULL DEFAULT 0,
    "conferencesAttended" INTEGER NOT NULL DEFAULT 0,
    "supervisorRecommendation" TEXT,
    "supervisorRemarks" TEXT,
    "submissionDate" TIMESTAMP(3),
    "reviewDate" TIMESTAMP(3),
    "officerRemarks" TEXT,
    "reviewedById" TEXT,
    "recheckRequired" BOOLEAN NOT NULL DEFAULT false,
    "deficiencyDetails" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scholar_renewals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disbursement_records" (
    "id" TEXT NOT NULL,
    "postSelectionRecordId" TEXT NOT NULL,
    "installmentNumber" INTEGER NOT NULL DEFAULT 1,
    "financialYear" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "status" "DisbursementRecordStatus" NOT NULL DEFAULT 'PENDING',
    "pfmsReference" TEXT,
    "scheduledDate" TIMESTAMP(3),
    "disbursedAt" TIMESTAMP(3),
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "disbursement_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "scholar_renewals_postSelectionRecordId_status_idx" ON "scholar_renewals"("postSelectionRecordId", "status");

-- CreateIndex
CREATE INDEX "disbursement_records_postSelectionRecordId_status_idx" ON "disbursement_records"("postSelectionRecordId", "status");

-- CreateIndex
CREATE INDEX "post_selection_records_applicantProfileId_idx" ON "post_selection_records"("applicantProfileId");

-- CreateIndex
CREATE INDEX "post_selection_records_scholarStatus_idx" ON "post_selection_records"("scholarStatus");

-- AddForeignKey
ALTER TABLE "scholar_renewals" ADD CONSTRAINT "scholar_renewals_postSelectionRecordId_fkey" FOREIGN KEY ("postSelectionRecordId") REFERENCES "post_selection_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scholar_renewals" ADD CONSTRAINT "scholar_renewals_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disbursement_records" ADD CONSTRAINT "disbursement_records_postSelectionRecordId_fkey" FOREIGN KEY ("postSelectionRecordId") REFERENCES "post_selection_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;\n