import { DocumentType } from "@prisma/client";

/**
 * Document Requirements Matrix DSL Types
 * Phase 2D: Scheme Studio & Declarative Configuration Engine
 */

export type DocumentRequirementLevel = "MANDATORY" | "CONDITIONAL" | "OPTIONAL";

export interface DocumentCondition {
  /** Field ID from FormSchema whose value triggers this document requirement */
  fieldId: string;
  triggerWhenValue: string | string[] | boolean | number;
}

export interface DocumentRequirement {
  id: string; // Unique requirement ID e.g. "req_caste_cert"
  documentType: DocumentType;
  label: string;
  description: string;
  level: DocumentRequirementLevel;
  condition?: DocumentCondition;
  allowedMimeTypes: string[]; // e.g. ["application/pdf", "image/jpeg", "image/png"]
  maxFileSizeMb: number; // e.g. 5
  maxPages?: number;
  validityWindowMonths?: number; // e.g. 36 (certificate must be issued within last N months)
  issuerCriteria?: string; // Human-readable guidance e.g. "Issued by Competent Revenue Authority"
  requiresExtraction?: boolean; // Whether OCR extraction is expected for this document
}

export interface DocumentRequirementsSchema {
  version: "1.0";
  requirements: DocumentRequirement[];
}
