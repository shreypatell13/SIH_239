-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('APPLICANT', 'VERIFICATION_OFFICER', 'SCHEME_ADMIN', 'OPERATIONS_DIRECTOR');

-- CreateEnum
CREATE TYPE "CaseStage" AS ENUM ('DRAFT', 'SUBMITTED', 'AUTOMATED_VERIFICATION', 'OFFICER_REVIEW', 'DEFICIENCY_PENDING', 'COMMITTEE_SELECTION', 'SANCTIONED', 'REJECTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "CaseState" AS ENUM ('PENDING', 'IN_PROGRESS', 'ACTION_REQUIRED', 'COMPLETED', 'BLOCKED', 'ESCALATED');

-- CreateEnum
CREATE TYPE "ResponsibleActor" AS ENUM ('APPLICANT', 'VERIFICATION_OFFICER', 'SYSTEM', 'COMMITTEE');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('CASTE_CERTIFICATE', 'INCOME_CERTIFICATE', 'DEGREE_TRANSCRIPT', 'ADMISSION_OFFER_LETTER', 'RESEARCH_PROPOSAL', 'PASSPORT', 'OTHER');

-- CreateEnum
CREATE TYPE "ProcessingStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "RuleOutcome" AS ENUM ('PASS', 'FAIL', 'AMBIGUOUS', 'SKIPPED');

-- CreateEnum
CREATE TYPE "DeficiencyType" AS ENUM ('DOCUMENT_MISSING', 'DOCUMENT_EXPIRED', 'DOCUMENT_ILLEGIBLE', 'DATA_MISMATCH', 'AUTHORITY_SEAL_MISSING', 'CUSTOM');

-- CreateEnum
CREATE TYPE "DeficiencyStatus" AS ENUM ('OPEN', 'RESOLVED', 'WAIVED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "RecheckStatus" AS ENUM ('PENDING_RECHECK', 'RECHECKED_PASS', 'RECHECKED_FAIL');

-- CreateEnum
CREATE TYPE "DisbursementStatus" AS ENUM ('PENDING', 'FIRST_INSTALLMENT', 'ONGOING', 'COMPLETED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "ExtractorType" AS ENUM ('AI', 'HUMAN_OVERRIDE');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "name" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'APPLICANT',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applicant_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "gender" TEXT,
    "category" TEXT NOT NULL DEFAULT 'ST',
    "stateDomicile" TEXT,
    "district" TEXT,
    "mobile" TEXT,
    "aadhaarLast4" TEXT,
    "academicQualification" TEXT,
    "institutionName" TEXT,
    "yearOfPassing" INTEGER,
    "percentageObtained" DOUBLE PRECISION,
    "annualFamilyIncome" DOUBLE PRECISION,
    "casteCertificateVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "applicant_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schemes" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "ministry" TEXT NOT NULL DEFAULT 'Ministry of Tribal Affairs',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schemes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scheme_versions" (
    "id" TEXT NOT NULL,
    "schemeId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveTo" TIMESTAMP(3),
    "formSchema" JSONB NOT NULL,
    "documentRequirements" JSONB NOT NULL,
    "eligibilityRules" JSONB NOT NULL,
    "workflowConfig" JSONB,
    "publishedById" TEXT,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scheme_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applications" (
    "id" TEXT NOT NULL,
    "applicationNumber" TEXT NOT NULL,
    "schemeVersionId" TEXT NOT NULL,
    "applicantProfileId" TEXT NOT NULL,
    "submittedById" TEXT NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'DRAFT',
    "formData" JSONB NOT NULL,
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "case_dossiers" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "caseNumber" TEXT NOT NULL,
    "currentStage" "CaseStage" NOT NULL DEFAULT 'SUBMITTED',
    "currentState" "CaseState" NOT NULL DEFAULT 'PENDING',
    "blocker" TEXT,
    "responsibleActor" "ResponsibleActor" NOT NULL DEFAULT 'SYSTEM',
    "nextAction" TEXT NOT NULL DEFAULT 'Automated verification underway.',
    "deadline" TIMESTAMP(3),
    "riskScore" INTEGER,
    "officerAssignedId" TEXT,
    "committeeDecision" TEXT,
    "committeeRemarks" TEXT,
    "decisionAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "case_dossiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "caseDossierId" TEXT NOT NULL,
    "documentType" "DocumentType" NOT NULL,
    "originalFilename" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSizeBytes" INTEGER NOT NULL,
    "uploadedById" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isLatestVersion" BOOLEAN NOT NULL DEFAULT true,
    "processingStatus" "ProcessingStatus" NOT NULL DEFAULT 'PENDING',
    "classificationConfidence" DOUBLE PRECISION,
    "classifiedAs" "DocumentType",
    "pageCount" INTEGER,
    "deficiencyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "extracted_fields" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "fieldKey" TEXT NOT NULL,
    "rawValue" TEXT NOT NULL,
    "normalizedValue" TEXT,
    "confidenceScore" DOUBLE PRECISION NOT NULL,
    "pageNumber" INTEGER NOT NULL DEFAULT 1,
    "boundingBoxX" DOUBLE PRECISION,
    "boundingBoxY" DOUBLE PRECISION,
    "boundingBoxWidth" DOUBLE PRECISION,
    "boundingBoxHeight" DOUBLE PRECISION,
    "sourceSnippet" TEXT,
    "extractedBy" "ExtractorType" NOT NULL DEFAULT 'AI',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "extracted_fields_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rule_results" (
    "id" TEXT NOT NULL,
    "caseDossierId" TEXT NOT NULL,
    "schemeVersionId" TEXT NOT NULL,
    "ruleKey" TEXT NOT NULL,
    "ruleDescription" TEXT NOT NULL,
    "outcome" "RuleOutcome" NOT NULL,
    "evidenceFieldIds" TEXT[],
    "computedValue" TEXT,
    "expectedValue" TEXT,
    "failureReason" TEXT,
    "runId" TEXT NOT NULL,
    "evaluatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "evaluatedBySystem" BOOLEAN NOT NULL DEFAULT true,
    "overrideByUserId" TEXT,
    "overrideRemark" TEXT,

    CONSTRAINT "rule_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deficiencies" (
    "id" TEXT NOT NULL,
    "caseDossierId" TEXT NOT NULL,
    "issuedById" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "documentType" "DocumentType",
    "targetDocumentId" TEXT,
    "ruleResultId" TEXT,
    "deficiencyType" "DeficiencyType" NOT NULL,
    "description" TEXT NOT NULL,
    "responseDeadline" TIMESTAMP(3) NOT NULL,
    "status" "DeficiencyStatus" NOT NULL DEFAULT 'OPEN',
    "resolvedAt" TIMESTAMP(3),
    "recheckStatus" "RecheckStatus",
    "recheckAt" TIMESTAMP(3),
    "officerResolutionRemark" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deficiencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "caseDossierId" TEXT,
    "actorId" TEXT,
    "actorRole" "UserRole",
    "actionType" TEXT NOT NULL,
    "previousState" TEXT,
    "newState" TEXT,
    "payload" JSONB,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_selection_records" (
    "id" TEXT NOT NULL,
    "caseDossierId" TEXT NOT NULL,
    "applicantProfileId" TEXT NOT NULL,
    "schemeVersionId" TEXT NOT NULL,
    "awardedAmount" DECIMAL(12,2) NOT NULL,
    "tenureStartDate" TIMESTAMP(3) NOT NULL,
    "tenureEndDate" TIMESTAMP(3) NOT NULL,
    "researchInstitution" TEXT,
    "supervisorName" TEXT,
    "fellowshipType" TEXT,
    "disbursementStatus" "DisbursementStatus" NOT NULL DEFAULT 'PENDING',
    "pfmsReferenceId" TEXT,
    "renewalDueDate" TIMESTAMP(3),
    "continuationApproved" BOOLEAN,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "post_selection_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_health" (
    "id" TEXT NOT NULL,
    "checkName" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_health_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "applicant_profiles_userId_key" ON "applicant_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "schemes_code_key" ON "schemes"("code");

-- CreateIndex
CREATE INDEX "scheme_versions_schemeId_isActive_idx" ON "scheme_versions"("schemeId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "scheme_versions_schemeId_versionNumber_key" ON "scheme_versions"("schemeId", "versionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "applications_applicationNumber_key" ON "applications"("applicationNumber");

-- CreateIndex
CREATE UNIQUE INDEX "applications_applicantProfileId_schemeVersionId_key" ON "applications"("applicantProfileId", "schemeVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "case_dossiers_applicationId_key" ON "case_dossiers"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "case_dossiers_caseNumber_key" ON "case_dossiers"("caseNumber");

-- CreateIndex
CREATE INDEX "case_dossiers_currentStage_officerAssignedId_idx" ON "case_dossiers"("currentStage", "officerAssignedId");

-- CreateIndex
CREATE INDEX "case_dossiers_updatedAt_idx" ON "case_dossiers"("updatedAt");

-- CreateIndex
CREATE INDEX "documents_caseDossierId_documentType_isLatestVersion_idx" ON "documents"("caseDossierId", "documentType", "isLatestVersion");

-- CreateIndex
CREATE INDEX "extracted_fields_documentId_fieldKey_idx" ON "extracted_fields"("documentId", "fieldKey");

-- CreateIndex
CREATE INDEX "rule_results_caseDossierId_runId_idx" ON "rule_results"("caseDossierId", "runId");

-- CreateIndex
CREATE INDEX "rule_results_outcome_idx" ON "rule_results"("outcome");

-- CreateIndex
CREATE INDEX "deficiencies_caseDossierId_status_idx" ON "deficiencies"("caseDossierId", "status");

-- CreateIndex
CREATE INDEX "audit_logs_caseDossierId_createdAt_idx" ON "audit_logs"("caseDossierId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_actorId_idx" ON "audit_logs"("actorId");

-- CreateIndex
CREATE UNIQUE INDEX "post_selection_records_caseDossierId_key" ON "post_selection_records"("caseDossierId");

-- AddForeignKey
ALTER TABLE "applicant_profiles" ADD CONSTRAINT "applicant_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheme_versions" ADD CONSTRAINT "scheme_versions_schemeId_fkey" FOREIGN KEY ("schemeId") REFERENCES "schemes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheme_versions" ADD CONSTRAINT "scheme_versions_publishedById_fkey" FOREIGN KEY ("publishedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_schemeVersionId_fkey" FOREIGN KEY ("schemeVersionId") REFERENCES "scheme_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_applicantProfileId_fkey" FOREIGN KEY ("applicantProfileId") REFERENCES "applicant_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_dossiers" ADD CONSTRAINT "case_dossiers_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_dossiers" ADD CONSTRAINT "case_dossiers_officerAssignedId_fkey" FOREIGN KEY ("officerAssignedId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_caseDossierId_fkey" FOREIGN KEY ("caseDossierId") REFERENCES "case_dossiers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_deficiencyId_fkey" FOREIGN KEY ("deficiencyId") REFERENCES "deficiencies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "extracted_fields" ADD CONSTRAINT "extracted_fields_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rule_results" ADD CONSTRAINT "rule_results_caseDossierId_fkey" FOREIGN KEY ("caseDossierId") REFERENCES "case_dossiers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rule_results" ADD CONSTRAINT "rule_results_schemeVersionId_fkey" FOREIGN KEY ("schemeVersionId") REFERENCES "scheme_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rule_results" ADD CONSTRAINT "rule_results_overrideByUserId_fkey" FOREIGN KEY ("overrideByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deficiencies" ADD CONSTRAINT "deficiencies_caseDossierId_fkey" FOREIGN KEY ("caseDossierId") REFERENCES "case_dossiers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deficiencies" ADD CONSTRAINT "deficiencies_issuedById_fkey" FOREIGN KEY ("issuedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deficiencies" ADD CONSTRAINT "deficiencies_targetDocumentId_fkey" FOREIGN KEY ("targetDocumentId") REFERENCES "documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deficiencies" ADD CONSTRAINT "deficiencies_ruleResultId_fkey" FOREIGN KEY ("ruleResultId") REFERENCES "rule_results"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_caseDossierId_fkey" FOREIGN KEY ("caseDossierId") REFERENCES "case_dossiers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_selection_records" ADD CONSTRAINT "post_selection_records_caseDossierId_fkey" FOREIGN KEY ("caseDossierId") REFERENCES "case_dossiers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_selection_records" ADD CONSTRAINT "post_selection_records_applicantProfileId_fkey" FOREIGN KEY ("applicantProfileId") REFERENCES "applicant_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_selection_records" ADD CONSTRAINT "post_selection_records_schemeVersionId_fkey" FOREIGN KEY ("schemeVersionId") REFERENCES "scheme_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
