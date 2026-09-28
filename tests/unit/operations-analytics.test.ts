import { describe, it, expect, beforeAll } from "vitest";
import { prisma } from "@/server/db";
import { operationsAnalyticsService } from "@/server/services/operations-analytics.service";
import { CaseStage, CaseState } from "@prisma/client";

describe("Phase 2J: Operations Control Tower & Bottleneck Analytics Unit Tests", () => {
  let demoCaseId: string;

  beforeAll(async () => {
    // Locate seeded demo case
    const existing = await prisma.caseDossier.findFirst({
      where: { caseNumber: "CASE-NOS-2026-0001" },
    });
    if (existing) {
      demoCaseId = existing.id;
    }
  });

  describe("1. Operations Overview Metrics & Aggregation", () => {
    it("aggregates accurate KPI summary metrics across active cases", async () => {
      const overview = await operationsAnalyticsService.getOverview({});

      expect(overview).toHaveProperty("kpis");
      expect(overview.kpis.totalIngestedCases).toBeGreaterThan(0);
      expect(overview.kpis.activePipelineCases).toBeGreaterThanOrEqual(0);
      expect(overview.kpis.closedCasePercentage).toBeGreaterThanOrEqual(0);
      expect(overview.kpis.avgActiveCaseAgeDays).toBeGreaterThanOrEqual(0);
      expect(overview.kpis.unresolvedDeficienciesCount).toBeGreaterThanOrEqual(0);
      expect(typeof overview.kpis.unassignedOfficerQueueCount).toBe("number");
      expect(typeof overview.kpis.blockedCasesCount).toBe("number");
    });

    it("generates complete stage workload distribution for all 9 standard CaseStages", async () => {
      const overview = await operationsAnalyticsService.getOverview({});

      expect(overview.stageDistribution).toBeInstanceOf(Array);
      expect(overview.stageDistribution.length).toBe(9);

      const stages = overview.stageDistribution.map((s) => s.stage);
      expect(stages).toContain(CaseStage.SUBMITTED);
      expect(stages).toContain(CaseStage.AUTOMATED_VERIFICATION);
      expect(stages).toContain(CaseStage.OFFICER_REVIEW);
      expect(stages).toContain(CaseStage.COMMITTEE_SELECTION);
      expect(stages).toContain(CaseStage.SANCTIONED);

      for (const item of overview.stageDistribution) {
        expect(item).toHaveProperty("stageLabel");
        expect(item).toHaveProperty("totalCases");
        expect(item).toHaveProperty("pendingCount");
        expect(item).toHaveProperty("inReviewCount");
        expect(item).toHaveProperty("blockedCount");
        expect(item).toHaveProperty("avgDwellDays");
        expect(item).toHaveProperty("percentageOfActive");
      }
    });

    it("evaluates aging cohorts across 4 deterministic buckets", async () => {
      const overview = await operationsAnalyticsService.getOverview({});

      expect(overview.agingDistribution).toHaveProperty("length", 4);

      const buckets = overview.agingDistribution.map((b) => b.bucket);
      expect(buckets).toEqual(["DAYS_0_TO_2", "DAYS_3_TO_7", "DAYS_8_TO_14", "DAYS_15_PLUS"]);

      const sumPercentages = overview.agingDistribution.reduce(
        (acc, b) => acc + b.percentageOfActive,
        0
      );
      if (overview.kpis.activePipelineCases > 0) {
        expect(Math.round(sumPercentages)).toBeCloseTo(100, -1);
      }
    });

    it("constructs deficiency friction heatmap grouped by type and document", async () => {
      const overview = await operationsAnalyticsService.getOverview({});

      expect(overview.deficiencyHeatmap).toBeInstanceOf(Array);
      for (const friction of overview.deficiencyHeatmap) {
        expect(friction).toHaveProperty("deficiencyType");
        expect(friction).toHaveProperty("documentType");
        expect(friction).toHaveProperty("openCount");
        expect(friction).toHaveProperty("resolvedCount");
        expect(friction).toHaveProperty("totalCount");
        expect(friction).toHaveProperty("recheckFailureRate");
      }
    });

    it("applies scheme filters deterministically without side effects", async () => {
      const nosOverview = await operationsAnalyticsService.getOverview({ schemeCode: "NOS" });
      const nfstOverview = await operationsAnalyticsService.getOverview({ schemeCode: "NFST" });

      expect(nosOverview.filter.schemeCode).toBe("NOS");
      expect(nfstOverview.filter.schemeCode).toBe("NFST");
    });
  });

  describe("2. Deterministic Bottleneck Diagnostics", () => {
    it("evaluates explainable bottlenecks with measured values vs thresholds", async () => {
      const result = await operationsAnalyticsService.getBottlenecks({});

      expect(result).toHaveProperty("bottlenecks");
      expect(result).toHaveProperty("summary");
      expect(result.bottlenecks).toBeInstanceOf(Array);

      for (const bn of result.bottlenecks) {
        expect(bn).toHaveProperty("id");
        expect(bn).toHaveProperty("type");
        expect(bn).toHaveProperty("title");
        expect(bn).toHaveProperty("severity");
        expect(bn).toHaveProperty("metricValue");
        expect(bn).toHaveProperty("thresholdValue");
        expect(bn).toHaveProperty("unit");
        expect(bn).toHaveProperty("explanation");
        expect(bn.explanation.length).toBeGreaterThan(10);
        expect(bn).toHaveProperty("drillDownFilters");
      }
    });

    it("correctly categorizes bottleneck severities in summary count", async () => {
      const result = await operationsAnalyticsService.getBottlenecks({});

      const totalSeverities =
        result.summary.criticalCount +
        result.summary.highCount +
        result.summary.mediumCount +
        result.summary.lowCount;

      expect(totalSeverities).toBe(result.bottlenecks.length);
    });
  });

  describe("3. Drill-Down Case Querying & Pagination", () => {
    it("returns paginated cases with calculated pipeline and dwell days", async () => {
      const res = await operationsAnalyticsService.getDrillDownCases({ page: 1, limit: 10 });

      expect(res).toHaveProperty("cases");
      expect(res).toHaveProperty("total");
      expect(res).toHaveProperty("page", 1);
      expect(res).toHaveProperty("limit", 10);
      expect(res.cases).toBeInstanceOf(Array);

      if (res.cases.length > 0) {
        const c = res.cases[0];
        expect(c).toHaveProperty("id");
        expect(c).toHaveProperty("caseNumber");
        expect(c).toHaveProperty("applicationNumber");
        expect(c).toHaveProperty("schemeCode");
        expect(c).toHaveProperty("currentStage");
        expect(c).toHaveProperty("currentState");
        expect(c).toHaveProperty("daysInPipeline");
        expect(c).toHaveProperty("daysInCurrentStage");
        expect(typeof c.daysInPipeline).toBe("number");
        expect(typeof c.daysInCurrentStage).toBe("number");
      }
    });

    it("filters drilldown cases by stage and unassigned status", async () => {
      const stageRes = await operationsAnalyticsService.getDrillDownCases({
        stage: CaseStage.OFFICER_REVIEW,
        unassignedOnly: true,
      });

      for (const c of stageRes.cases) {
        expect(c.currentStage).toBe(CaseStage.OFFICER_REVIEW);
        expect(c.officerAssignedName).toBeNull();
      }
    });
  });
});
