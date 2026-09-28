"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  OfficerQueueItemDTO,
  OfficerQueueResponseDTO,
  OfficerQueueFilterQuery,
} from "@/server/domain/officer/types";
import {
  ShieldCheck,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ArrowRight,
  FileText,
  UserCheck,
  RotateCw,
  Layers,
  AlertCircle,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface CaseQueueTableProps {
  initialData: OfficerQueueResponseDTO;
  currentOfficerName?: string;
}

export function CaseQueueTable({ initialData, currentOfficerName }: CaseQueueTableProps) {
  const [data, setData] = useState<OfficerQueueResponseDTO>(initialData);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<OfficerQueueFilterQuery>({
    schemeCode: "ALL",
    sortBy: "oldestSubmission",
    page: 1,
    pageSize: 20,
  });
  const [searchTerm, setSearchTerm] = useState("");

  const fetchQueue = async (updatedFilters: OfficerQueueFilterQuery) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (updatedFilters.schemeCode && updatedFilters.schemeCode !== "ALL") {
        params.set("schemeCode", updatedFilters.schemeCode);
      }
      if (updatedFilters.currentStage) {
        params.set("currentStage", updatedFilters.currentStage);
      }
      if (updatedFilters.currentState) {
        params.set("currentState", updatedFilters.currentState);
      }
      if (updatedFilters.assessment) {
        params.set("assessment", updatedFilters.assessment);
      }
      if (updatedFilters.hasDeficiencies !== undefined) {
        params.set("hasDeficiencies", String(updatedFilters.hasDeficiencies));
      }
      if (updatedFilters.search) {
        params.set("search", updatedFilters.search);
      }
      if (updatedFilters.assignedToMe) {
        params.set("assignedToMe", "true");
      }
      if (updatedFilters.sortBy) {
        params.set("sortBy", updatedFilters.sortBy);
      }
      params.set("page", String(updatedFilters.page || 1));
      params.set("pageSize", String(updatedFilters.pageSize || 20));

      const res = await fetch(`/api/officer/cases?${params.toString()}`);
      const json = await res.json();
      if (res.ok && json.success) {
        setData(json.data);
      }
    } catch {
      // Keep existing data on fetch error
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = { ...filters, search: searchTerm, page: 1 };
    setFilters(updated);
    fetchQueue(updated);
  };

  const handleFilterChange = (key: keyof OfficerQueueFilterQuery, value: unknown) => {
    const updated = { ...filters, [key]: value, page: 1 };
    setFilters(updated);
    fetchQueue(updated);
  };

  const getAssessmentBadge = (assessment: OfficerQueueItemDTO["eligibilityAssessment"]) => {
    switch (assessment) {
      case "ELIGIBLE_ASSESSED":
        return (
          <Badge variant="success" className="text-xs">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Eligible
          </Badge>
        );
      case "NOT_ELIGIBLE_ASSESSED":
        return (
          <Badge variant="destructive" className="text-xs">
            <XCircle className="mr-1 h-3 w-3" />
            Ineligible
          </Badge>
        );
      case "REVIEW_REQUIRED":
        return (
          <Badge variant="warning" className="text-xs">
            <AlertTriangle className="mr-1 h-3 w-3" />
            Review Needed
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-xs">
            Unassessed
          </Badge>
        );
    }
  };

  const getStageBadge = (stage: string) => {
    switch (stage) {
      case "OFFICER_REVIEW":
        return <Badge variant="secondary">Officer Review</Badge>;
      case "DEFICIENCY_PENDING":
        return <Badge variant="destructive">Deficiency Pending</Badge>;
      case "COMMITTEE_SELECTION":
        return <Badge variant="default">Committee Selection</Badge>;
      case "AUTOMATED_VERIFICATION":
        return <Badge variant="outline">Automated Verif.</Badge>;
      default:
        return <Badge variant="outline">{stage.replace(/_/g, " ")}</Badge>;
    }
  };

  return (
    <div className="space-y-6" data-testid="officer-queue-container">
      {/* KPI Header Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Assigned Cases
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-gov-slate">
              {data.counts.totalAssigned}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-slate-500">
            Active in your review jurisdiction
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider text-amber-600">
              Action Required
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-amber-600">
              {data.counts.actionRequired}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-slate-500">
            Pending applicant or officer triage
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider text-rose-600">
              Deficiencies Pending
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-rose-600">
              {data.counts.deficiencyPending}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-slate-500">
            Awaiting candidate replacement docs
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
              Ready for Review
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-emerald-600">
              {data.counts.readyForReview}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-slate-500">
            OCR complete &bull; Rules evaluated
          </CardContent>
        </Card>
      </div>

      {/* Filter & Search Bar */}
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardContent className="space-y-3 p-4">
          <form
            onSubmit={handleSearch}
            className="flex flex-col justify-between gap-3 md:flex-row md:items-center"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by case number, application number, or applicant name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-gov-slate focus:outline-none focus:ring-1 focus:ring-gov-slate"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button type="submit" variant="default" size="sm">
                Search
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm("");
                  const reset: OfficerQueueFilterQuery = {
                    schemeCode: "ALL",
                    sortBy: "oldestSubmission",
                    page: 1,
                  };
                  setFilters(reset);
                  fetchQueue(reset);
                }}
              >
                Reset
              </Button>
            </div>
          </form>

          {/* Quick Filter Chips */}
          <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-2 text-xs text-slate-600">
            <span className="font-semibold text-slate-500">Scheme:</span>
            {["ALL", "NFST", "NOS"].map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => handleFilterChange("schemeCode", code)}
                className={`rounded-full px-2.5 py-0.5 font-medium transition-colors ${
                  filters.schemeCode === code
                    ? "bg-gov-slate text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {code}
              </button>
            ))}

            <span className="ml-3 font-semibold text-slate-500">Stage:</span>
            {[
              { label: "All Stages", value: undefined },
              { label: "Officer Review", value: "OFFICER_REVIEW" },
              { label: "Deficiency Pending", value: "DEFICIENCY_PENDING" },
              { label: "Committee Selection", value: "COMMITTEE_SELECTION" },
            ].map((st) => (
              <button
                key={st.label}
                type="button"
                onClick={() => handleFilterChange("currentStage", st.value)}
                className={`rounded-full px-2.5 py-0.5 font-medium transition-colors ${
                  filters.currentStage === st.value
                    ? "bg-gov-slate text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {st.label}
              </button>
            ))}

            <span className="ml-3 font-semibold text-slate-500">Sort:</span>
            <select
              value={filters.sortBy || "oldestSubmission"}
              onChange={(e) => handleFilterChange("sortBy", e.target.value)}
              className="rounded border border-slate-200 bg-white px-2 py-0.5 text-xs text-slate-700"
            >
              <option value="oldestSubmission">Oldest Submission (SLA Priority)</option>
              <option value="newestSubmission">Newest Submission</option>
              <option value="actionRequiredFirst">Action Required First</option>
              <option value="recentlyUpdated">Recently Updated</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Case Queue Table */}
      <Card className="overflow-hidden border-slate-200 bg-white shadow-sm">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-gov-slate" />
              <CardTitle className="text-sm font-semibold text-slate-900">
                Verification Queue ({data.total} Cases)
              </CardTitle>
            </div>
            {loading && (
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <RotateCw className="h-3.5 w-3.5 animate-spin" />
                Updating...
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                <tr>
                  <th className="px-4 py-3">Case &amp; Application</th>
                  <th className="px-4 py-3">Applicant</th>
                  <th className="px-4 py-3">Scheme</th>
                  <th className="px-4 py-3">Stage &amp; State</th>
                  <th className="px-4 py-3">Eligibility Assessment</th>
                  <th className="px-4 py-3">Deficiencies</th>
                  <th className="px-4 py-3">Submitted</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.items.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500">
                      No cases match the selected filter criteria.
                    </td>
                  </tr>
                ) : (
                  data.items.map((item) => (
                    <tr
                      key={item.caseId}
                      className="transition-colors hover:bg-slate-50/80"
                      data-testid={`case-row-${item.caseNumber}`}
                    >
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{item.caseNumber}</div>
                        <div className="text-[11px] text-slate-400">{item.applicationNumber}</div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{item.applicantName}</div>
                        <div className="text-[11px] text-slate-500">
                          {item.applicantCategory} &bull; {item.stateDomicile || "N/A"}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <Badge variant="outline" className="font-semibold text-slate-700">
                          {item.schemeCode}
                        </Badge>
                        <span className="ml-1 text-[11px] text-slate-400">
                          v{item.schemeVersionNumber}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <div>{getStageBadge(item.currentStage)}</div>
                          <div className="text-[10px] text-slate-500">
                            State: <span className="font-medium">{item.currentState}</span>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        {getAssessmentBadge(item.eligibilityAssessment)}
                      </td>

                      <td className="px-4 py-3">
                        {item.openDeficiencyCount > 0 ? (
                          <Badge variant="destructive" className="text-xs">
                            {item.openDeficiencyCount} Open
                          </Badge>
                        ) : (
                          <span className="text-slate-400">&mdash;</span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-slate-500">
                        {new Date(item.submittedAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/officer/cases/${item.caseId}`}
                          className="inline-flex items-center justify-center gap-1 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-900 shadow-sm transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                          data-testid={`review-btn-${item.caseId}`}
                        >
                          Review
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
