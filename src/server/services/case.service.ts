import { CaseStage, CaseState } from "@prisma/client";
import { AuthenticatedUser, assertActiveUser } from "../auth/roles";
import { assertCanAccessCase } from "../auth/case-access";
import { caseRepository } from "../repositories/case.repository";

export interface CaseDossierSummary {
  caseId: string;
  applicationId: string;
  schemeCode: string;
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
    nextState: CaseState,
    reason: string,
    user: AuthenticatedUser
  ): Promise<CaseDossierSummary>;
}

export class CaseService implements ICaseService {
  async getCaseById(caseId: string, user: AuthenticatedUser): Promise<CaseDossierSummary | null> {
    assertActiveUser(user);
    const c = await caseRepository.findById(caseId);
    if (!c) return null;
    assertCanAccessCase(user, c, "read");

    return {
      caseId: c.id,
      applicationId: c.applicationId,
      schemeCode: c.application.schemeVersion.scheme.code,
      applicantName: c.application.applicantProfile.user.name || "Applicant",
      currentStage: c.currentStage,
      currentState: c.currentState,
      blocker: c.blocker,
      responsibleActor: c.responsibleActor,
      nextAction: c.nextAction,
      slaDaysRemaining: 5,
    };
  }

  async listAssignedCases(user: AuthenticatedUser): Promise<CaseDossierSummary[]> {
    assertActiveUser(user);
    if (user.role !== "VERIFICATION_OFFICER")
      throw new Error("Forbidden: Officer case queue required.");
    const cases = await caseRepository.listAssignedCases(user.id);
    return cases.map((c) => ({
      caseId: c.id,
      applicationId: c.applicationId,
      schemeCode: c.application.schemeVersion.scheme.code,
      applicantName: c.application.applicantProfile.user.name || "Applicant",
      currentStage: c.currentStage,
      currentState: c.currentState,
      blocker: c.blocker,
      responsibleActor: c.responsibleActor,
      nextAction: c.nextAction,
      slaDaysRemaining: 5,
    }));
  }

  async updateCaseState(
    caseId: string,
    nextState: CaseState,
    _reason: string,
    user: AuthenticatedUser
  ): Promise<CaseDossierSummary> {
    assertActiveUser(user);
    const current = await caseRepository.findById(caseId);
    if (!current) throw new Error(`Case ${caseId} not found`);
    assertCanAccessCase(user, current, "act");

    const updated = await caseRepository.updateStageAndState(
      current.id,
      current.currentStage,
      nextState,
      current.blocker,
      current.nextAction
    );

    return {
      caseId: updated.id,
      applicationId: updated.applicationId,
      schemeCode: current.application.schemeVersion.scheme.code,
      applicantName: current.application.applicantProfile.user.name || "Applicant",
      currentStage: updated.currentStage,
      currentState: updated.currentState,
      blocker: updated.blocker,
      responsibleActor: updated.responsibleActor,
      nextAction: updated.nextAction,
      slaDaysRemaining: 5,
    };
  }
}

export const caseService = new CaseService();
