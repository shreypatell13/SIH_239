import { z } from "zod";
import {
  DisbursementStatus,
  RenewalStatus,
  ScholarStatus,
  DisbursementRecordStatus,
} from "@prisma/client";

export const CreateScholarSchema = z.object({
  caseDossierId: z.string().uuid("Invalid Case Dossier ID"),
  awardedAmount: z.number().positive("Awarded amount must be greater than zero"),
  tenureStartDate: z.string().datetime("Tenure start date must be a valid ISO timestamp"),
  tenureEndDate: z.string().datetime("Tenure end date must be a valid ISO timestamp"),
  researchInstitution: z.string().min(2, "Research institution is required").optional(),
  supervisorName: z.string().min(2, "Supervisor name is required").optional(),
  fellowshipType: z.string().default("JRF"),
  totalTenureYears: z.number().int().min(1).max(7).default(3),
  remarks: z.string().max(500).optional(),
});

export const CreateRenewalSchema = z.object({
  postSelectionRecordId: z.string().uuid("Invalid Scholar Record ID"),
  renewalCycle: z.number().int().min(1).max(7),
  academicYear: z.string().min(4, "Academic year is required"), // e.g. "2026-2027"
  submissionDate: z.string().datetime().optional(),
  progressSummary: z.string().max(2000).optional(),
  publicationsCount: z.number().int().min(0).default(0),
  conferencesAttended: z.number().int().min(0).default(0),
  supervisorRecommendation: z.enum(["RECOMMENDED", "NOT_RECOMMENDED", "CONDITIONAL"]).optional(),
  supervisorRemarks: z.string().max(1000).optional(),
});

export const SubmitRenewalSchema = z.object({
  progressSummary: z.string().min(10, "Progress summary must be at least 10 characters"),
  publicationsCount: z.number().int().min(0).default(0),
  conferencesAttended: z.number().int().min(0).default(0),
  supervisorRecommendation: z.enum(["RECOMMENDED", "NOT_RECOMMENDED", "CONDITIONAL"]),
  supervisorRemarks: z.string().max(1000).optional(),
});

export const ReviewRenewalSchema = z.object({
  action: z.enum(["APPROVE", "REQUEST_DEFICIENCY", "REJECT"]),
  officerRemarks: z
    .string()
    .min(5, "Officer remarks are mandatory and must be at least 5 characters"),
  deficiencyDetails: z.string().max(1000).optional(),
  recheckRequired: z.boolean().default(false),
});

export const CreateDisbursementSchema = z.object({
  postSelectionRecordId: z.string().uuid("Invalid Scholar Record ID"),
  installmentNumber: z.number().int().min(1).max(10),
  financialYear: z.string().min(4, "Financial year is required"),
  amount: z.number().positive("Amount must be positive"),
  scheduledDate: z.string().datetime().optional(),
  remarks: z.string().max(500).optional(),
});

export const UpdateDisbursementSchema = z.object({
  status: z.nativeEnum(DisbursementRecordStatus),
  pfmsReference: z.string().min(3).optional(),
  disbursedAt: z.string().datetime().optional(),
  remarks: z.string().max(500).optional(),
});

export const ScholarFilterQuerySchema = z.object({
  search: z.string().optional(),
  schemeCode: z.string().optional(),
  scholarStatus: z.nativeEnum(ScholarStatus).optional(),
  disbursementStatus: z.nativeEnum(DisbursementStatus).optional(),
  fellowshipType: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export const RenewalFilterQuerySchema = z.object({
  scholarId: z.string().uuid().optional(),
  schemeCode: z.string().optional(),
  status: z.nativeEnum(RenewalStatus).optional(),
  academicYear: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export const DisbursementFilterQuerySchema = z.object({
  scholarId: z.string().uuid().optional(),
  schemeCode: z.string().optional(),
  status: z.nativeEnum(DisbursementRecordStatus).optional(),
  financialYear: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});
