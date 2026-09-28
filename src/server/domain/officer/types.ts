import {
  ApplicationStatus,
  CaseStage,
  CaseState,
  DocumentType,
  ProcessingStatus,
  ResponsibleActor,
  RuleOutcome,
  DeficiencyType,
  DeficiencyStatus,
  RecheckStatus,
} from "@prisma/client";
import { RuleEvaluationResult, ConsistencyCheckItem } from "../eligibility/types";
import { OfficerDeficiencyDTO } from "../deficiency/types";

export interface OfficerQueueItemDTO {
  caseId: string;
  caseNumber: string;
  applicationId: string;
  applicationNumber: string;
  schemeCode: string;
  schemeName: string;
  schemeVersionNumber: number;
  applicantName: string;
  applicantCategory: string;
  stateDomicile: string | null;
  submittedAt: string;
  currentStage: CaseStage;
  currentState: CaseState;
  responsibleActor: ResponsibleActor;
  blocker: string | null;
  nextAction: string;
  eligibilityAssessment:
    "ELIGIBLE_ASSESSED" | "NOT_ELIGIBLE_ASSESSED" | "REVIEW_REQUIRED" | "UNASSESSED";
  openDeficiencyCount: number;
  documentCount: number;
  processedDocumentCount: number;
  hasReviewRequiredDocs: boolean;
  assignedOfficerId: string | null;
  assignedOfficerName: string | null;
}

export interface OfficerQueueFilterQuery {
  schemeCode?: string;
  currentStage?: CaseStage;
  currentState?: CaseState;
  assessment?: string;
  hasDeficiencies?: boolean;
  search?: string;
  assignedToMe?: boolean;
  sortBy?: "oldestSubmission" | "newestSubmission" | "recentlyUpdated" | "actionRequiredFirst";
  page?: number;
  pageSize?: number;
}

export interface OfficerQueueResponseDTO {
  total: number;
  page: number;
  pageSize: number;
  items: OfficerQueueItemDTO[];
  counts: {
    totalAssigned: number;
    actionRequired: number;
    deficiencyPending: number;
    readyForReview: number;
  };
}

export interface BoundingBoxCoordinates {
  x: number; // 0.0 - 1.0 (left percentage)
  y: number; // 0.0 - 1.0 (top percentage)
  width: number; // 0.0 - 1.0 (width percentage)
  height: number; // 0.0 - 1.0 (height percentage)
}

export interface ExtractedEvidenceFieldDTO {
  id: string;
  documentId: string;
  fieldKey: string;
  label: string;
  rawValue: string;
  normalizedValue: string | null;
  confidenceScore: number;
  pageNumber: number;
  boundingBox: BoundingBoxCoordinates | null;
  sourceSnippet: string | null;
  extractorProvider: string | null;
  extractorVersion: string | null;
  extractionMethod: string | null;
  extractedBy: "AI" | "HUMAN_OVERRIDE";
  isAmbiguous: boolean;
}

export interface OfficerDocumentItemDTO {
  id: string;
  documentType: DocumentType;
  classifiedAs: DocumentType | null;
  classificationConfidence: number | null;
  originalFilename: string;
  storagePath: string;
  mimeType: string;
  fileSizeBytes: number;
  version: number;
  isLatestVersion: boolean;
  processingStatus: ProcessingStatus;
  pageCount: number | null;
  uploadedAt: string;
  extractedFields: ExtractedEvidenceFieldDTO[];
}

export interface CaseTimelineEventDTO {
  id: string;
  actionType: string;
  actorId: string | null;
  actorName: string | null;
  actorRole: string | null;
  title: string;
  description: string;
  previousState: string | null;
  newState: string | null;
  payload: Record<string, unknown> | null;
  createdAt: string;
}

export interface OfficerCaseDetailDTO {
  caseDossier: {
    id: string;
    caseNumber: string;
    currentStage: CaseStage;
    currentState: CaseState;
    blocker: string | null;
    responsibleActor: ResponsibleActor;
    nextAction: string;
    deadline: string | null;
    officerAssignedId: string | null;
    officerAssignedName: string | null;
    createdAt: string;
    updatedAt: string;
  };
  application: {
    id: string;
    applicationNumber: string;
    status: ApplicationStatus;
    submittedAt: string | null;
    formData: Record<string, unknown>;
  };
  applicant: {
    userId: string;
    name: string;
    email: string;
    category: string;
    dateOfBirth: string | null;
    gender: string | null;
    stateDomicile: string | null;
    district: string | null;
    mobile: string | null;
    aadhaarLast4: string | null;
    academicQualification: string | null;
    institutionName: string | null;
    yearOfPassing: number | null;
    percentageObtained: number | null;
    annualFamilyIncome: number | null;
    casteCertificateVerified: boolean;
  };
  scheme: {
    id: string;
    code: string;
    name: string;
    versionId: string;
    versionNumber: number;
    effectiveFrom: string;
    formSchema: Record<string, unknown>;
    documentRequirements: Record<string, unknown>;
    eligibilityRules: Record<string, unknown>;
  };
  documents: OfficerDocumentItemDTO[];
  eligibility: {
    assessmentStatus:
      "ELIGIBLE_ASSESSED" | "NOT_ELIGIBLE_ASSESSED" | "REVIEW_REQUIRED" | "UNASSESSED";
    latestRunId: string | null;
    evaluatedAt: string | null;
    passedRulesCount: number;
    failedRulesCount: number;
    ambiguousRulesCount: number;
    totalRulesCount: number;
    rules: RuleEvaluationResult[];
    consistencyChecks: ConsistencyCheckItem[];
  };
  deficiencies: OfficerDeficiencyDTO[];
  timeline: CaseTimelineEventDTO[];
}

export interface AddOfficerNoteDTO {
  note: string;
}

export interface TransitionCaseStageDTO {
  targetStage: CaseStage;
  remark: string;
  blocker?: string | null;
  nextAction?: string;
}
