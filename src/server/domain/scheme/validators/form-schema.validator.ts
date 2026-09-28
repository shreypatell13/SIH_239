import { z } from "zod";

/**
 * Zod Validators for Form Schema DSL
 * Phase 2D: Scheme Studio & Declarative Configuration Engine
 */

export const FieldTypeSchema = z.enum([
  "text",
  "number",
  "date",
  "email",
  "select",
  "multiselect",
  "textarea",
  "boolean",
]);

export const ConditionalVisibilitySchema = z.object({
  dependsOnField: z.string().min(1, "dependsOnField is required"),
  showWhenValue: z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.array(z.string()),
    z.array(z.number()),
  ]),
});

export const FieldValidationSchema = z.object({
  required: z.boolean().optional(),
  minLength: z.number().int().nonnegative().optional(),
  maxLength: z.number().int().positive().optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  pattern: z.string().optional(),
  patternMessage: z.string().optional(),
  allowedValues: z.array(z.string()).optional(),
});

export const FormFieldSchema = z.object({
  id: z
    .string()
    .min(1, "Field ID is required")
    .regex(
      /^[a-zA-Z][a-zA-Z0-9_]*$/,
      "Field ID must be camelCase/alphanumeric starting with a letter"
    ),
  label: z.string().min(1, "Field label is required"),
  type: FieldTypeSchema,
  placeholder: z.string().optional(),
  helpText: z.string().optional(),
  validation: FieldValidationSchema.default({}),
  conditionalVisibility: ConditionalVisibilitySchema.optional(),
  sectionId: z.string().min(1, "sectionId is required"),
  order: z.number().int().nonnegative(),
});

export const FormSectionSchema = z.object({
  id: z
    .string()
    .min(1, "Section ID is required")
    .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, "Section ID must be alphanumeric starting with a letter"),
  title: z.string().min(1, "Section title is required"),
  description: z.string().optional(),
  order: z.number().int().nonnegative(),
});

export const FormSchemaValidator = z.object({
  version: z.literal("1.0"),
  sections: z.array(FormSectionSchema).min(1, "At least one section is required in Form Schema"),
  fields: z.array(FormFieldSchema).min(1, "At least one field is required in Form Schema"),
});
