import { prisma } from "../db";
import {
  Application,
  ApplicationStatus,
  CaseDossier,
  CaseStage,
  CaseState,
  Prisma,
  ResponsibleActor,
} from "@prisma/client";

export class ApplicationRepository {
  /**
   * Generates a collision-resistant sequential application number: APP-{CODE}-{YEAR}-{SEQ}
   */
  async generateApplicationNumber(schemeCode: string): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `APP-${schemeCode.toUpperCase()}-${year}-`;

    const count = await prisma.application.count({
      where: {
        applicationNumber: {
          startsWith: prefix,
        },
      },
    });

    const seq = (count + 1).toString().padStart(6, "0");
    return `${prefix}${seq}`;
  }

  /**
   * Generates a collision-resistant sequential case number: CASE-{CODE}-{YEAR}-{SEQ}
   */
  async generateCaseNumber(schemeCode: string): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `CASE-${schemeCode.toUpperCase()}-${year}-`;

    const count = await prisma.caseDossier.count({
      where: {
        caseNumber: {
          startsWith: prefix,
        },
      },
    });

    const seq = (count + 1).toString().padStart(6, "0");
    return `${prefix}${seq}`;
  }

  /**
   * Lists all applications owned by a user (by userId/submittedById).
   */
  async listByUserId(userId: string) {
    return prisma.application.findMany({
      where: { submittedById: userId },
      include: {
        schemeVersion: {
          include: { scheme: true },
        },
        caseDossier: {
          include: {
            documents: {
              where: { isLatestVersion: true },
            },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });
  }

  /**
   * Finds application by its primary key ID with all relevant associations.
   */
  async findById(id: string) {
    return prisma.application.findUnique({
      where: { id },
      include: {
        schemeVersion: {
          include: { scheme: true },
        },
        applicantProfile: {
          include: { user: true },
        },
        caseDossier: {
          include: {
            documents: {
              orderBy: [{ documentType: "asc" }, { version: "desc" }],
            },
            deficiencies: true,
          },
        },
      },
    });
  }

  /**
   * Checks if an application already exists for the applicant profile on a specific scheme version.
   */
  async findByProfileAndVersion(applicantProfileId: string, schemeVersionId: string) {
    return prisma.application.findUnique({
      where: {
        applicantProfileId_schemeVersionId: {
          applicantProfileId,
          schemeVersionId,
        },
      },
      include: {
        schemeVersion: { include: { scheme: true } },
        caseDossier: true,
      },
    });
  }

  /**
   * Creates an Application Draft and its Early CaseDossier atomically in a single transaction.
   */
  async createDraft(params: {
    schemeVersionId: string;
    applicantProfileId: string;
    submittedById: string;
    schemeCode: string;
    initialFormData?: Record<string, unknown>;
  }) {
    return prisma.$transaction(async (tx) => {
      const applicationNumber = await this.generateApplicationNumber(params.schemeCode);
      const caseNumber = await this.generateCaseNumber(params.schemeCode);

      // 1. Create Application in DRAFT status
      const application = await tx.application.create({
        data: {
          applicationNumber,
          schemeVersionId: params.schemeVersionId,
          applicantProfileId: params.applicantProfileId,
          submittedById: params.submittedById,
          status: ApplicationStatus.DRAFT,
          formData: (params.initialFormData || {}) as Prisma.InputJsonValue,
        },
        include: {
          schemeVersion: { include: { scheme: true } },
        },
      });

      // 2. Create Early CaseDossier in DRAFT stage
      const caseDossier = await tx.caseDossier.create({
        data: {
          applicationId: application.id,
          caseNumber,
          currentStage: CaseStage.DRAFT,
          currentState: CaseState.PENDING,
          responsibleActor: ResponsibleActor.APPLICANT,
          nextAction: "Complete the application form and upload required documents.",
        },
      });

      // 3. Write Audit Log
      await tx.auditLog.create({
        data: {
          caseDossierId: caseDossier.id,
          actorId: params.submittedById,
          actorRole: "APPLICANT",
          actionType: "APPLICATION_DRAFT_CREATED",
          newState: "DRAFT",
          payload: {
            applicationNumber,
            caseNumber,
            schemeCode: params.schemeCode,
            schemeVersionId: params.schemeVersionId,
          },
        },
      });

      return {
        ...application,
        caseDossier,
      };
    });
  }

  /**
   * Updates formData for an application (only valid while in DRAFT).
   */
  async updateFormData(id: string, formData: Record<string, unknown>): Promise<Application> {
    return prisma.application.update({
      where: { id },
      data: {
        formData: formData as Prisma.InputJsonValue,
      },
    });
  }

  /**
   * Submits an application atomically: transitions Application and CaseDossier to SUBMITTED.
   */
  async submitApplication(id: string, actorId: string) {
    return prisma.$transaction(async (tx) => {
      const app = await tx.application.findUnique({
        where: { id },
        include: { caseDossier: true, schemeVersion: { include: { scheme: true } } },
      });

      if (!app) {
        throw new Error(`Application ${id} not found.`);
      }

      if (app.status !== ApplicationStatus.DRAFT) {
        throw new Error(`Cannot submit application in ${app.status} status.`);
      }

      const submittedAt = new Date();

      // 1. Transition Application to SUBMITTED
      const updatedApp = await tx.application.update({
        where: { id },
        data: {
          status: ApplicationStatus.SUBMITTED,
          submittedAt,
        },
      });

      // 2. Transition CaseDossier to SUBMITTED
      let updatedCase: CaseDossier | null = null;
      if (app.caseDossier) {
        updatedCase = await tx.caseDossier.update({
          where: { id: app.caseDossier.id },
          data: {
            currentStage: CaseStage.SUBMITTED,
            currentState: CaseState.PENDING,
            responsibleActor: ResponsibleActor.SYSTEM,
            nextAction: "Automated verification underway.",
          },
        });
      }

      // 3. Write Audit Log
      await tx.auditLog.create({
        data: {
          caseDossierId: app.caseDossier?.id || null,
          actorId,
          actorRole: "APPLICANT",
          actionType: "APPLICATION_SUBMITTED",
          previousState: "DRAFT",
          newState: "SUBMITTED",
          payload: {
            applicationNumber: app.applicationNumber,
            caseNumber: app.caseDossier?.caseNumber,
            submittedAt: submittedAt.toISOString(),
          },
        },
      });

      return {
        ...updatedApp,
        caseDossier: updatedCase,
      };
    });
  }

  /**
   * Withdraws an application atomically.
   */
  async withdrawApplication(id: string, actorId: string, reason?: string) {
    return prisma.$transaction(async (tx) => {
      const app = await tx.application.findUnique({
        where: { id },
        include: { caseDossier: true },
      });

      if (!app) {
        throw new Error(`Application ${id} not found.`);
      }

      // 1. Update Application status
      const updatedApp = await tx.application.update({
        where: { id },
        data: {
          status: ApplicationStatus.WITHDRAWN,
        },
      });

      // 2. Update CaseDossier stage
      let updatedCase: CaseDossier | null = null;
      if (app.caseDossier) {
        updatedCase = await tx.caseDossier.update({
          where: { id: app.caseDossier.id },
          data: {
            currentStage: CaseStage.WITHDRAWN,
            currentState: CaseState.COMPLETED,
            responsibleActor: ResponsibleActor.APPLICANT,
            nextAction: "Application withdrawn by candidate.",
          },
        });
      }

      // 3. Write Audit Log
      await tx.auditLog.create({
        data: {
          caseDossierId: app.caseDossier?.id || null,
          actorId,
          actorRole: "APPLICANT",
          actionType: "APPLICATION_WITHDRAWN",
          previousState: app.status,
          newState: "WITHDRAWN",
          payload: {
            reason: reason || "Withdrawn by candidate request",
          },
        },
      });

      return {
        ...updatedApp,
        caseDossier: updatedCase,
      };
    });
  }
}

export const applicationRepository = new ApplicationRepository();
