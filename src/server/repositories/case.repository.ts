import { prisma } from "../db";
import { CaseDossier, CaseStage, CaseState, Prisma, UserRole } from "@prisma/client";
import { OfficerQueueFilterQuery } from "../domain/officer/types";

export function combineQueueScopeAndSearch(
  scope: Prisma.CaseDossierWhereInput | undefined,
  search: Prisma.CaseDossierWhereInput | undefined
): Prisma.CaseDossierWhereInput {
  const predicates = [scope, search].filter((value): value is Prisma.CaseDossierWhereInput =>
    Boolean(value)
  );
  return predicates.length ? { AND: predicates } : {};
}

export class CaseRepository {
  async findById(id: string) {
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
        officerAssigned: true,
      },
    });
  }

  async findByApplicationId(applicationId: string) {
    return prisma.caseDossier.findUnique({
      where: { applicationId },
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
        officerAssigned: true,
      },
    });
  }

  async findByCaseNumber(caseNumber: string) {
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
        auditLogs: { orderBy: { createdAt: "desc" } },
        postSelectionRecord: true,
        officerAssigned: true,
      },
    });
  }

  async listAssignedCases(officerId: string) {
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
        officerAssigned: true,
      },
      orderBy: { updatedAt: "desc" },
    });
  }

  async listQueue(
    filters: OfficerQueueFilterQuery,
    officerId?: string,
    isGlobalOfficer: boolean = false
  ) {
    const where: Prisma.CaseDossierWhereInput = {};
    let authorizationScope: Prisma.CaseDossierWhereInput | undefined;
    let searchScope: Prisma.CaseDossierWhereInput | undefined;

    // 1. Assignment / Role scope
    if (filters.assignedToMe && officerId) {
      where.officerAssignedId = officerId;
    } else if (!isGlobalOfficer && officerId) {
      authorizationScope = { OR: [{ officerAssignedId: officerId }, { officerAssignedId: null }] };
    }

    // 2. Scheme code filter
    if (filters.schemeCode && filters.schemeCode !== "ALL") {
      where.application = {
        schemeVersion: {
          scheme: {
            code: filters.schemeCode,
          },
        },
      };
    }

    // 3. Stage filter
    if (filters.currentStage) {
      where.currentStage = filters.currentStage;
    }

    // 4. State filter
    if (filters.currentState) {
      where.currentState = filters.currentState;
    }

    // 5. Has open deficiencies filter
    if (filters.hasDeficiencies !== undefined) {
      if (filters.hasDeficiencies) {
        where.deficiencies = {
          some: { status: "OPEN" },
        };
      } else {
        where.deficiencies = {
          none: { status: "OPEN" },
        };
      }
    }

    // 6. Search query
    if (filters.search && filters.search.trim().length > 0) {
      const term = filters.search.trim();
      searchScope = {
        OR: [
          { caseNumber: { contains: term, mode: "insensitive" } },
          { application: { applicationNumber: { contains: term, mode: "insensitive" } } },
          {
            application: {
              applicantProfile: {
                user: {
                  name: { contains: term, mode: "insensitive" },
                },
              },
            },
          },
        ],
      };
    }
    Object.assign(where, combineQueueScopeAndSearch(authorizationScope, searchScope));

    // Sorting
    let orderBy: Prisma.CaseDossierOrderByWithRelationInput = { updatedAt: "desc" };
    if (filters.sortBy === "oldestSubmission") {
      orderBy = { application: { submittedAt: "asc" } };
    } else if (filters.sortBy === "newestSubmission") {
      orderBy = { application: { submittedAt: "desc" } };
    } else if (filters.sortBy === "actionRequiredFirst") {
      orderBy = { currentState: "asc" };
    } else if (filters.sortBy === "recentlyUpdated") {
      orderBy = { updatedAt: "desc" };
    }

    const page = filters.page || 1;
    const pageSize = filters.pageSize || 20;
    const skip = (page - 1) * pageSize;

    const [total, items] = await Promise.all([
      prisma.caseDossier.count({ where }),
      prisma.caseDossier.findMany({
        where,
        include: {
          application: {
            include: {
              applicantProfile: { include: { user: true } },
              schemeVersion: { include: { scheme: true } },
            },
          },
          documents: {
            where: { isLatestVersion: true },
            select: {
              id: true,
              processingStatus: true,
            },
          },
          ruleResults: {
            select: {
              outcome: true,
              runId: true,
              evaluatedAt: true,
            },
            orderBy: { evaluatedAt: "desc" },
          },
          deficiencies: {
            where: { status: "OPEN" },
            select: { id: true },
          },
          officerAssigned: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy,
        skip,
        take: pageSize,
      }),
    ]);

    return { total, items, page, pageSize };
  }

  async countQueueMetrics(officerId?: string) {
    const [totalAssigned, actionRequired, deficiencyPending, readyForReview] = await Promise.all([
      officerId
        ? prisma.caseDossier.count({ where: { officerAssignedId: officerId } })
        : prisma.caseDossier.count({ where: { officerAssignedId: { not: null } } }),
      prisma.caseDossier.count({ where: { currentState: "ACTION_REQUIRED" } }),
      prisma.caseDossier.count({ where: { currentStage: "DEFICIENCY_PENDING" } }),
      prisma.caseDossier.count({
        where: {
          currentStage: { in: ["OFFICER_REVIEW", "AUTOMATED_VERIFICATION"] },
          currentState: { in: ["PENDING", "IN_PROGRESS"] },
        },
      }),
    ]);

    return {
      totalAssigned,
      actionRequired,
      deficiencyPending,
      readyForReview,
    };
  }

  async assignOfficer(caseId: string, officerId: string): Promise<CaseDossier> {
    const result = await prisma.caseDossier.updateMany({
      where: { id: caseId, OR: [{ officerAssignedId: null }, { officerAssignedId: officerId }] },
      data: {
        officerAssignedId: officerId,
        currentState: "IN_PROGRESS",
        responsibleActor: "VERIFICATION_OFFICER",
      },
    });
    if (result.count !== 1) throw new Error("Forbidden: Case is assigned to another officer.");
    return prisma.caseDossier.findUniqueOrThrow({
      where: { id: caseId },
      include: { officerAssigned: true },
    });
  }

  async create(data: Prisma.CaseDossierCreateInput): Promise<CaseDossier> {
    return prisma.caseDossier.create({ data });
  }

  async transitionWithAudit(input: {
    caseId: string;
    targetStage: CaseStage;
    targetState: CaseState;
    blocker: string | null;
    nextAction: string;
    actorId: string;
    actorRole: UserRole;
    previousState: string;
    remark: string;
    decision: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const updated = await tx.caseDossier.update({
        where: { id: input.caseId },
        data: {
          currentStage: input.targetStage,
          currentState: input.targetState,
          blocker: input.blocker,
          nextAction: input.nextAction,
          ...(input.targetStage === CaseStage.REJECTED ? { decisionAt: new Date() } : {}),
        },
      });
      await tx.auditLog.create({
        data: {
          caseDossierId: input.caseId,
          actorId: input.actorId,
          actorRole: input.actorRole,
          actionType: "OFFICER_CASE_DECISION_RECORDED",
          previousState: input.previousState,
          newState: `${input.targetStage}:${input.targetState}`,
          payload: { remark: input.remark, decision: input.decision, officerId: input.actorId },
        },
      });
      return updated;
    });
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
