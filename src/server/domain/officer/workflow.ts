import { CaseStage } from "@prisma/client";

const OFFICER_TRANSITIONS: Partial<Record<CaseStage, CaseStage[]>> = {
  [CaseStage.SUBMITTED]: [CaseStage.OFFICER_REVIEW, CaseStage.DEFICIENCY_PENDING],
  [CaseStage.AUTOMATED_VERIFICATION]: [CaseStage.OFFICER_REVIEW, CaseStage.DEFICIENCY_PENDING],
  [CaseStage.OFFICER_REVIEW]: [
    CaseStage.DEFICIENCY_PENDING,
    CaseStage.COMMITTEE_SELECTION,
    CaseStage.REJECTED,
  ],
  [CaseStage.DEFICIENCY_PENDING]: [CaseStage.OFFICER_REVIEW],
};

export function canOfficerTransition(from: CaseStage, to: CaseStage): boolean {
  return OFFICER_TRANSITIONS[from]?.includes(to) ?? false;
}
