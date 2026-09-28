import {
  Application,
  CaseDossier,
  CaseStage,
  CaseState,
  ResponsibleActor,
  Scheme,
} from "@prisma/client";
import { ExplainableCaseStatusDTO } from "./types/application.dto";

const STAGE_LABELS: Record<CaseStage, string> = {
  DRAFT: "Draft Application",
  SUBMITTED: "Application Received",
  AUTOMATED_VERIFICATION: "Automated Verification",
  OFFICER_REVIEW: "Officer Verification",
  DEFICIENCY_PENDING: "Deficiency Resolution Required",
  COMMITTEE_SELECTION: "Selection Committee Review",
  SANCTIONED: "Scholarship Sanctioned",
  REJECTED: "Application Not Selected",
  WITHDRAWN: "Application Withdrawn",
};

const STATE_LABELS: Record<CaseState, string> = {
  PENDING: "Pending Next Step",
  IN_PROGRESS: "In Progress",
  ACTION_REQUIRED: "Action Required by Candidate",
  COMPLETED: "Stage Completed",
  BLOCKED: "Processing Blocked",
  ESCALATED: "Escalated for Nodal Review",
};

const ACTOR_LABELS: Record<ResponsibleActor, string> = {
  APPLICANT: "You (Applicant)",
  VERIFICATION_OFFICER: "Verification Officer",
  SYSTEM: "TribalScholar AI Automation",
  COMMITTEE: "Ministry Selection Committee",
};

export function buildExplainableCaseStatus(
  application: Application & {
    schemeVersion?: { scheme: Scheme };
    caseDossier?: CaseDossier | null;
  }
): ExplainableCaseStatusDTO {
  const caseDossier = application.caseDossier;
  const scheme = application.schemeVersion?.scheme;

  const stage =
    caseDossier?.currentStage ||
    (application.status === "SUBMITTED" ? CaseStage.SUBMITTED : CaseStage.DRAFT);
  const state = caseDossier?.currentState || CaseState.PENDING;
  const actor =
    caseDossier?.responsibleActor ||
    (application.status === "SUBMITTED" ? ResponsibleActor.SYSTEM : ResponsibleActor.APPLICANT);

  let nextAction = caseDossier?.nextAction;
  if (!nextAction) {
    if (stage === "DRAFT") {
      nextAction = "Complete the application form and upload required documents.";
    } else if (stage === "SUBMITTED") {
      nextAction = "Automated verification underway.";
    } else {
      nextAction = "Awaiting review.";
    }
  }

  return {
    applicationId: application.id,
    applicationNumber: application.applicationNumber,
    caseId: caseDossier?.id || `draft_case_${application.id}`,
    caseNumber: caseDossier?.caseNumber || `DRAFT-${application.applicationNumber}`,
    schemeCode: scheme?.code || "SCHEME",
    schemeName: scheme?.name || "Tribal Welfare Scholarship",
    status: application.status,
    stage,
    stageLabel: STAGE_LABELS[stage] || stage,
    state,
    stateLabel: STATE_LABELS[state] || state,
    blocker: caseDossier?.blocker || null,
    responsibleActor: actor,
    responsibleActorLabel: ACTOR_LABELS[actor] || actor,
    nextAction,
    deadline: caseDossier?.deadline ? caseDossier.deadline.toISOString() : null,
    submittedAt: application.submittedAt ? application.submittedAt.toISOString() : null,
    updatedAt: application.updatedAt.toISOString(),
  };
}
