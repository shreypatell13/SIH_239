import {
  DisbursementStatus,
  RenewalStatus,
  ScholarStatus,
  DisbursementRecordStatus,
  UserRole,
} from "@prisma/client";

export interface ScholarSummaryDTO {
  id: string;
  caseDossierId: string;
  caseNumber: string;
  applicationNumber: string;
  applicantProfileId: string;
  applicantName: string;
  applicantEmail: string;
  category: string;
  stateDomicile?: string | null;
  schemeId: string;
  schemeCode: string;
  schemeName: string;
  schemeVersionNumber: number;
  awardedAmount: number;
  tenureStartDate: string;
  tenureEndDate: string;
  researchInstitution?: string | null;
  supervisorName?: string | null;
  fellowshipType?: string | null;
  disbursementStatus: DisbursementStatus;
  scholarStatus: ScholarStatus;
  currentYear: number;
  totalTenureYears: number;
  pfmsReferenceId?: string | null;
  renewalDueDate?: string | null;
  continuationApproved?: boolean | null;
  remarks?: string | null;
  activeRenewalsCount: number;
  pendingDisbursementsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface RenewalDTO {
  id: string;
  postSelectionRecordId: string;
  scholarName?: string;
  schemeCode?: string;
  caseNumber?: string;
  renewalCycle: number;
  academicYear: string;
  status: RenewalStatus;
  progressSummary?: string | null;
  publicationsCount: number;
  conferencesAttended: number;
  supervisorRecommendation?: string | null;
  supervisorRemarks?: string | null;
  submissionDate?: string | null;
  reviewDate?: string | null;
  officerRemarks?: string | null;
  reviewedById?: string | null;
  reviewedByName?: string | null;
  recheckRequired: boolean;
  deficiencyDetails?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DisbursementDTO {
  id: string;
  postSelectionRecordId: string;
  scholarName?: string;
  schemeCode?: string;
  caseNumber?: string;
  installmentNumber: number;
  financialYear: string;
  amount: number;
  status: DisbursementRecordStatus;
  pfmsReference?: string | null;
  scheduledDate?: string | null;
  disbursedAt?: string | null;
  remarks?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ScholarDetailDTO extends ScholarSummaryDTO {
  academicQualification?: string | null;
  institutionName?: string | null;
  mobile?: string | null;
  aadhaarLast4?: string | null;
  renewals: RenewalDTO[];
  disbursements: DisbursementDTO[];
  documents: Array<{
    id: string;
    documentType: string;
    originalFilename: string;
    mimeType: string;
    fileSizeBytes: number;
    uploadedAt: string;
    processingStatus: string;
  }>;
  auditLogs: Array<{
    id: string;
    actorName?: string | null;
    actorRole?: string | null;
    actionType: string;
    previousState?: string | null;
    newState?: string | null;
    createdAt: string;
  }>;
}

export interface PostSelectionMetricsDTO {
  totalScholars: number;
  activeScholars: number;
  onHoldScholars: number;
  completedScholars: number;
  renewalsDue: number;
  renewalsUnderReview: number;
  deficientRenewals: number;
  approvedRenewals: number;
  totalAwardedAmount: number;
  totalDisbursedAmount: number;
  pendingDisbursementAmount: number;
  schemeDistribution: Array<{
    schemeCode: string;
    schemeName: string;
    scholarCount: number;
    activeCount: number;
  }>;
  disbursementStatusBreakdown: Record<string, number>;
  renewalStatusBreakdown: Record<string, number>;
}

export interface ScholarFilterParams {
  search?: string;
  schemeCode?: string;
  scholarStatus?: ScholarStatus;
  disbursementStatus?: DisbursementStatus;
  fellowshipType?: string;
  page?: number;
  limit?: number;
}

export interface RenewalFilterParams {
  scholarId?: string;
  schemeCode?: string;
  status?: RenewalStatus;
  academicYear?: string;
  page?: number;
  limit?: number;
}

export interface DisbursementFilterParams {
  scholarId?: string;
  schemeCode?: string;
  status?: DisbursementRecordStatus;
  financialYear?: string;
  page?: number;
  limit?: number;
}

import { AuthenticatedUser } from "../../auth/roles";

export type UserContext = AuthenticatedUser;
