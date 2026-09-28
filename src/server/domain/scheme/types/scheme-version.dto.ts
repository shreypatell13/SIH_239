import { FormSchema } from "./form-schema.types";
import { DocumentRequirementsSchema } from "./document-requirements.types";
import { EligibilityRulesSchema } from "./eligibility-rules.types";
import { WorkflowConfig } from "./workflow-config.types";
import { SelectionConfig } from "./selection-config.types";

/**
 * Scheme & SchemeVersion Data Transfer Objects
 * Phase 2D: Scheme Studio & Declarative Configuration Engine
 */

export interface SchemeSummaryDTO {
  id: string;
  code: string;
  name: string;
  description: string;
  ministry: string;
  isActive: boolean;
  activeVersionNumber?: number;
  activeVersionId?: string;
  totalVersionsCount: number;
  applicationOpenDate?: string | null;
  applicationDeadline?: string | null;
}

export interface SchemeDetailDTO extends SchemeSummaryDTO {
  versions: SchemeVersionSummaryDTO[];
}

export interface SchemeVersionSummaryDTO {
  id: string;
  schemeId: string;
  versionNumber: number;
  effectiveFrom: string;
  effectiveTo?: string | null;
  isActive: boolean;
  publishedAt: string;
  publishedByName?: string | null;
  applicationOpenDate?: string | null;
  applicationDeadline?: string | null;
  totalApplicationsCount?: number;
}

export interface SchemeVersionDTO extends SchemeVersionSummaryDTO {
  formSchema: FormSchema;
  documentRequirements: DocumentRequirementsSchema;
  eligibilityRules: EligibilityRulesSchema;
  workflowConfig?: WorkflowConfig | null;
  selectionConfig?: SelectionConfig | null;
}

export interface CreateSchemeDTO {
  code: string; // e.g. "NFST", "NOS"
  name: string;
  description: string;
  ministry?: string;
}

export interface PublishSchemeVersionDTO {
  formSchema: FormSchema;
  documentRequirements: DocumentRequirementsSchema;
  eligibilityRules: EligibilityRulesSchema;
  workflowConfig?: WorkflowConfig | null;
  selectionConfig?: SelectionConfig | null;
  applicationOpenDate?: string | null;
  applicationDeadline?: string | null;
}

export interface ValidationErrorItem {
  field: string;
  message: string;
  section:
    | "formSchema"
    | "documentRequirements"
    | "eligibilityRules"
    | "workflowConfig"
    | "selectionConfig"
    | "general";
  severity: "ERROR" | "WARNING";
}

export interface ValidationResultDTO {
  isValid: boolean;
  errors: ValidationErrorItem[];
  warnings: ValidationErrorItem[];
  summary: {
    sectionsCount: number;
    fieldsCount: number;
    mandatoryDocsCount: number;
    rulesCount: number;
    stagesCount: number;
  };
}
