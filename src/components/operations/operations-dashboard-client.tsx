"use client";

import React, { useState, useCallback } from "react";
import {
  OperationsOverviewDTO,
  OperationsBottlenecksDTO,
  BottleneckItemDTO,
  AgingBucket,
  DeficiencyFrictionItemDTO,
} from "@/server/domain/operations/types";
import { DrillDownCasesQuery } from "@/server/domain/operations/validators";
import { CaseStage } from "@prisma/client";
import { ControlTowerHeader } from "./control-tower-header";
import { KpiSummaryCards } from "./kpi-summary-cards";
import { StageDistributionCard } from "./stage-distribution-card";
import { BottleneckAlertsCard } from "./bottleneck-alerts-card";
import { AgingSlaCard } from "./aging-sla-card";
import { DeficiencyHeatmapCard } from "./deficiency-heatmap-card";
import { DrillDownCaseDrawer } from "./drill-down-case-drawer";
import { OperationsBreakdownCard } from "./operations-breakdown-card";
import { IntegrationStatusCard } from "@/components/integrations/integration-status-card";
import { Layers, AlertOctagon, Clock, TrendingUp } from "lucide-react";

interface OperationsDashboardClientProps {
  initialOverview: OperationsOverviewDTO;
  initialBottlenecks: OperationsBottlenecksDTO;
  userName?: string;
  userRole?: string;
  schemes: Array<{ code: string; name: string }>;
}

type TabType = "stage_flow" | "bottlenecks" | "aging" | "deficiency_heatmap";

export function OperationsDashboardClient({
  initialOverview,
  initialBottlenecks,
  userName,
  userRole,
  schemes,
}: OperationsDashboardClientProps) {
  const [overview, setOverview] = useState<OperationsOverviewDTO>(initialOverview);
  const [bottlenecks, setBottlenecks] = useState<OperationsBottlenecksDTO>(initialBottlenecks);
  const [schemeCode, setSchemeCode] = useState<string>("ALL");
  const [activeTab, setActiveTab] = useState<TabType>("stage_flow");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Drill-down Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerTitle, setDrawerTitle] = useState("");
  const [drawerSubtitle, setDrawerSubtitle] = useState("");
  const [drillDownQuery, setDrillDownQuery] = useState<DrillDownCasesQuery>({});

  const fetchData = useCallback(async (selectedScheme: string) => {
    setIsLoading(true);
    try {
      const schemeParam = selectedScheme !== "ALL" ? `?schemeCode=${selectedScheme}` : "";
      const [overviewRes, bottlenecksRes] = await Promise.all([
        fetch(`/api/operations/overview${schemeParam}`),
        fetch(`/api/operations/bottlenecks${schemeParam}`),
      ]);

      if (overviewRes.ok && bottlenecksRes.ok) {
        const overviewJson = await overviewRes.json();
        const bottlenecksJson = await bottlenecksRes.json();
        setOverview(overviewJson.data);
        setBottlenecks(bottlenecksJson.data);
      }
    } catch (err) {
      console.error("Failed to refresh operations data", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSchemeChange = (code: string) => {
    setSchemeCode(code);
    fetchData(code);
  };

  const handleRefresh = () => {
    fetchData(schemeCode);
  };

  // Drilldown triggers
  const handleKpiClick = (type: string) => {
    if (type === "DEFICIENCIES") {
      setDrawerTitle("Cases with Open Deficiencies");
      setDrawerSubtitle(
        "Active application dossiers requiring applicant remediation or officer recheck."
      );
      setDrillDownQuery({
        schemeCode: schemeCode !== "ALL" ? schemeCode : undefined,
        hasOpenDeficienciesOnly: true,
      });
      setIsDrawerOpen(true);
    } else if (type === "ALL_CASES") {
      setDrawerTitle("All Pipeline Cases");
      setDrawerSubtitle("Full scholarship application dossier cohort.");
      setDrillDownQuery({
        schemeCode: schemeCode !== "ALL" ? schemeCode : undefined,
      });
      setIsDrawerOpen(true);
    } else if (type === "VERIFICATION") {
      setDrawerTitle("Cases Under Verification");
      setDrawerSubtitle("Cases in automated verification or officer review.");
      setDrillDownQuery({
        underVerificationOnly: true,
        schemeCode: schemeCode !== "ALL" ? schemeCode : undefined,
      });
      setIsDrawerOpen(true);
    } else if (type === "COMPLETED") {
      setDrawerTitle("Completed or Closed Cases");
      setDrawerSubtitle("Cases in a terminal stage or COMPLETED state.");
      setDrillDownQuery({
        completedOnly: true,
        schemeCode: schemeCode !== "ALL" ? schemeCode : undefined,
      });
      setIsDrawerOpen(true);
    } else if (type === "AWAITING_APPLICANT") {
      setDrawerTitle("Cases Awaiting Applicant Action");
      setDrawerSubtitle("Cases whose current workflow state is ACTION_REQUIRED.");
      setDrillDownQuery({
        state: "ACTION_REQUIRED",
        schemeCode: schemeCode !== "ALL" ? schemeCode : undefined,
      });
      setIsDrawerOpen(true);
    } else if (type === "PENDING") {
      setDrawerTitle("Pending Cases");
      setDrawerSubtitle("Active cases currently in PENDING state.");
      setDrillDownQuery({
        state: "PENDING",
        schemeCode: schemeCode !== "ALL" ? schemeCode : undefined,
      });
      setIsDrawerOpen(true);
    } else if (type === "OFFICER_ATTENTION") {
      setDrawerTitle("Cases Requiring Officer Attention");
      setDrawerSubtitle("Officer review, blocked, or escalated cases.");
      setDrillDownQuery({
        officerAttentionOnly: true,
        schemeCode: schemeCode !== "ALL" ? schemeCode : undefined,
      });
      setIsDrawerOpen(true);
    }
  };

  const handleInspectStage = (stage: CaseStage) => {
    setDrawerTitle(`Cases in ${stage.replace(/_/g, " ")}`);
    setDrawerSubtitle(`Cases currently at stage ${stage}.`);
    setDrillDownQuery({
      stage,
      schemeCode: schemeCode !== "ALL" ? schemeCode : undefined,
    });
    setIsDrawerOpen(true);
  };

  const handleInspectBottleneck = (item: BottleneckItemDTO) => {
    setDrawerTitle(`Bottleneck: ${item.title}`);
    setDrawerSubtitle(item.explanation);
    setDrillDownQuery({
      stage: item.drillDownFilters.stage,
      state: item.drillDownFilters.state,
      deficiencyType: item.drillDownFilters.deficiencyType,
      documentType: item.drillDownFilters.documentType,
      unassignedOnly: item.drillDownFilters.unassignedOnly,
      blockedOnly: item.drillDownFilters.blockedOnly,
      agingBucket: item.drillDownFilters.agingBucket,
      assignedOfficerId: item.drillDownFilters.assignedOfficerId,
      schemeCode:
        item.drillDownFilters.schemeCode || (schemeCode !== "ALL" ? schemeCode : undefined),
    });
    setIsDrawerOpen(true);
  };

  const handleInspectOfficer = (officerId: string, officerName: string) => {
    setDrawerTitle(`Cases Assigned to ${officerName}`);
    setDrawerSubtitle("Current and completed cases assigned to this officer.");
    setDrillDownQuery({ assignedOfficerId: officerId });
    setIsDrawerOpen(true);
  };

  const handleInspectScheme = (code: string) => {
    setDrawerTitle(`Cases in ${code}`);
    setDrawerSubtitle("Cases associated with this configured scheme.");
    setDrillDownQuery({ schemeCode: code });
    setIsDrawerOpen(true);
  };

  const handleInspectAging = (bucket: AgingBucket) => {
    setDrawerTitle(`Cases in Aging Cohort: ${bucket}`);
    setDrawerSubtitle(`Active cases grouped by processing pipeline dwell duration.`);
    setDrillDownQuery({
      agingBucket: bucket,
      schemeCode: schemeCode !== "ALL" ? schemeCode : undefined,
    });
    setIsDrawerOpen(true);
  };

  const handleInspectDeficiency = (item: DeficiencyFrictionItemDTO) => {
    setDrawerTitle(`Deficiency Friction: ${item.deficiencyType.replace(/_/g, " ")}`);
    setDrawerSubtitle(`Cases with open ${item.deficiencyType} on ${item.documentType}.`);
    setDrillDownQuery({
      deficiencyType: item.deficiencyType,
      documentType: item.documentType !== "UNSPECIFIED" ? item.documentType : undefined,
      schemeCode: item.schemeCode,
    });
    setIsDrawerOpen(true);
  };

  return (
    <div className="space-y-6 pb-12" data-testid="operations-control-tower-container">
      {/* Header */}
      <ControlTowerHeader
        schemeCode={schemeCode}
        onSchemeChange={handleSchemeChange}
        isLoading={isLoading}
        onRefresh={handleRefresh}
        userRole={userRole}
        userName={userName}
        schemes={schemes}
      />

      <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6">
        {/* KPI Cards */}
        <KpiSummaryCards kpis={overview.kpis} onFilterClick={handleKpiClick} />

        {/* Tab Controls */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
            <button
              onClick={() => setActiveTab("stage_flow")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition-all ${
                activeTab === "stage_flow"
                  ? "shadow-xs bg-gov-slate text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
              }`}
              data-testid="tab-stage-flow"
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Stage Pipeline Flow</span>
            </button>

            <button
              onClick={() => setActiveTab("bottlenecks")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition-all ${
                activeTab === "bottlenecks"
                  ? "shadow-xs bg-gov-slate text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
              }`}
              data-testid="tab-bottlenecks"
            >
              <AlertOctagon className="h-3.5 w-3.5" />
              <span>Bottleneck Intelligence ({bottlenecks.bottlenecks.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("aging")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition-all ${
                activeTab === "aging"
                  ? "shadow-xs bg-gov-slate text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
              }`}
              data-testid="tab-aging"
            >
              <Clock className="h-3.5 w-3.5" />
              <span>Aging &amp; Dwell Cohorts</span>
            </button>

            <button
              onClick={() => setActiveTab("deficiency_heatmap")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition-all ${
                activeTab === "deficiency_heatmap"
                  ? "shadow-xs bg-gov-slate text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
              }`}
              data-testid="tab-deficiencies"
            >
              <TrendingUp className="h-3.5 w-3.5" />
              <span>Deficiency Friction Heatmap</span>
            </button>
          </div>

          {/* Active Tab Content */}
          {activeTab === "stage_flow" && (
            <div className="space-y-4">
              <StageDistributionCard
                stageDistribution={overview.stageDistribution}
                onInspectStage={handleInspectStage}
              />
              <OperationsBreakdownCard
                officerWorkload={overview.officerWorkload}
                schemeSummary={overview.schemeSummary}
                onInspectOfficer={handleInspectOfficer}
                onInspectScheme={handleInspectScheme}
              />
            </div>
          )}

          {activeTab === "bottlenecks" && (
            <BottleneckAlertsCard
              bottlenecks={bottlenecks.bottlenecks}
              onInspectBottleneck={handleInspectBottleneck}
            />
          )}

          {activeTab === "aging" && (
            <AgingSlaCard
              agingDistribution={overview.agingDistribution}
              onInspectAging={handleInspectAging}
            />
          )}

          {activeTab === "deficiency_heatmap" && (
            <DeficiencyHeatmapCard
              deficiencyHeatmap={overview.deficiencyHeatmap}
              onInspectDeficiency={handleInspectDeficiency}
            />
          )}

          {/* External Government Integration Adapters Status */}
          <div className="pt-2">
            <IntegrationStatusCard />
          </div>
        </div>
      </div>

      {/* Drill-down Drawer */}
      <DrillDownCaseDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={drawerTitle}
        subtitle={drawerSubtitle}
        query={drillDownQuery}
      />
    </div>
  );
}
