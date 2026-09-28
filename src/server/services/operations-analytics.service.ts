import { CaseStage, CaseState, DeficiencyType, DocumentType } from "@prisma/client";
import {
  AgingBucket,
  AgingBucketItemDTO,
  BottleneckItemDTO,
  BottleneckSeverity,
  DeficiencyFrictionItemDTO,
  DrillDownCaseDTO,
  KpiSummaryDTO,
  OperationsBottlenecksDTO,
  OperationsFilterParams,
  OperationsOverviewDTO,
  PaginatedDrillDownCasesDTO,
  OfficerWorkloadItemDTO,
  SchemeOperationsSummaryDTO,
  StageWorkloadItemDTO,
} from "../domain/operations/types";
import { DrillDownCasesQuery } from "../domain/operations/validators";
import { getPipelineAgeBucket } from "../domain/operations/metrics";
import {
  OperationsAnalyticsRepository,
  operationsAnalyticsRepository,
} from "../repositories/operations-analytics.repository";

const STAGE_LABELS: Record<CaseStage, string> = {
  DRAFT: "Draft Application",
  SUBMITTED: "Submitted Dossier",
  AUTOMATED_VERIFICATION: "Automated Verification & OCR",
  OFFICER_REVIEW: "Verification Officer Review",
  DEFICIENCY_PENDING: "Deficiency Resolution",
  COMMITTEE_SELECTION: "Selection Committee Review",
  SANCTIONED: "Sanctioned / Selected",
  REJECTED: "Rejected",
  WITHDRAWN: "Withdrawn",
};

// Prototype analytics triggers, not government policy or official SLAs.
const ANALYTICAL_TRIGGERS = {
  STAGE_CONGESTION_PERCENTAGE: 35,
  DWELL_DAYS_AUTOMATED_VERIFICATION: 2.0,
  DWELL_DAYS_OFFICER_REVIEW: 5.0,
  DWELL_DAYS_COMMITTEE: 7.0,
  DEFICIENCY_CONCENTRATION_PERCENTAGE: 30,
  UNALLOCATED_QUEUE_THRESHOLD: 3,
  OFFICER_CASE_SHARE_PERCENTAGE: 60,
};

const CLOSED_STAGES: CaseStage[] = [CaseStage.SANCTIONED, CaseStage.REJECTED, CaseStage.WITHDRAWN];

export class OperationsAnalyticsService {
  constructor(private repo: OperationsAnalyticsRepository = operationsAnalyticsRepository) {}

  async getOverview(filter: OperationsFilterParams = {}): Promise<OperationsOverviewDTO> {
    const rawCases = await this.repo.getCaseRawDossiers(filter);
    const caseIds = rawCases.map((c: { id: string }) => c.id);

    const [latestTransitions, rawDeficiencies] = await Promise.all([
      this.repo.getLatestStageTransitionsForCases(caseIds),
      this.repo.getDeficiencyRecords(filter),
    ]);

    const now = Date.now();
    const totalCases = rawCases.length;
    const activeCases = rawCases.filter(
      (c: { currentStage: CaseStage; currentState: CaseState }) =>
        !CLOSED_STAGES.includes(c.currentStage) && c.currentState !== CaseState.COMPLETED
    );
    const activeCount = activeCases.length;
    const activeCaseIds = new Set(activeCases.map((c) => c.id));
    const closedCount = totalCases - activeCount;

    // 1. Calculate KPIs
    let unassignedOfficerCount = 0;
    let blockedCasesCount = 0;

    for (const c of rawCases) {
      const isClosed =
        CLOSED_STAGES.includes(c.currentStage) || c.currentState === CaseState.COMPLETED;
      if (c.currentStage === CaseStage.OFFICER_REVIEW && !isClosed && !c.officerAssignedId) {
        unassignedOfficerCount++;
      }

      if (c.currentState === CaseState.BLOCKED || c.blocker) {
        blockedCasesCount++;
      }
    }

    const closedCasePercentage =
      totalCases > 0 ? Number(((closedCount / totalCases) * 100).toFixed(1)) : 0;
    const openDeficiencies = rawDeficiencies.filter((d: { status: string }) => d.status === "OPEN");
    const deficientCaseIds = new Set(openDeficiencies.map((d) => d.caseDossierId));
    const pendingCases = activeCases.filter((c) => c.currentState === CaseState.PENDING).length;
    const underVerificationCases = activeCases.filter(
      (c) =>
        c.currentStage === CaseStage.AUTOMATED_VERIFICATION ||
        c.currentStage === CaseStage.OFFICER_REVIEW
    ).length;
    const awaitingApplicantCases = activeCases.filter(
      (c) => c.currentState === CaseState.ACTION_REQUIRED
    ).length;
    const officerAttentionCases = activeCases.filter(
      (c) =>
        c.currentStage === CaseStage.OFFICER_REVIEW ||
        c.currentState === CaseState.BLOCKED ||
        c.currentState === CaseState.ESCALATED
    ).length;
    const avgActiveCaseAgeDays = activeCount
      ? Number(
          (
            activeCases.reduce((sum, c) => sum + (now - c.createdAt.getTime()), 0) /
            activeCount /
            86400000
          ).toFixed(1)
        )
      : 0;

    const kpis: KpiSummaryDTO = {
      totalIngestedCases: totalCases,
      activePipelineCases: activeCount,
      pendingCases,
      underVerificationCases,
      deficientCases: deficientCaseIds.size,
      awaitingApplicantCases,
      completedCases: closedCount,
      officerAttentionCases,
      closedCasePercentage,
      avgActiveCaseAgeDays,
      unresolvedDeficienciesCount: openDeficiencies.length,
      unassignedOfficerQueueCount: unassignedOfficerCount,
      blockedCasesCount,
    };

    // 2. Stage Workload Distribution
    const allStages: CaseStage[] = [
      CaseStage.DRAFT,
      CaseStage.SUBMITTED,
      CaseStage.AUTOMATED_VERIFICATION,
      CaseStage.OFFICER_REVIEW,
      CaseStage.DEFICIENCY_PENDING,
      CaseStage.COMMITTEE_SELECTION,
      CaseStage.SANCTIONED,
      CaseStage.REJECTED,
      CaseStage.WITHDRAWN,
    ];

    const stageDistribution: StageWorkloadItemDTO[] = allStages.map((stage) => {
      const stageCases = rawCases.filter((c) => c.currentStage === stage);
      const activeStageCases = stageCases.filter((c) => activeCaseIds.has(c.id));
      const stageTotal = stageCases.length;

      let pending = 0;
      let inReview = 0;
      let blocked = 0;
      let approved = 0;
      let rejected = 0;
      let totalDwellMs = 0;

      for (const c of stageCases) {
        if (c.currentStage === CaseStage.SANCTIONED) approved++;
        else if (c.currentStage === CaseStage.REJECTED) rejected++;
        else if (c.currentState === CaseState.PENDING) pending++;
        else if (c.currentState === CaseState.IN_PROGRESS) inReview++;
        else if (c.currentState === CaseState.BLOCKED) blocked++;

        if (activeCaseIds.has(c.id)) {
          const transitionDate = latestTransitions.get(c.id) || c.createdAt;
          totalDwellMs += now - transitionDate.getTime();
        }
      }

      const avgDwellDays =
        activeStageCases.length > 0
          ? Number((totalDwellMs / (activeStageCases.length * 86400000)).toFixed(1))
          : 0;
      const percentageOfActive =
        activeCount > 0 ? Number(((activeStageCases.length / activeCount) * 100).toFixed(1)) : 0;

      return {
        stage,
        stageLabel: STAGE_LABELS[stage] || stage,
        totalCases: stageTotal,
        pendingCount: pending,
        inReviewCount: inReview,
        blockedCount: blocked,
        approvedCount: approved,
        rejectedCount: rejected,
        avgDwellDays,
        percentageOfActive,
      };
    });

    // 3. Aging Distribution (for active pipeline)
    let b0to2 = 0;
    let b3to7 = 0;
    let b8to14 = 0;
    let bOver14 = 0;

    for (const c of activeCases) {
      const bucket = getPipelineAgeBucket((now - c.createdAt.getTime()) / 86400000);
      if (bucket === "DAYS_0_TO_2") b0to2++;
      else if (bucket === "DAYS_3_TO_7") b3to7++;
      else if (bucket === "DAYS_8_TO_14") b8to14++;
      else bOver14++;
    }

    const agingDistribution: AgingBucketItemDTO[] = [
      {
        bucket: "DAYS_0_TO_2",
        label: "0–2 days",
        count: b0to2,
        percentageOfActive: activeCount > 0 ? Number(((b0to2 / activeCount) * 100).toFixed(1)) : 0,
      },
      {
        bucket: "DAYS_3_TO_7",
        label: "3–7 days",
        count: b3to7,
        percentageOfActive: activeCount > 0 ? Number(((b3to7 / activeCount) * 100).toFixed(1)) : 0,
      },
      {
        bucket: "DAYS_8_TO_14",
        label: "8–14 days",
        count: b8to14,
        percentageOfActive: activeCount > 0 ? Number(((b8to14 / activeCount) * 100).toFixed(1)) : 0,
      },
      {
        bucket: "DAYS_15_PLUS",
        label: "15+ days",
        count: bOver14,
        percentageOfActive:
          activeCount > 0 ? Number(((bOver14 / activeCount) * 100).toFixed(1)) : 0,
      },
    ];

    // 4. Deficiency Friction Heatmap
    const frictionMap = new Map<
      string,
      {
        deficiencyType: DeficiencyType;
        documentType: DocumentType | "UNSPECIFIED";
        schemeCode: string;
        schemeName: string;
        open: number;
        resolved: number;
        total: number;
        recheckFailures: number;
        rechecked: number;
        caseIds: Set<string>;
      }
    >();

    for (const d of rawDeficiencies) {
      const docTypeKey = d.documentType || "UNSPECIFIED";
      const scheme = d.caseDossier.application.schemeVersion.scheme;
      const key = `${scheme.code}__${d.deficiencyType}__${docTypeKey}`;

      if (!frictionMap.has(key)) {
        frictionMap.set(key, {
          deficiencyType: d.deficiencyType,
          documentType: docTypeKey,
          schemeCode: scheme.code,
          schemeName: scheme.name,
          open: 0,
          resolved: 0,
          total: 0,
          recheckFailures: 0,
          rechecked: 0,
          caseIds: new Set(),
        });
      }

      const item = frictionMap.get(key)!;
      item.total++;
      item.caseIds.add(d.caseDossierId);
      if (d.status === "OPEN") item.open++;
      if (d.status === "RESOLVED") item.resolved++;
      if (d.recheckStatus) item.rechecked++;
      if (d.recheckStatus === "RECHECKED_FAIL") item.recheckFailures++;
    }

    const deficiencyHeatmap: DeficiencyFrictionItemDTO[] = Array.from(frictionMap.values())
      .map((item) => ({
        deficiencyType: item.deficiencyType,
        documentType: item.documentType,
        schemeCode: item.schemeCode,
        schemeName: item.schemeName,
        openCount: item.open,
        resolvedCount: item.resolved,
        totalCount: item.total,
        recheckCount: item.rechecked,
        affectedCaseCount: item.caseIds.size,
        recheckFailureRate:
          item.rechecked > 0
            ? Number(((item.recheckFailures / item.rechecked) * 100).toFixed(1))
            : 0,
      }))
      .sort(
        (a, b) =>
          b.openCount - a.openCount ||
          a.schemeCode.localeCompare(b.schemeCode) ||
          a.deficiencyType.localeCompare(b.deficiencyType)
      );

    const schemeGroups = new Map<string, SchemeOperationsSummaryDTO>();
    for (const c of rawCases) {
      const scheme = c.application.schemeVersion.scheme;
      const item = schemeGroups.get(scheme.code) ?? {
        schemeCode: scheme.code,
        schemeName: scheme.name,
        totalCases: 0,
        activeCases: 0,
        deficientCases: 0,
        averageActiveAgeDays: 0,
      };
      item.totalCases++;
      if (!CLOSED_STAGES.includes(c.currentStage) && c.currentState !== CaseState.COMPLETED) {
        item.activeCases++;
        item.averageActiveAgeDays += now - c.createdAt.getTime();
      }
      if (deficientCaseIds.has(c.id)) item.deficientCases++;
      schemeGroups.set(scheme.code, item);
    }
    const schemeSummary = Array.from(schemeGroups.values()).map((item) => ({
      ...item,
      averageActiveAgeDays: item.activeCases
        ? Number((item.averageActiveAgeDays / item.activeCases / 86400000).toFixed(1))
        : 0,
    }));

    const workload = new Map<string, OfficerWorkloadItemDTO>();
    for (const c of rawCases) {
      if (!c.officerAssignedId || !c.officerAssigned) continue;
      const item = workload.get(c.officerAssignedId) ?? {
        officerId: c.officerAssignedId,
        officerName: c.officerAssigned.name || "Assigned Officer",
        assignedCases: 0,
        openCases: 0,
        completedCases: 0,
        oldestOpenCaseAgeDays: null,
      };
      item.assignedCases++;
      const isClosed =
        CLOSED_STAGES.includes(c.currentStage) || c.currentState === CaseState.COMPLETED;
      if (isClosed) item.completedCases++;
      else {
        item.openCases++;
        const ageDays = (now - c.createdAt.getTime()) / 86400000;
        item.oldestOpenCaseAgeDays = Math.max(item.oldestOpenCaseAgeDays ?? 0, ageDays);
      }
      workload.set(c.officerAssignedId, item);
    }

    return {
      filter,
      kpis,
      stageDistribution,
      agingDistribution,
      deficiencyHeatmap,
      officerWorkload: Array.from(workload.values()).sort((a, b) =>
        a.officerName.localeCompare(b.officerName)
      ),
      schemeSummary: schemeSummary.sort((a, b) => a.schemeCode.localeCompare(b.schemeCode)),
      generatedAt: new Date().toISOString(),
    };
  }

  async getBottlenecks(filter: OperationsFilterParams = {}): Promise<OperationsBottlenecksDTO> {
    const overview = await this.getOverview(filter);
    const bottlenecks: BottleneckItemDTO[] = [];

    const activeCount = overview.kpis.activePipelineCases;

    // Rule 1: Stage Volume Congestion
    for (const stageItem of overview.stageDistribution) {
      if (
        activeCount >= 3 &&
        stageItem.totalCases >= 2 &&
        stageItem.percentageOfActive >= ANALYTICAL_TRIGGERS.STAGE_CONGESTION_PERCENTAGE
      ) {
        const isCritical = stageItem.percentageOfActive >= 50;
        bottlenecks.push({
          id: `bn_vol_${stageItem.stage}`,
          type: "STAGE_VOLUME_CONGESTION",
          title: `Volume Concentration in ${stageItem.stageLabel}`,
          severity: isCritical ? "CRITICAL" : "HIGH",
          affectedStage: stageItem.stage,
          caseCount: stageItem.totalCases,
          metricValue: stageItem.percentageOfActive,
          thresholdValue: ANALYTICAL_TRIGGERS.STAGE_CONGESTION_PERCENTAGE,
          unit: "% of active pipeline",
          explanation: `${stageItem.totalCases} active cases (${stageItem.percentageOfActive}% of the active pipeline) are at ${stageItem.stageLabel}; the analytical trigger is ${ANALYTICAL_TRIGGERS.STAGE_CONGESTION_PERCENTAGE}%.`,
          drillDownFilters: {
            stage: stageItem.stage,
          },
        });
      }
    }

    // Rule 2: Stage age analytical triggers
    for (const stageItem of overview.stageDistribution) {
      let expectedMaxDwell = 0;
      if (stageItem.stage === CaseStage.AUTOMATED_VERIFICATION) {
        expectedMaxDwell = ANALYTICAL_TRIGGERS.DWELL_DAYS_AUTOMATED_VERIFICATION;
      } else if (stageItem.stage === CaseStage.OFFICER_REVIEW) {
        expectedMaxDwell = ANALYTICAL_TRIGGERS.DWELL_DAYS_OFFICER_REVIEW;
      } else if (stageItem.stage === CaseStage.COMMITTEE_SELECTION) {
        expectedMaxDwell = ANALYTICAL_TRIGGERS.DWELL_DAYS_COMMITTEE;
      }

      if (
        expectedMaxDwell > 0 &&
        stageItem.totalCases > 0 &&
        stageItem.avgDwellDays > expectedMaxDwell
      ) {
        const severity: BottleneckSeverity =
          stageItem.avgDwellDays > expectedMaxDwell * 1.5 ? "CRITICAL" : "HIGH";
        bottlenecks.push({
          id: `bn_dwell_${stageItem.stage}`,
          type: "STAGE_AGE_TRIGGER",
          title: `Higher Average Stage Age in ${stageItem.stageLabel}`,
          severity,
          affectedStage: stageItem.stage,
          caseCount: stageItem.totalCases,
          metricValue: stageItem.avgDwellDays,
          thresholdValue: expectedMaxDwell,
          unit: "days mean stage age",
          explanation: `Mean stage age is ${stageItem.avgDwellDays} days; the configured analytics trigger is ${expectedMaxDwell} days. This is not an official service standard.`,
          drillDownFilters: {
            stage: stageItem.stage,
          },
        });
      }
    }

    // Rule 3: Unallocated Officer Queue
    if (
      overview.kpis.unassignedOfficerQueueCount >= ANALYTICAL_TRIGGERS.UNALLOCATED_QUEUE_THRESHOLD
    ) {
      bottlenecks.push({
        id: "bn_unassigned_queue",
        type: "UNALLOCATED_OFFICER_QUEUE",
        title: "Unassigned Verification Officer Backlog",
        severity: overview.kpis.unassignedOfficerQueueCount >= 5 ? "CRITICAL" : "MEDIUM",
        affectedStage: CaseStage.OFFICER_REVIEW,
        caseCount: overview.kpis.unassignedOfficerQueueCount,
        metricValue: overview.kpis.unassignedOfficerQueueCount,
        thresholdValue: ANALYTICAL_TRIGGERS.UNALLOCATED_QUEUE_THRESHOLD,
        unit: "unclaimed cases",
        explanation: `${overview.kpis.unassignedOfficerQueueCount} cases are waiting in Officer Review without an assigned case officer.`,
        drillDownFilters: {
          stage: CaseStage.OFFICER_REVIEW,
          unassignedOnly: true,
        },
      });
    }

    const assignedOpenCases = overview.officerWorkload.reduce(
      (sum, officer) => sum + officer.openCases,
      0
    );
    if (assignedOpenCases >= 3) {
      for (const officer of overview.officerWorkload) {
        const share = (officer.openCases / assignedOpenCases) * 100;
        if (
          officer.openCases >= 2 &&
          share >= ANALYTICAL_TRIGGERS.OFFICER_CASE_SHARE_PERCENTAGE &&
          (officer.oldestOpenCaseAgeDays || 0) >= 3
        ) {
          bottlenecks.push({
            id: `bn_officer_workload_${officer.officerId}`,
            type: "OFFICER_WORKLOAD_CONCENTRATION",
            title: "Concentrated Assigned Workload",
            severity: share >= 75 && (officer.oldestOpenCaseAgeDays || 0) >= 7 ? "HIGH" : "MEDIUM",
            affectedOfficerId: officer.officerId,
            caseCount: officer.openCases,
            metricValue: Number(share.toFixed(1)),
            thresholdValue: ANALYTICAL_TRIGGERS.OFFICER_CASE_SHARE_PERCENTAGE,
            unit: "% of assigned open cases",
            explanation: `${officer.openCases} open cases (${share.toFixed(1)}% of assigned open cases) are assigned to ${officer.officerName}; the oldest open case is ${(officer.oldestOpenCaseAgeDays || 0).toFixed(1)} days old. This is workload visibility, not a performance rating.`,
            drillDownFilters: { assignedOfficerId: officer.officerId },
          });
        }
      }
    }

    // Rule 4: Systemic Deficiency Friction Concentration
    const totalOpenDefs = overview.kpis.unresolvedDeficienciesCount;
    if (totalOpenDefs >= 3) {
      for (const heat of overview.deficiencyHeatmap) {
        const concentration = (heat.openCount / totalOpenDefs) * 100;
        if (
          heat.openCount >= 2 &&
          concentration >= ANALYTICAL_TRIGGERS.DEFICIENCY_CONCENTRATION_PERCENTAGE
        ) {
          const docLabel = heat.documentType !== "UNSPECIFIED" ? heat.documentType : "Documents";
          bottlenecks.push({
            id: `bn_def_${heat.deficiencyType}_${heat.documentType}`,
            type: "DEFICIENCY_FRICTION_CONCENTRATION",
            title: `Concentrated Deficiency Records: ${heat.deficiencyType.replace(/_/g, " ")}`,
            severity: concentration >= 45 ? "HIGH" : "MEDIUM",
            affectedDocumentType:
              heat.documentType !== "UNSPECIFIED" ? heat.documentType : undefined,
            caseCount: heat.affectedCaseCount,
            schemeCode: heat.schemeCode,
            metricValue: Number(concentration.toFixed(1)),
            thresholdValue: ANALYTICAL_TRIGGERS.DEFICIENCY_CONCENTRATION_PERCENTAGE,
            unit: "% of open deficiencies",
            explanation: `${heat.openCount} open deficiency records across ${heat.affectedCaseCount} cases (${concentration.toFixed(1)}% of open records) are linked to ${heat.deficiencyType} on ${docLabel} for ${heat.schemeCode}.`,
            drillDownFilters: {
              deficiencyType: heat.deficiencyType,
              documentType: heat.documentType !== "UNSPECIFIED" ? heat.documentType : undefined,
              schemeCode: heat.schemeCode,
            },
          });
        }
      }
    }

    const summary = {
      criticalCount: bottlenecks.filter((b) => b.severity === "CRITICAL").length,
      highCount: bottlenecks.filter((b) => b.severity === "HIGH").length,
      mediumCount: bottlenecks.filter((b) => b.severity === "MEDIUM").length,
      lowCount: bottlenecks.filter((b) => b.severity === "LOW").length,
    };

    bottlenecks.sort((a, b) => {
      const rank: Record<BottleneckSeverity, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
      return rank[a.severity] - rank[b.severity] || a.id.localeCompare(b.id);
    });
    return {
      filter,
      bottlenecks,
      summary,
      generatedAt: new Date().toISOString(),
    };
  }

  async getDrillDownCases(query: DrillDownCasesQuery): Promise<PaginatedDrillDownCasesDTO> {
    const { total, records, page, limit } = await this.repo.getDrillDownCases(query);
    const caseIds = records.map((r: { id: string }) => r.id);
    const latestTransitions = await this.repo.getLatestStageTransitionsForCases(caseIds);

    const now = Date.now();
    const cases: DrillDownCaseDTO[] = records.map(
      (r: {
        id: string;
        caseNumber: string;
        currentStage: CaseStage;
        currentState: CaseState;
        createdAt: Date;
        updatedAt: Date;
        application: {
          applicationNumber: string;
          schemeVersion: {
            scheme: {
              code: string;
              name: string;
            };
          };
        };
        officerAssigned: {
          name: string | null;
        } | null;
        deficiencies: { id: string }[];
      }) => {
        const daysInPipeline = Number(((now - r.createdAt.getTime()) / 86400000).toFixed(1));
        const transitionDate = latestTransitions.get(r.id) || r.createdAt;
        const daysInCurrentStage = Number(((now - transitionDate.getTime()) / 86400000).toFixed(1));

        return {
          id: r.id,
          caseNumber: r.caseNumber,
          applicationNumber: r.application.applicationNumber,
          schemeCode: r.application.schemeVersion.scheme.code,
          schemeName: r.application.schemeVersion.scheme.name,
          currentStage: r.currentStage,
          currentState: r.currentState,
          officerAssignedName: r.officerAssigned?.name || null,
          daysInPipeline,
          daysInCurrentStage,
          openDeficienciesCount: r.deficiencies.length,
          createdAt: r.createdAt.toISOString(),
          updatedAt: r.updatedAt.toISOString(),
        };
      }
    );

    return {
      cases,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }
}

export const operationsAnalyticsService = new OperationsAnalyticsService();
