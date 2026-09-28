import { z } from "zod";
import { CaseStage, UserRole } from "@prisma/client";

/**
 * Zod Validators for Workflow Configuration DSL
 * Phase 2D: Scheme Studio & Declarative Configuration Engine
 */

export const CaseStageEnumSchema = z.nativeEnum(CaseStage);

export const AssignableActorSchema = z.enum([
  "APPLICANT",
  "VERIFICATION_OFFICER",
  "SCHEME_ADMIN",
  "OPERATIONS_DIRECTOR",
  "SYSTEM",
  "COMMITTEE",
]);

export const WorkflowStageItemSchema = z.object({
  stageKey: CaseStageEnumSchema,
  label: z.string().min(1, "Stage label is required"),
  order: z.number().int().nonnegative(),
  slaDays: z.number().int().positive("slaDays must be positive"),
  assignableRoles: z
    .array(AssignableActorSchema)
    .min(1, "At least one assignable role must be specified for each stage"),
  autoAdvanceOnPass: z.boolean().optional(),
  requiresCommittee: z.boolean().optional(),
});

export const WorkflowConfigValidator = z.object({
  version: z.literal("1.0"),
  stages: z.array(WorkflowStageItemSchema).min(2, "Workflow must contain at least 2 stages"),
  deficiencyResponseWindowDays: z
    .number()
    .int()
    .positive("deficiencyResponseWindowDays must be positive")
    .max(90, "Deficiency response window cannot exceed 90 days"),
  maxResubmissionAttempts: z
    .number()
    .int()
    .positive("maxResubmissionAttempts must be at least 1")
    .max(10, "maxResubmissionAttempts cannot exceed 10"),
  allowWithdrawal: z.boolean().default(true),
});
