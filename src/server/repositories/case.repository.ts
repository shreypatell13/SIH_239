import { prisma } from "../db";
import { CaseDossier, CaseStage, CaseState, Prisma } from "@prisma/client";

export class CaseRepository {
  async findById(id: string): Promise<CaseDossier | null> {
    return prisma.caseDossier.findUnique({
      where: { id },
      include: {
        application: {
          include: {
            applicantProfile: { include: { user: true } },
            schemeVersion: { include: { scheme: true } },
          },
        },
        documents: {
          where: { isLatestVersion: true },
          include: { extractedFields: true },
        },
        ruleResults: true,
        deficiencies: true,
        auditLogs: { orderBy: { createdAt: "desc" } },
        postSelectionRecord: true,
      },
    });
  }

  async findByCaseNumber(caseNumber: string): Promise<CaseDossier | null> {
    return prisma.caseDossier.findUnique({
      where: { caseNumber },
      include: {
        application: {
          include: {
            applicantProfile: { include: { user: true } },
            schemeVersion: { include: { scheme: true } },
          },
        },
        documents: {
          where: { isLatestVersion: true },
          include: { extractedFields: true },
        },
        ruleResults: true,
        deficiencies: true,
      },
    });
  }

  async listAssignedCases(officerId: string): Promise<CaseDossier[]> {
    return prisma.caseDossier.findMany({
      where: { officerAssignedId: officerId },
      include: {
        application: {
          include: {
            applicantProfile: { include: { user: true } },
            schemeVersion: { include: { scheme: true } },
          },
        },
        deficiencies: { where: { status: "OPEN" } },
      },
      orderBy: { updatedAt: "desc" },
    });
  }

  async create(data: Prisma.CaseDossierCreateInput): Promise<CaseDossier> {
    return prisma.caseDossier.create({ data });
  }

  async updateStageAndState(
    id: string,
    currentStage: CaseStage,
    currentState: CaseState,
    blocker: string | null = null,
    nextAction: string = "Pending next step."
  ): Promise<CaseDossier> {
    return prisma.caseDossier.update({
      where: { id },
      data: {
        currentStage,
        currentState,
        blocker,
        nextAction,
      },
    });
  }
}

export const caseRepository = new CaseRepository();
