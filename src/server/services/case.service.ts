import { AuthenticatedUser } from "../auth/roles";

export interface CaseDossierSummary {
  caseId: string;
  applicationId: string;
  schemeCode: "NFST" | "NOS";
  applicantName: string;
  currentStage: string;
  currentState: string;
  blocker: string | null;
  responsibleActor: string;
  nextAction: string;
  slaDaysRemaining: number;
}

export interface ICaseService {
  getCaseById(caseId: string, user: AuthenticatedUser): Promise<CaseDossierSummary | null>;
  listAssignedCases(user: AuthenticatedUser): Promise<CaseDossierSummary[]>;
  updateCaseState(
    caseId: string,
    nextState: string,
    reason: string,
    user: AuthenticatedUser
  ): Promise<CaseDossierSummary>;
}

export class CaseService implements ICaseService {
  async getCaseById(caseId: string, _user: AuthenticatedUser): Promise<CaseDossierSummary | null> {
    // Stub: Implementation in Phase 2B/2I
    return {
      caseId,
      applicationId: `app_${caseId}`,
      schemeCode: "NFST",
      applicantName: "Ramesh Kumar Meena",
      currentStage: "DOCUMENT_VERIFICATION",
      currentState: "IN_PROGRESS",
      blocker: null,
      responsibleActor: "OFFICER",
      nextAction: "Complete cross-document consistency check",
      slaDaysRemaining: 4,
    };
  }

  async listAssignedCases(_user: AuthenticatedUser): Promise<CaseDossierSummary[]> {
    // Stub: Implementation in Phase 2I
    return [];
  }

  async updateCaseState(
    caseId: string,
    nextState: string,
    _reason: string,
    user: AuthenticatedUser
  ): Promise<CaseDossierSummary> {
    // Stub: Implementation in Phase 2I
    const current = await this.getCaseById(caseId, user);
    if (!current) throw new Error(`Case ${caseId} not found`);
    return { ...current, currentState: nextState };
  }
}

export const caseService = new CaseService();
