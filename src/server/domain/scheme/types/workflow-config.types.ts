import { CaseStage, UserRole } from "@prisma/client";

/**
 * Workflow Configuration DSL Types
 * Phase 2D: Scheme Studio & Declarative Configuration Engine
 */

export type AssignableActor = UserRole | "SYSTEM" | "COMMITTEE";

export interface WorkflowStage {
  stageKey: CaseStage;
  label: string;
  order: number;
  slaDays: number; // Target SLA turnaround in days
  assignableRoles: AssignableActor[]; // Which roles/actors can act on cases in this stage
  autoAdvanceOnPass?: boolean; // If all automated checks pass, advance automatically
  requiresCommittee?: boolean; // Whether committee review is mandatory
}

export interface WorkflowConfig {
  version: "1.0";
  stages: WorkflowStage[];
  deficiencyResponseWindowDays: number; // SLA days granted to applicant to remediate
  maxResubmissionAttempts: number; // Maximum deficiency re-upload cycles before escalation
  allowWithdrawal: boolean; // Whether applicant can withdraw application
}
