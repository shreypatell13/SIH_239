import {
  ApplicationStatus,
  CaseStage,
  CaseState,
  DocumentType,
  ProcessingStatus,
  ResponsibleActor,
} from "@prisma/client";
import { FormSchema, DocumentRequirementsSchema } from "../../scheme/types";

export interface ApplicantProfileDTO {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  dateOfBirth: string | null;
  gender: string | null;
  category: string;
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
}

export interface UpdateApplicantProfileDTO {
  dateOfBirth?: string | null;
  gender?: string | null;
  stateDomicile?: string | null;
  district?: string | null;
  mobile?: string | null;
  aadhaarLast4?: string | null;
  academicQualification?: string | null;
  institutionName?: string | null;
  yearOfPassing?: number | null;
  percentageObtained?: number | null;
  annualFamilyIncome?: number | null;
}

export interface ApplicationSummaryDTO {
  id: string;
  applicationNumber: string;
  schemeId: string;
  schemeCode: string;
  schemeName: string;
  schemeVersionId: string;
  versionNumber: number;
  status: ApplicationStatus;
  formCompletionPercent: number;
  documentsUploadedCount: number;
  documentsRequiredCount: number;
  createdAt: string;
  updatedAt: string;
  submittedAt: string | null;
  caseDossierId?: string | null;
  caseNumber?: string | null;
  caseStage?: CaseStage | null;
  caseState?: CaseState | null;
  responsibleActor?: ResponsibleActor | null;
  nextAction?: string | null;
}

export interface ApplicationDetailDTO {
  id: string;
  applicationNumber: string;
  schemeId: string;
  schemeCode: string;
  schemeName: string;
  schemeDescription: string;
  schemeVersionId: string;
  versionNumber: number;
  status: ApplicationStatus;
  formData: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  submittedAt: string | null;
  schemeVersion: {
    id: string;
    versionNumber: number;
    formSchema: FormSchema;
    documentRequirements: DocumentRequirementsSchema;
    applicationOpenDate: string | null;
    applicationDeadline: string | null;
  };
  caseDossier: {
    id: string;
    caseNumber: string;
    currentStage: CaseStage;
    currentState: CaseState;
    blocker: string | null;
    responsibleActor: ResponsibleActor;
    nextAction: string;
    deadline: string | null;
  } | null;
}

export interface DocumentSummaryDTO {
  id: string;
  caseDossierId: string;
  documentType: DocumentType;
  originalFilename: string;
  storagePath: string;
  mimeType: string;
  fileSizeBytes: number;
  version: number;
  isLatestVersion: boolean;
  processingStatus: ProcessingStatus;
  uploadedAt: string;
  previewUrl: string;
}

export interface ChecklistItemDTO {
  requirementId: string;
  documentType: DocumentType;
  label: string;
  description: string;
  level: "MANDATORY" | "CONDITIONAL" | "OPTIONAL";
  isRequired: boolean;
  isUploaded: boolean;
  uploadedDocument?: DocumentSummaryDTO;
  allowedMimeTypes: string[];
  maxFileSizeMb: number;
  maxPages?: number;
  validityWindowMonths?: number;
  issuerCriteria?: string;
}

export interface ReadinessReportDTO {
  overallStatus: "READY" | "ACTION_REQUIRED" | "INCOMPLETE";
  canSubmit: boolean;
  formReadiness: {
    status: "COMPLETE" | "INCOMPLETE";
    completedFieldsCount: number;
    requiredFieldsCount: number;
    incompleteSections: string[];
    missingFields: { id: string; label: string; sectionTitle: string }[];
  };
  documentReadiness: {
    status: "COMPLETE" | "INCOMPLETE";
    uploadedMandatoryCount: number;
    totalMandatoryCount: number;
    missingMandatory: string[];
    missingConditional: string[];
  };
  windowStatus: {
    isOpen: boolean;
    opensAt: string | null;
    closesAt: string | null;
    daysRemaining: number | null;
    message: string;
  };
}

export interface ExplainableCaseStatusDTO {
  applicationId: string;
  applicationNumber: string;
  caseId: string;
  caseNumber: string;
  schemeCode: string;
  schemeName: string;
  status: ApplicationStatus;
  stage: CaseStage;
  stageLabel: string;
  state: CaseState;
  stateLabel: string;
  blocker: string | null;
  responsibleActor: ResponsibleActor;
  responsibleActorLabel: string;
  nextAction: string;
  deadline: string | null;
  submittedAt: string | null;
  updatedAt: string;
}
