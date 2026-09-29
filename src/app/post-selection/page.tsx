"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { PostSelectionKpiSummary } from "@/components/post-selection/post-selection-kpi-summary";
import { ScholarRegistryTable } from "@/components/post-selection/scholar-registry-table";
import { RenewalsDeskTable } from "@/components/post-selection/renewals-desk-table";
import { DisbursementsTable } from "@/components/post-selection/disbursements-table";
import { SubmitRenewalDialog } from "@/components/post-selection/submit-renewal-dialog";
import { ReviewRenewalDialog } from "@/components/post-selection/review-renewal-dialog";
import { UpdateDisbursementDialog } from "@/components/post-selection/update-disbursement-dialog";
import {
  PostSelectionMetricsDTO,
  ScholarSummaryDTO,
  RenewalDTO,
  DisbursementDTO,
} from "@/server/domain/post-selection/types";
import { GraduationCap, LayoutDashboard, Users, Clock, IndianRupee, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function PostSelectionPage() {
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role || "APPLICANT";

  const [activeTab, setActiveTab] = useState<
    "overview" | "scholars" | "renewals" | "disbursements"
  >("overview");
  const [metrics, setMetrics] = useState<PostSelectionMetricsDTO | null>(null);
  const [scholars, setScholars] = useState<ScholarSummaryDTO[]>([]);
  const [totalScholars, setTotalScholars] = useState(0);
  const [renewals, setRenewals] = useState<RenewalDTO[]>([]);
  const [totalRenewals, setTotalRenewals] = useState(0);
  const [disbursements, setDisbursements] = useState<DisbursementDTO[]>([]);
  const [totalDisbursements, setTotalDisbursements] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [scholarFilters, setScholarFilters] = useState<{
    search?: string;
    schemeCode?: string;
    scholarStatus?: string;
  }>({});
  const [renewalFilters, setRenewalFilters] = useState<{ status?: string; schemeCode?: string }>(
    {}
  );
  const [disbursementFilters, setDisbursementFilters] = useState<{ status?: string }>({});

  const [selectedRenewalForSubmit, setSelectedRenewalForSubmit] = useState<RenewalDTO | null>(null);
  const [selectedRenewalForReview, setSelectedRenewalForReview] = useState<RenewalDTO | null>(null);
  const [selectedDisbursement, setSelectedDisbursement] = useState<DisbursementDTO | null>(null);

  const fetchOverview = async () => {
    try {
      const res = await fetch("/api/post-selection/overview");
      if (res.ok) {
        const json = await res.json();
        setMetrics(json.data);
      }
    } catch (e) {
      console.error("Failed to load metrics", e);
    }
  };

  const fetchScholars = async () => {
    try {
      const params = new URLSearchParams();
      if (scholarFilters.search) params.append("search", scholarFilters.search);
      if (scholarFilters.schemeCode) params.append("schemeCode", scholarFilters.schemeCode);
      if (scholarFilters.scholarStatus)
        params.append("scholarStatus", scholarFilters.scholarStatus);

      const res = await fetch(`/api/post-selection/scholars?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setScholars(json.data.scholars);
        setTotalScholars(json.data.total);
      }
    } catch (e) {
      console.error("Failed to load scholars", e);
    }
  };

  const fetchRenewals = async () => {
    try {
      const params = new URLSearchParams();
      if (renewalFilters.status) params.append("status", renewalFilters.status);
      if (renewalFilters.schemeCode) params.append("schemeCode", renewalFilters.schemeCode);

      const res = await fetch(`/api/post-selection/renewals?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setRenewals(json.data.renewals);
        setTotalRenewals(json.data.total);
      }
    } catch (e) {
      console.error("Failed to load renewals", e);
    }
  };

  const fetchDisbursements = async () => {
    try {
      const params = new URLSearchParams();
      if (disbursementFilters.status) params.append("status", disbursementFilters.status);

      const res = await fetch(`/api/post-selection/disbursements?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setDisbursements(json.data.disbursements);
        setTotalDisbursements(json.data.total);
      }
    } catch (e) {
      console.error("Failed to load disbursements", e);
    }
  };

  const loadAllData = async () => {
    setIsLoading(true);
    await Promise.all([fetchOverview(), fetchScholars(), fetchRenewals(), fetchDisbursements()]);
    setIsLoading(false);
  };

  useEffect(() => {
    loadAllData();
  }, [scholarFilters, renewalFilters, disbursementFilters]);

  return (
    <div className="container mx-auto max-w-7xl space-y-6 px-4 py-8">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gov-slate text-white shadow-md">
            <GraduationCap className="h-7 w-7 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1
                className="text-2xl font-bold tracking-tight text-slate-900"
                data-testid="post-selection-heading"
              >
                Post-Selection &amp; Renewal Console
              </h1>
              <Badge
                variant="outline"
                className="border-amber-300 bg-amber-50 text-xs text-amber-800"
              >
                Phase 2K Active
              </Badge>
            </div>
            <p className="text-xs text-slate-500">
              National Fellowships &amp; Scholarships for Scheduled Tribes &bull; Ministry of Tribal
              Affairs
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-1.5 border-slate-300 text-xs text-slate-700 hover:bg-slate-50"
            onClick={loadAllData}
            data-testid="refresh-btn"
          >
            <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
            <span>Refresh Live Data</span>
          </Button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <PostSelectionKpiSummary metrics={metrics} isLoading={isLoading} />

      {/* Main Tabs */}
      <div className="flex rounded-t-lg border-b border-slate-200 bg-white px-2 shadow-sm">
        {[
          { id: "overview", label: "Operations Overview", icon: LayoutDashboard },
          { id: "scholars", label: `Scholar Registry (${totalScholars})`, icon: Users },
          { id: "renewals", label: `Annual Renewals Desk (${totalRenewals})`, icon: Clock },
          {
            id: "disbursements",
            label: `Mock PFMS Disbursements (${totalDisbursements})`,
            icon: IndianRupee,
          },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-medium transition-colors ${
                isActive
                  ? "border-gov-slate font-semibold text-gov-slate"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
              data-testid={`main-tab-${tab.id}`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Overview */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Scheme Distribution */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="mb-3 flex items-center justify-between text-sm font-bold text-slate-800">
                <span>Fellowship Scheme Cohorts</span>
                <Badge variant="outline" className="text-[10px]">
                  Real DB Data
                </Badge>
              </h3>
              <div className="space-y-3">
                {metrics?.schemeDistribution.map((sch) => (
                  <div
                    key={sch.schemeCode}
                    className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 p-3"
                  >
                    <div>
                      <div className="text-xs font-semibold text-slate-900">{sch.schemeName}</div>
                      <div className="mt-0.5 text-[11px] text-slate-500">
                        Code: {sch.schemeCode}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-slate-900">
                        {sch.scholarCount} Scholars
                      </div>
                      <div className="text-[11px] text-emerald-600">{sch.activeCount} Active</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions & Policy Card */}
            <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800">
                Post-Selection Policy &amp; Workflow Rules
              </h3>
              <ul className="space-y-2.5 text-xs text-slate-600">
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gov-slate"></span>
                  <span>
                    <strong>Authoritative Officer Adjudication:</strong> Renewal decisions (Approve,
                    Deficiency, Reject) require verified human officer review with mandatory audit
                    remarks.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gov-slate"></span>
                  <span>
                    <strong>Multi-Year Continuation:</strong> Scholars submit annual progress
                    reports with supervisor recommendation and research output metrics.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gov-slate"></span>
                  <span>
                    <strong>Simulated PFMS DBT:</strong> Disbursement installments reflect financial
                    year milestones and synthetic batch settlement numbers.
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Scholars Table Preview in Overview */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">Recent Scholars in Registry</h3>
              <Button
                size="sm"
                variant="ghost"
                className="text-xs text-gov-slate"
                onClick={() => setActiveTab("scholars")}
              >
                View All Scholars &rarr;
              </Button>
            </div>
            <ScholarRegistryTable
              scholars={scholars.slice(0, 5)}
              isLoading={isLoading}
              total={totalScholars}
              onFilterChange={setScholarFilters}
            />
          </div>
        </div>
      )}

      {/* Tab 2: Scholars Registry */}
      {activeTab === "scholars" && (
        <ScholarRegistryTable
          scholars={scholars}
          isLoading={isLoading}
          total={totalScholars}
          onFilterChange={setScholarFilters}
        />
      )}

      {/* Tab 3: Renewals Desk */}
      {activeTab === "renewals" && (
        <RenewalsDeskTable
          renewals={renewals}
          isLoading={isLoading}
          total={totalRenewals}
          userRole={userRole}
          onFilterChange={setRenewalFilters}
          onSubmitRenewal={(r) => setSelectedRenewalForSubmit(r)}
          onReviewRenewal={(r) => setSelectedRenewalForReview(r)}
        />
      )}

      {/* Tab 4: Disbursements */}
      {activeTab === "disbursements" && (
        <DisbursementsTable
          disbursements={disbursements}
          isLoading={isLoading}
          total={totalDisbursements}
          userRole={userRole}
          onFilterChange={setDisbursementFilters}
          onUpdateStatus={(d) => setSelectedDisbursement(d)}
        />
      )}

      {/* Modal Dialogs */}
      <SubmitRenewalDialog
        renewal={selectedRenewalForSubmit}
        isOpen={!!selectedRenewalForSubmit}
        onClose={() => setSelectedRenewalForSubmit(null)}
        onSuccess={loadAllData}
      />

      <ReviewRenewalDialog
        renewal={selectedRenewalForReview}
        isOpen={!!selectedRenewalForReview}
        onClose={() => setSelectedRenewalForReview(null)}
        onSuccess={loadAllData}
      />

      <UpdateDisbursementDialog
        disbursement={selectedDisbursement}
        isOpen={!!selectedDisbursement}
        onClose={() => setSelectedDisbursement(null)}
        onSuccess={loadAllData}
      />
    </div>
  );
}
