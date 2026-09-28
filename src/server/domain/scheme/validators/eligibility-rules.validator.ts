import { z } from "zod";
import { DocumentType } from "@prisma/client";

/**
 * Zod Validators for Eligibility Rule DSL
 * Phase 2D: Scheme Studio & Declarative Configuration Engine
 */

export const RuleOperatorSchema = z.enum([
  "EQUALS",
  "NOT_EQUALS",
  "LESS_THAN",
  "LESS_THAN_OR_EQUALS",
  "GREATER_THAN",
  "GREATER_THAN_OR_EQUALS",
  "IN",
  "NOT_IN",
  "MATCHES_REGEX",
  "IS_PRESENT",
  "WITHIN_MONTHS",
]);

export const RuleSourceSchema = z.enum(["FORM_DATA", "EXTRACTED_FIELD", "COMPUTED"]);

export const RuleSeveritySchema = z.enum(["HARD_FAIL", "SOFT_FLAG"]);

export const StRelaxationSchema = z.object({
  addToThreshold: z.number().finite("addToThreshold must be a valid number"),
});

export const EligibilityRuleItemSchema = z.object({
  ruleKey: z
    .string()
    .min(1, "ruleKey is required")
    .regex(/^[A-Z][A-Z0-9_]*$/, "ruleKey must be SCREAMING_SNAKE_CASE (e.g. INCOME_CEILING)"),
  name: z.string().min(1, "Rule name is required"),
  description: z.string().min(1, "Rule description is required"),
  source: RuleSourceSchema,
  sourceField: z.string().min(1, "sourceField is required"),
  dependsOnFields: z.array(z.string().min(1)).optional(),
  dependsOnDocumentTypes: z.array(z.nativeEnum(DocumentType)).optional(),
  operator: RuleOperatorSchema,
  threshold: z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.array(z.string()),
    z.array(z.number()),
  ]),
  failureMessage: z.string().min(1, "failureMessage is required for explainability"),
  severity: RuleSeveritySchema,
  stRelaxation: StRelaxationSchema.optional(),
  isActive: z.boolean().default(true),
});

export const EligibilityRulesValidator = z.object({
  version: z.literal("1.0"),
  rules: z.array(EligibilityRuleItemSchema).min(1, "At least one eligibility rule is required"),
});
