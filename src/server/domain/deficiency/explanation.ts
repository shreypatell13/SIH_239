/**
 * Plain-English Scheme-Aware Explanation Generator
 * Phase 2H: Deficiency Management & Targeted Recheck Engine
 *
 * Grounding Principles:
 * 1. Clear, respectful, actionable, non-technical language.
 * 2. Scheme-aware context.
 * 3. Never accuse applicant of fraud or use intimidating language.
 * 4. Never leak internal ML thresholds or system debugging stack traces.
 */

import { DeficiencyType, DocumentType } from "@prisma/client";
import { RemedyAction, OfficerDeficiencyDTO } from "./types";
import { isDeficiencyExpired } from "./policy";

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  CASTE_CERTIFICATE: "Scheduled Tribe (ST) Certificate",
  INCOME_CERTIFICATE: "Annual Family Income Certificate",
  DEGREE_TRANSCRIPT: "Qualifying Degree Marksheets / Transcripts",
  ADMISSION_OFFER_LETTER: "University Admission / Offer Letter",
  RESEARCH_PROPOSAL: "Research Proposal / Synopsis",
  PASSPORT: "Indian Passport",
  OTHER: "Supporting Document",
};

export interface GeneratedExplanation {
  title: string;
  description: string;
  remedyAction: RemedyAction;
}

/**
 * Generates plain-English title, description, and remedy action for a given deficiency.
 */
export function generateDeficiencyExplanation(params: {
  deficiencyType: DeficiencyType;
  documentType?: DocumentType | null;
  ruleDescription?: string;
  customDescription?: string;
}): GeneratedExplanation {
  const { deficiencyType, documentType, ruleDescription, customDescription } = params;
  const docLabel = documentType ? DOCUMENT_TYPE_LABELS[documentType] : "Required Document";

  if (customDescription && customDescription.trim().length > 0) {
    return {
      title: getDeficiencyTitle(deficiencyType, docLabel),
      description: customDescription.trim(),
      remedyAction: getRemedyAction(deficiencyType),
    };
  }

  switch (deficiencyType) {
    case "DOCUMENT_MISSING":
      return {
        title: `Missing ${docLabel}`,
        description: `Your application requires a valid ${docLabel} to complete verification. Please upload a clear copy of this document.`,
        remedyAction: "UPLOAD_DOCUMENT",
      };

    case "DOCUMENT_ILLEGIBLE":
      return {
        title: `Unclear / Illegible ${docLabel}`,
        description: `The submitted ${docLabel} could not be clearly read during verification. Please upload a clear, high-resolution scan or photo where all text and seals are legible.`,
        remedyAction: "REPLACE_DOCUMENT",
      };

    case "DOCUMENT_EXPIRED":
      return {
        title: `Expired Validity for ${docLabel}`,
        description: `The submitted ${docLabel} has expired or is outside the permissible validity window. Please upload a currently valid certificate issued by the competent revenue authority.`,
        remedyAction: "REPLACE_DOCUMENT",
      };

    case "DATA_MISMATCH":
      return {
        title: `Data Discrepancy on ${docLabel}`,
        description:
          ruleDescription ||
          `The details on your submitted ${docLabel} differ from the information declared in your application. Please review and upload a corrected document or provide a written clarification.`,
        remedyAction: "PROVIDE_CLARIFICATION",
      };

    case "AUTHORITY_SEAL_MISSING":
      return {
        title: `Issuing Authority Seal/Signature Required on ${docLabel}`,
        description: `The submitted ${docLabel} does not clearly show the official seal or digital signature of the competent issuing authority. Please upload a complete certified copy.`,
        remedyAction: "REPLACE_DOCUMENT",
      };

    case "CUSTOM":
    default:
      return {
        title: `Action Required: ${docLabel}`,
        description:
          ruleDescription ||
          `Please review the requested requirement for your ${docLabel} and submit the necessary clarification or updated document.`,
        remedyAction: "PROVIDE_CLARIFICATION",
      };
  }
}

function getDeficiencyTitle(type: DeficiencyType, docLabel: string): string {
  switch (type) {
    case "DOCUMENT_MISSING":
      return `Missing ${docLabel}`;
    case "DOCUMENT_ILLEGIBLE":
      return `Unclear / Illegible ${docLabel}`;
    case "DOCUMENT_EXPIRED":
      return `Expired Validity for ${docLabel}`;
    case "DATA_MISMATCH":
      return `Data Discrepancy on ${docLabel}`;
    case "AUTHORITY_SEAL_MISSING":
      return `Official Seal Required on ${docLabel}`;
    default:
      return `Action Required: ${docLabel}`;
  }
}

function getRemedyAction(type: DeficiencyType): RemedyAction {
  switch (type) {
    case "DOCUMENT_MISSING":
      return "UPLOAD_DOCUMENT";
    case "DOCUMENT_ILLEGIBLE":
    case "DOCUMENT_EXPIRED":
    case "AUTHORITY_SEAL_MISSING":
      return "REPLACE_DOCUMENT";
    case "DATA_MISMATCH":
      return "PROVIDE_CLARIFICATION";
    default:
      return "PROVIDE_CLARIFICATION";
  }
}

/**
 * Maps a Prisma Deficiency entity to OfficerDeficiencyDTO with rich explanations.
 */
export function toOfficerDeficiencyDTO(d: any): OfficerDeficiencyDTO {
  const explanation = generateDeficiencyExplanation({
    deficiencyType: d.deficiencyType,
    documentType: d.documentType,
    customDescription: d.description,
  });

  return {
    id: d.id,
    caseDossierId: d.caseDossierId,
    applicationId: d.caseDossier?.applicationId || d.caseDossier?.application?.id || "",
    deficiencyType: d.deficiencyType,
    title: explanation.title,
    description: d.description || explanation.description,
    remedyAction: explanation.remedyAction,
    documentType: d.documentType,
    targetDocumentId: d.targetDocumentId,
    targetDocumentFilename: d.targetDocument?.originalFilename || null,
    ruleResultId: d.ruleResultId,
    ruleKey: d.ruleResult?.ruleKey || null,
    status: d.status,
    recheckStatus: d.recheckStatus,
    recheckAt: d.recheckAt,
    responseDeadline: d.responseDeadline,
    isExpired: isDeficiencyExpired(d.responseDeadline),
    applicantResponseText: d.applicantResponseText,
    applicantRespondedAt: d.applicantRespondedAt,
    resolvedAt: d.resolvedAt,
    issuedAt: d.issuedAt,
    officerResolutionRemark: d.officerResolutionRemark,
    issuedBy: {
      id: d.issuedBy?.id || d.issuedById || "",
      name: d.issuedBy?.name || "Verification Officer",
      email: d.issuedBy?.email || "",
      role: d.issuedBy?.role || "VERIFICATION_OFFICER",
    },
    resolutionDocuments: (d.resolutionDocuments || []).map((rd: any) => ({
      id: rd.id,
      originalFilename: rd.originalFilename,
      version: rd.version,
      uploadedAt: rd.uploadedAt,
      processingStatus: rd.processingStatus,
    })),
  };
}
