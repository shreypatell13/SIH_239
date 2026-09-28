import { z } from "zod";
import { CaseStage, CaseState, DeficiencyType, DocumentType } from "@prisma/client";

export const OperationsFilterQuerySchema = z
  .object({
    schemeCode: z.string().optional(),
    schemeVersionId: z.string().optional(),
    stage: z.nativeEnum(CaseStage).optional(),
    state: z.nativeEnum(CaseState).optional(),
    fromDate: z
      .string()
      .datetime({ offset: true })
      .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/))
      .optional(),
    toDate: z
      .string()
      .datetime({ offset: true })
      .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/))
      .optional(),
  })
  .superRefine((value, context) => {
    if (value.fromDate && value.toDate && new Date(value.fromDate) > new Date(value.toDate)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["toDate"],
        message: "toDate must be on or after fromDate",
      });
    }
  });

export const DrillDownCasesQuerySchema = z.object({
  schemeCode: z.string().optional(),
  schemeVersionId: z.string().optional(),
  stage: z.nativeEnum(CaseStage).optional(),
  state: z.nativeEnum(CaseState).optional(),
  agingBucket: z.enum(["DAYS_0_TO_2", "DAYS_3_TO_7", "DAYS_8_TO_14", "DAYS_15_PLUS"]).optional(),
  assignedOfficerId: z.string().min(1).optional(),
  hasOpenDeficienciesOnly: z
    .boolean()
    .optional()
    .or(
      z
        .string()
        .optional()
        .transform((value) => value === "true" || value === "1")
    ),
  officerAttentionOnly: z
    .boolean()
    .optional()
    .or(
      z
        .string()
        .optional()
        .transform((value) => value === "true" || value === "1")
    ),
  completedOnly: z
    .boolean()
    .optional()
    .or(
      z
        .string()
        .optional()
        .transform((value) => value === "true" || value === "1")
    ),
  underVerificationOnly: z
    .boolean()
    .optional()
    .or(
      z
        .string()
        .optional()
        .transform((value) => value === "true" || value === "1")
    ),
  deficiencyType: z.nativeEnum(DeficiencyType).optional(),
  documentType: z.nativeEnum(DocumentType).optional(),
  unassignedOnly: z
    .boolean()
    .optional()
    .or(
      z
        .string()
        .optional()
        .transform((val) => val === "true" || val === "1")
    ),
  blockedOnly: z
    .boolean()
    .optional()
    .or(
      z
        .string()
        .optional()
        .transform((val) => val === "true" || val === "1")
    ),
  search: z.string().optional(),
  page: z.preprocess((value) => (value === undefined ? 1 : Number(value)), z.number().int().min(1)),
  limit: z.preprocess(
    (value) => (value === undefined ? 20 : Number(value)),
    z.number().int().min(1).max(100)
  ),
});

export type OperationsFilterQuery = z.infer<typeof OperationsFilterQuerySchema>;
export interface DrillDownCasesQuery {
  schemeCode?: string;
  schemeVersionId?: string;
  stage?: CaseStage;
  state?: CaseState;
  agingBucket?: "DAYS_0_TO_2" | "DAYS_3_TO_7" | "DAYS_8_TO_14" | "DAYS_15_PLUS";
  assignedOfficerId?: string;
  hasOpenDeficienciesOnly?: boolean;
  officerAttentionOnly?: boolean;
  completedOnly?: boolean;
  underVerificationOnly?: boolean;
  deficiencyType?: DeficiencyType;
  documentType?: DocumentType;
  unassignedOnly?: boolean;
  blockedOnly?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}
