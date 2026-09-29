"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RenewalDTO } from "@/server/domain/post-selection/types";
import { Clock, CheckCircle2, AlertTriangle, FileText, ChevronRight } from "lucide-react";

interface RenewalsDeskTableProps {
  renewals: RenewalDTO[];
  isLoading: boolean;
  total: number;
  userRole: string;
  onFilterChange: (filters: { status?: string; schemeCode?: string }) => void;
  onSubmitRenewal?: (renewal: RenewalDTO) => void;
  onReviewRenewal?: (renewal: RenewalDTO) => void;
}

export function RenewalsDeskTable({
  renewals,
  isLoading,
  total,
  userRole,
  onFilterChange,
  onSubmitRenewal,
  onReviewRenewal,
}: RenewalsDeskTableProps) {
  const [selectedStatus, setSelectedStatus] = useState("");
  const isOfficerOrAdmin =
    userRole === "VERIFICATION_OFFICER" ||
    userRole === "SCHEME_ADMIN" ||
    userRole === "OPERATIONS_DIRECTOR";

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return (
          <Badge className="border-emerald-200 bg-emerald-100 text-emerald-800">Approved</Badge>
        );
      case "UNDER_REVIEW":
        return (
          <Badge className="border-indigo-200 bg-indigo-100 text-indigo-800">Under Review</Badge>
        );
      case "SUBMITTED":
        return <Badge className="border-blue-200 bg-blue-100 text-blue-800">Submitted</Badge>;
      case "DEFICIENT":
        return <Badge className="border-rose-200 bg-rose-100 text-rose-800">Deficient</Badge>;
      case "REJECTED":
        return <Badge className="border-red-200 bg-red-100 text-red-800">Rejected</Badge>;
      case "UPCOMING":
      default:
        return <Badge className="border-slate-200 bg-slate-100 text-slate-700">Upcoming</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase text-slate-500">Filter Status:</span>
          <select
            className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700"
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              onFilterChange({ status: e.target.value || undefined });
            }}
            data-testid="renewal-status-filter"
          >
            <option value="">All Renewal Stages</option>
            <option value="UPCOMING">Upcoming Cycles</option>
            <option value="SUBMITTED">Submitted Progress</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="DEFICIENT">Deficient Cycles</option>
            <option value="APPROVED">Approved Cycles</option>
          </select>
        </div>

        <div className="text-xs text-slate-500">
          Showing <span className="font-semibold text-slate-700">{renewals.length}</span> cycles
        </div>
      </div>

      {/* Renewals Table */}
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm" data-testid="renewals-table">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-600">
              <tr>
                <th className="px-4 py-3">Scholar &amp; Scheme</th>
                <th className="px-4 py-3">Renewal Cycle</th>
                <th className="px-4 py-3">Academic Year</th>
                <th className="px-4 py-3">Supervisor Rec.</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Remarks / Review</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-gov-slate border-t-transparent"></div>
                    <p className="mt-2 text-xs">Loading renewals...</p>
                  </td>
                </tr>
              ) : renewals.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    <FileText className="mx-auto h-8 w-8 text-slate-300" />
                    <p className="mt-2 font-medium">No renewal cycles found</p>
                    <p className="text-xs text-slate-400">
                      Scheduled renewal milestones will appear here.
                    </p>
                  </td>
                </tr>
              ) : (
                renewals.map((r) => (
                  <tr
                    key={r.id}
                    className="transition-colors hover:bg-slate-50"
                    data-testid={`renewal-row-${r.id}`}
                  >
                    <td className="px-4 py-3.5">
                      <div className="font-medium text-slate-900">{r.scholarName || "Scholar"}</div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Badge variant="outline" className="py-0 text-[10px]">
                          {r.schemeCode}
                        </Badge>
                        <span>{r.caseNumber}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-medium text-slate-800">
                      Year {r.renewalCycle} Renewal
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-700">{r.academicYear}</td>
                    <td className="px-4 py-3.5">
                      {r.supervisorRecommendation ? (
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            r.supervisorRecommendation === "RECOMMENDED"
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {r.supervisorRecommendation}
                        </Badge>
                      ) : (
                        <span className="text-xs text-slate-400">Awaiting submission</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">{getStatusBadge(r.status)}</td>
                    <td
                      className="max-w-[200px] truncate px-4 py-3.5 text-xs text-slate-600"
                      title={r.officerRemarks || r.deficiencyDetails || undefined}
                    >
                      {r.officerRemarks ||
                        r.deficiencyDetails ||
                        (r.progressSummary ? `${r.publicationsCount} publications reported` : "—")}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* If applicant and upcoming/deficient, show submit */}
                        {(r.status === "UPCOMING" ||
                          r.status === "DEFICIENT" ||
                          r.status === "DRAFT") &&
                          onSubmitRenewal && (
                            <Button
                              size="sm"
                              variant="default"
                              className="h-8 bg-gov-saffron text-xs font-medium text-slate-950 hover:bg-amber-600"
                              onClick={() => onSubmitRenewal(r)}
                              data-testid={`submit-renewal-btn-${r.id}`}
                            >
                              Submit Report
                            </Button>
                          )}

                        {/* If officer and submitted/under-review, show review button */}
                        {isOfficerOrAdmin &&
                          (r.status === "SUBMITTED" || r.status === "UNDER_REVIEW") &&
                          onReviewRenewal && (
                            <Button
                              size="sm"
                              variant="default"
                              className="h-8 bg-gov-slate text-xs hover:bg-slate-800"
                              onClick={() => onReviewRenewal(r)}
                              data-testid={`review-renewal-btn-${r.id}`}
                            >
                              Review Cycle
                            </Button>
                          )}

                        <Link href={`/post-selection/${r.postSelectionRecordId}`}>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 px-2 text-xs"
                            data-testid={`renewal-detail-link-${r.id}`}
                          >
                            <ChevronRight className="h-4 w-4 text-slate-500" />
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
