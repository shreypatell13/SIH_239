import { prisma } from "../db";
import { CaseStage, CaseState, Prisma } from "@prisma/client";
import { OperationsFilterParams } from "../domain/operations/types";
import { DrillDownCasesQuery } from "../domain/operations/validators";

export class OperationsAnalyticsRepository {
  private buildWhereClause(filter: OperationsFilterParams): Prisma.CaseDossierWhereInput {
    const where: Prisma.CaseDossierWhereInput = {};

    if (filter.stage) {
      where.currentStage = filter.stage;
    }
    if (filter.state) {
      where.currentState = filter.state;
    }
    if (filter.schemeCode || filter.schemeVersionId) {
      const appWhere: Prisma.ApplicationWhereInput = {};
      if (filter.schemeVersionId) {
        appWhere.schemeVersionId = filter.schemeVersionId;
      }
      if (filter.schemeCode) {
        appWhere.schemeVersion = {
          scheme: {
            code: filter.schemeCode,
          },
        };
      }
      where.application = appWhere;
    }
    if (filter.fromDate || filter.toDate) {
      where.createdAt = {};
      if (filter.fromDate) {
        where.createdAt.gte = new Date(filter.fromDate);
      }
      if (filter.toDate) {
        const endDate = new Date(filter.toDate);
        if (/^\d{4}-\d{2}-\d{2}$/.test(filter.toDate)) endDate.setUTCHours(23, 59, 59, 999);
        where.createdAt.lte = endDate;
      }
    }

    return where;
  }

  async getCaseRawDossiers(filter: OperationsFilterParams) {
    const where = this.buildWhereClause(filter);

    return prisma.caseDossier.findMany({
      where,
      select: {
        id: true,
        caseNumber: true,
        currentStage: true,
        currentState: true,
        blocker: true,
        officerAssignedId: true,
        officerAssigned: { select: { id: true, name: true } },
        createdAt: true,
        updatedAt: true,
        decisionAt: true,
        application: {
          select: {
            schemeVersion: {
              select: {
                scheme: {
                  select: {
                    code: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async getLatestStageTransitionsForCases(caseIds: string[]) {
    if (caseIds.length === 0) return new Map<string, Date>();

    const auditLogs = await prisma.auditLog.findMany({
      where: {
        caseDossierId: { in: caseIds },
        actionType: {
          in: [
            "STATE_TRANSITION",
            "OFFICER_CASE_DECISION_RECORDED",
            "DEFICIENCY_ISSUED",
            "DEFICIENCY_RESOLVED",
            "DEFICIENCY_APPLICANT_RESPONSE_SUBMITTED",
            "DEFICIENCY_TARGETED_RULES_EVALUATED",
            "APPLICATION_SUBMITTED",
            "CASE_CREATED",
          ],
        },
      },
      select: {
        caseDossierId: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const latestTransitionMap = new Map<string, Date>();
    for (const log of auditLogs) {
      if (log.caseDossierId && !latestTransitionMap.has(log.caseDossierId)) {
        latestTransitionMap.set(log.caseDossierId, log.createdAt);
      }
    }

    return latestTransitionMap;
  }

  async getDeficiencyRecords(filter: OperationsFilterParams) {
    const whereCase = this.buildWhereClause(filter);

    return prisma.deficiency.findMany({
      where: {
        caseDossier: whereCase,
      },
      select: {
        id: true,
        caseDossierId: true,
        deficiencyType: true,
        documentType: true,
        status: true,
        recheckStatus: true,
        createdAt: true,
        resolvedAt: true,
        caseDossier: {
          select: {
            application: {
              select: {
                schemeVersion: {
                  select: { scheme: { select: { code: true, name: true } } },
                },
              },
            },
          },
        },
      },
    });
  }

  async getDrillDownCases(query: DrillDownCasesQuery) {
    const where: Prisma.CaseDossierWhereInput = {};
    const and: Prisma.CaseDossierWhereInput[] = [];

    if (query.stage) {
      where.currentStage = query.stage;
    }
    if (query.state) {
      where.currentState = query.state;
    }
    if (query.schemeCode || query.schemeVersionId) {
      const appWhere: Prisma.ApplicationWhereInput = {};
      if (query.schemeVersionId) {
        appWhere.schemeVersionId = query.schemeVersionId;
      }
      if (query.schemeCode) {
        appWhere.schemeVersion = {
          scheme: {
            code: query.schemeCode,
          },
        };
      }
      where.application = appWhere;
    }
    if (query.unassignedOnly) {
      where.officerAssignedId = null;
      and.push({ currentStage: CaseStage.OFFICER_REVIEW });
    }
    if (query.assignedOfficerId) where.officerAssignedId = query.assignedOfficerId;
    if (query.blockedOnly) {
      and.push({ OR: [{ currentState: CaseState.BLOCKED }, { blocker: { not: null } }] });
    }
    if (query.officerAttentionOnly) {
      and.push({
        OR: [
          { currentStage: CaseStage.OFFICER_REVIEW },
          { currentState: { in: [CaseState.BLOCKED, CaseState.ESCALATED] } },
        ],
      });
    }
    if (query.underVerificationOnly) {
      and.push({
        currentStage: { in: [CaseStage.AUTOMATED_VERIFICATION, CaseStage.OFFICER_REVIEW] },
      });
    }
    if (query.completedOnly) {
      and.push({
        OR: [
          { currentStage: { in: [CaseStage.SANCTIONED, CaseStage.REJECTED, CaseStage.WITHDRAWN] } },
          { currentState: CaseState.COMPLETED },
        ],
      });
    }
    if (query.hasOpenDeficienciesOnly || query.deficiencyType || query.documentType) {
      where.deficiencies = {
        some: {
          status: "OPEN",
          ...(query.deficiencyType ? { deficiencyType: query.deficiencyType } : {}),
          ...(query.documentType ? { documentType: query.documentType } : {}),
        },
      };
    }
    if (query.search) {
      const searchTerm = query.search.trim();
      and.push({
        OR: [
          { caseNumber: { contains: searchTerm } },
          { application: { applicationNumber: { contains: searchTerm } } },
        ],
      });
    }
    if (query.agingBucket) {
      const now = new Date();
      const day = 86400000;
      const createdAt: Prisma.DateTimeFilter = { lte: now };
      if (query.agingBucket === "DAYS_0_TO_2") createdAt.gt = new Date(now.getTime() - 3 * day);
      else if (query.agingBucket === "DAYS_3_TO_7") {
        createdAt.gt = new Date(now.getTime() - 8 * day);
        createdAt.lte = new Date(now.getTime() - 3 * day);
      } else if (query.agingBucket === "DAYS_8_TO_14") {
        createdAt.gt = new Date(now.getTime() - 15 * day);
        createdAt.lte = new Date(now.getTime() - 8 * day);
      } else {
        createdAt.lte = new Date(now.getTime() - 15 * day);
      }
      where.createdAt = createdAt;
      and.push({
        currentStage: { notIn: [CaseStage.SANCTIONED, CaseStage.REJECTED, CaseStage.WITHDRAWN] },
      });
      and.push({ currentState: { not: CaseState.COMPLETED } });
    }
    if (and.length) where.AND = and;

    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const [total, records] = await Promise.all([
      prisma.caseDossier.count({ where }),
      prisma.caseDossier.findMany({
        where,
        select: {
          id: true,
          caseNumber: true,
          currentStage: true,
          currentState: true,
          createdAt: true,
          updatedAt: true,
          application: {
            select: {
              applicationNumber: true,
              schemeVersion: {
                select: {
                  scheme: {
                    select: {
                      code: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
          officerAssigned: {
            select: {
              name: true,
            },
          },
          deficiencies: {
            where: { status: "OPEN" },
            select: { id: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

    return { total, records, page, limit };
  }
}

export const operationsAnalyticsRepository = new OperationsAnalyticsRepository();
