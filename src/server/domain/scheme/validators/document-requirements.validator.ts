import { z } from "zod";
import { DocumentType } from "@prisma/client";

/**
 * Zod Validators for Document Requirements DSL
 * Phase 2D: Scheme Studio & Declarative Configuration Engine
 */

export const DocumentTypeEnumSchema = z.nativeEnum(DocumentType);

export const DocumentRequirementLevelSchema = z.enum(["MANDATORY", "CONDITIONAL", "OPTIONAL"]);

export const DocumentConditionSchema = z.object({
  fieldId: z.string().min(1, "fieldId is required"),
  triggerWhenValue: z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.array(z.string()),
    z.array(z.number()),
  ]),
});

export const DocumentRequirementItemSchema = z.object({
  id: z.string().min(1, "Requirement ID is required"),
  documentType: DocumentTypeEnumSchema,
  label: z.string().min(1, "Document label is required"),
  description: z.string().min(1, "Document description is required"),
  level: DocumentRequirementLevelSchema,
  condition: DocumentConditionSchema.optional(),
  allowedMimeTypes: z
    .array(z.string())
    .min(1, "At least one allowed MIME type is required")
    .refine(
      (mimes) =>
        mimes.every((m) =>
          [
            "application/pdf",
            "image/jpeg",
            "image/jpg",
            "image/png",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          ].includes(m)
        ),
      "Invalid or unsupported MIME type specified"
    ),
  maxFileSizeMb: z
    .number()
    .positive("maxFileSizeMb must be positive")
    .max(50, "maxFileSizeMb cannot exceed 50MB"),
  maxPages: z.number().int().positive().optional(),
  validityWindowMonths: z.number().int().positive().optional(),
  issuerCriteria: z.string().optional(),
  requiresExtraction: z.boolean().optional(),
});

export const DocumentRequirementsValidator = z.object({
  version: z.literal("1.0"),
  requirements: z
    .array(DocumentRequirementItemSchema)
    .min(1, "At least one document requirement must be specified"),
});
