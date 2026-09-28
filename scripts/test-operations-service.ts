import { operationsAnalyticsService } from "../src/server/services/operations-analytics.service";

async function main() {
  console.log("=== Testing OperationsAnalyticsService with real database ===");

  console.log("\n1. Testing getOverview()...");
  const overview = await operationsAnalyticsService.getOverview({});
  console.log("Overview Success!");
  console.log("KPI Summary:", JSON.stringify(overview.kpis, null, 2));
  console.log("Stage Distribution count:", overview.stageDistribution.length);
  overview.stageDistribution.forEach((s) => {
    console.log(
      `  - ${s.stage} (${s.stageLabel}): ${s.totalCases} cases, avgDwellDays=${s.avgDwellDays}`
    );
  });
  console.log(
    "Aging Distribution:",
    overview.agingDistribution.map(
      (a) => `${a.label} (${a.bucket}): ${a.count} cases (${a.percentageOfActive}%)`
    )
  );
  console.log("Deficiency Heatmap count:", overview.deficiencyHeatmap.length);
  overview.deficiencyHeatmap.forEach((d) => {
    console.log(
      `  - [${d.schemeCode}] ${d.documentType} / ${d.deficiencyType}: ${d.openCount} open / ${d.totalCount} total`
    );
  });
  console.log("Officer Workload count:", overview.officerWorkload.length);
  overview.officerWorkload.forEach((o) => {
    console.log(
      `  - Officer ${o.officerName}: ${o.assignedCases} assigned (${o.openCases} open, ${o.completedCases} completed)`
    );
  });
  console.log("Scheme Summary count:", overview.schemeSummary.length);
  overview.schemeSummary.forEach((sc) => {
    console.log(
      `  - Scheme [${sc.schemeCode}] ${sc.schemeName}: ${sc.totalCases} cases (${sc.activeCases} active, ${sc.deficientCases} deficient)`
    );
  });

  console.log("\n2. Testing getBottlenecks()...");
  const bottlenecks = await operationsAnalyticsService.getBottlenecks({});
  console.log("Active Bottlenecks count:", bottlenecks.bottlenecks.length);
  console.log("Severity breakdown:", JSON.stringify(bottlenecks.summary, null, 2));
  bottlenecks.bottlenecks.forEach((b) => {
    console.log(
      `  - [${b.severity}] ${b.type}: ${b.title} (measured: ${b.metricValue} ${b.unit}, threshold: ${b.thresholdValue} ${b.unit})`
    );
  });

  console.log("\n3. Testing getDrillDownCases()...");
  const cases = await operationsAnalyticsService.getDrillDownCases({ page: 1, limit: 10 });
  console.log("Drill-down Cases count:", cases.total, "Returned in page:", cases.cases.length);
  cases.cases.forEach((c) => {
    console.log(
      `  - Case ${c.caseNumber} | App ${c.applicationNumber} | Scheme ${c.schemeCode} | Stage ${c.currentStage} | State ${c.currentState} | PipelineAge ${c.daysInPipeline}d | Deficiencies ${c.openDeficienciesCount}`
    );
  });

  console.log("\n=== ALL OPERATIONS SERVICE METHODS VERIFIED ON REAL DATABASE! ===");
}

main().catch((err) => {
  console.error("Operations test error:", err);
  process.exit(1);
});
