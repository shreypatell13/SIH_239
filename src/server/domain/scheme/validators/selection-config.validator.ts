import { z } from "zod";

/**
 * Zod Validators for Selection & Grant Configuration DSL
 * Phase 2D: Scheme Studio & Declarative Configuration Engine
 */

export const FinancialFrequencySchema = z.enum(["MONTHLY", "ANNUAL", "ONE_TIME"]);

export const FinancialComponentSchema = z.object({
  id: z.string().min(1, "Component ID is required"),
  label: z.string().min(1, "Component label is required"),
  amountInr: z.number().nonnegative("amountInr must be non-negative"),
  frequency: FinancialFrequencySchema,
  description: z.string().optional(),
});

export const QuotaItemSchema = z.object({
  id: z.string().min(1, "Quota ID is required"),
  label: z.string().min(1, "Quota label is required"),
  percentage: z
    .number()
    .positive("percentage must be positive")
    .max(100, "percentage cannot exceed 100%"),
  seatsCount: z.number().int().nonnegative().optional(),
});

export const MeritBasisSchema = z.enum(["ACADEMIC_SCORE", "INCOME_INVERTED", "COMPOSITE"]);

export const SelectionConfigValidator = z.object({
  version: z.literal("1.0"),
  maxAwardees: z.number().int().positive("maxAwardees must be a positive integer"),
  quotas: z.array(QuotaItemSchema).optional(),
  financialComponents: z
    .array(FinancialComponentSchema)
    .min(1, "At least one financial component must be configured"),
  meritBasis: MeritBasisSchema,
  guidelinesNotes: z.string().optional(),
});
