/**
 * Deficiency & Remediation Domain Types
 * Phase 2H: Deficiency Management & Targeted Recheck Engine
 *
 * Core Concept:
 * Detect → Explain → Correct → Recheck → Resolve
 */

import {
  DeficiencyStatus,
  DeficiencyType,
  RecheckStatus,
  DocumentType,
  UserRole,
} from "@prisma/client";

export { DeficiencyStatus, DeficiencyType, RecheckStatus, DocumentType };

export type RemedyAction =
  "UPLOAD_DOCUMENT" | "REPLACE_DOCUMENT" | "PROVIDE_CLARIFICATION" | "UPDATE_APPLICATION_FIELD";

export interface ApplicantDeficiencyDTO {
  id: string;
  caseDossierId: string;
  applicationId: string;
  deficiencyType: DeficiencyType;
  title: string;
  description: string;
  remedyAction: RemedyAction;
  documentType?: DocumentType | null;
  targetDocumentFilename?: string | null;
  status: DeficiencyStatus;
  recheckStatus?: RecheckStatus | null;
  recheckAt?: Date | null;
  responseDeadline: Date;
  isExpired: boolean;
  applicantResponseText?: string | null;
  applicantRespondedAt?: Date | null;
  resolvedAt?: Date | null;
  issuedAt: Date;
  resolutionDocuments: Array<{
    id: string;
    originalFilename: string;
    version: number;
    uploadedAt: Date;
    processingStatus: string;
  }>;
}

export interface OfficerDeficiencyDTO extends ApplicantDeficiencyDTO {
  ruleResultId?: string | null;
  ruleKey?: string | null;
  targetDocumentId?: string | null;
  issuedBy: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
  };
  officerResolutionRemark?: string | null;
}

export interface DeficiencySummaryDTO {
  totalDeficiencies: number;
  openCount: number;
  resolvedCount: number;
  waivedCount: number;
  applicantActionRequired: boolean;
  nextAction: string;
  deadline?: Date | null;
}

export interface DeficiencyCreationInput {
  caseDossierId: string;
  issuedById: string;
  deficiencyType: DeficiencyType;
  documentType?: DocumentType | null;
  targetDocumentId?: string | null;
  ruleResultId?: string | null;
  description?: string;
  responseDeadline?: Date;
  customRemedyAction?: RemedyAction;
}

export interface ApplicantResponseInput {
  clarificationText?: string;
  resolvingDocumentId?: string;
}

export interface OfficerResolutionInput {
  action: "RESOLVE" | "WAIVE" | "REOPEN";
  remark: string;
}

export interface RecheckEvaluationResult {
  deficiencyId: string;
  previousStatus: DeficiencyStatus;
  newStatus: DeficiencyStatus;
  recheckStatus: RecheckStatus;
  explanation: string;
  isResolved: boolean;
}
