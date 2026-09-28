import { z } from "zod";
import { CaseStage, CaseState } from "@prisma/client";

export const OfficerQueueFilterSchema = z.object({
  schemeCode: z.string().optional(),
  currentStage: z.nativeEnum(CaseStage).optional(),
  currentState: z.nativeEnum(CaseState).optional(),
  assessment: z
    .enum(["ELIGIBLE_ASSESSED", "NOT_ELIGIBLE_ASSESSED", "REVIEW_REQUIRED", "UNASSESSED"])
    .optional(),
  hasDeficiencies: z.coerce.boolean().optional(),
  search: z.string().optional(),
  assignedToMe: z.coerce.boolean().optional(),
  sortBy: z
    .enum(["oldestSubmission", "newestSubmission", "recentlyUpdated", "actionRequiredFirst"])
    .optional()
    .default("oldestSubmission"),
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(20),
});

export const AddOfficerNoteSchema = z.object({
  note: z
    .string()
    .trim()
    .min(3, "Officer review note must be at least 3 characters long.")
    .max(2000, "Officer review note cannot exceed 2000 characters."),
});

export const TransitionCaseStageSchema = z.object({
  targetStage: z.enum(
    [
      CaseStage.OFFICER_REVIEW,
      CaseStage.DEFICIENCY_PENDING,
      CaseStage.COMMITTEE_SELECTION,
      CaseStage.REJECTED,
    ],
    {
      errorMap: () => ({ message: "Invalid target stage for officer workflow transition." }),
    }
  ),
  remark: z
    .string()
    .trim()
    .min(5, "A justification remark of at least 5 characters is required for stage transitions.")
    .max(1000),
  blocker: z.string().trim().max(500).optional().nullable(),
  nextAction: z.string().trim().max(500).optional(),
});
