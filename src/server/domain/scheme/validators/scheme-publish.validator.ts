import { z } from "zod";
import { FormSchemaValidator } from "./form-schema.validator";
import { DocumentRequirementsValidator } from "./document-requirements.validator";
import { EligibilityRulesValidator } from "./eligibility-rules.validator";
import { WorkflowConfigValidator } from "./workflow-config.validator";
import { SelectionConfigValidator } from "./selection-config.validator";

/**
 * Top-level Zod Validators for Scheme CRUD and Version Publishing
 * Phase 2D: Scheme Studio & Declarative Configuration Engine
 */

export const CreateSchemeValidator = z.object({
  code: z
    .string()
    .min(2, "Scheme code must be at least 2 characters")
    .max(16, "Scheme code cannot exceed 16 characters")
    .regex(
      /^[A-Z0-9_-]+$/,
      "Scheme code must consist of uppercase alphanumeric characters, hyphens or underscores"
    ),
  name: z.string().min(3, "Scheme name must be at least 3 characters").max(200),
  description: z.string().min(10, "Scheme description must be at least 10 characters"),
  ministry: z.string().default("Ministry of Tribal Affairs"),
});

export const PublishSchemeVersionValidator = z.object({
  formSchema: FormSchemaValidator,
  documentRequirements: DocumentRequirementsValidator,
  eligibilityRules: EligibilityRulesValidator,
  workflowConfig: WorkflowConfigValidator.optional().nullable(),
  selectionConfig: SelectionConfigValidator.optional().nullable(),
  applicationOpenDate: z
    .string()
    .datetime({ offset: true })
    .optional()
    .nullable()
    .or(z.string().optional().nullable()),
  applicationDeadline: z
    .string()
    .datetime({ offset: true })
    .optional()
    .nullable()
    .or(z.string().optional().nullable()),
});
