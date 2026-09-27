export type CaseStage =
  | "APPLICATION_DRAFT"
  | "SUBMITTED"
  | "AUTOMATED_VERIFICATION"
  | "OFFICER_REVIEW"
  | "DEFICIENCY_PENDING"
  | "COMMITTEE_SELECTION"
  | "SANCTIONED"
  | "REJECTED";

export interface StateTransitionResult {
  fromStage: CaseStage;
  toStage: CaseStage;
  isAllowed: boolean;
  reason?: string;
}

export interface IWorkflowService {
  canTransition(from: CaseStage, to: CaseStage): boolean;
  transitionCase(
    caseId: string,
    toStage: CaseStage,
    actorId: string
  ): Promise<StateTransitionResult>;
}

export class WorkflowService implements IWorkflowService {
  private allowedTransitions: Record<CaseStage, CaseStage[]> = {
    APPLICATION_DRAFT: ["SUBMITTED"],
    SUBMITTED: ["AUTOMATED_VERIFICATION"],
    AUTOMATED_VERIFICATION: ["OFFICER_REVIEW", "DEFICIENCY_PENDING"],
    OFFICER_REVIEW: ["DEFICIENCY_PENDING", "COMMITTEE_SELECTION", "REJECTED"],
    DEFICIENCY_PENDING: ["AUTOMATED_VERIFICATION", "OFFICER_REVIEW"], // Targeted recheck loop
    COMMITTEE_SELECTION: ["SANCTIONED", "REJECTED"],
    SANCTIONED: [],
    REJECTED: [],
  };

  canTransition(from: CaseStage, to: CaseStage): boolean {
    const targets = this.allowedTransitions[from] || [];
    return targets.includes(to);
  }

  async transitionCase(
    _caseId: string,
    toStage: CaseStage,
    _actorId: string
  ): Promise<StateTransitionResult> {
    // Stub: Implementation in Phase 2B
    return {
      fromStage: "SUBMITTED",
      toStage,
      isAllowed: true,
    };
  }
}

export const workflowService = new WorkflowService();
