"use client";

import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DrillDownCaseDTO, PaginatedDrillDownCasesDTO } from "@/server/domain/operations/types";
import { DrillDownCasesQuery } from "@/server/domain/operations/validators";
import {
  Search,
  Clock,
  User,
  AlertCircle,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";

interface DrillDownCaseDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle: string;
  query: DrillDownCasesQuery;
}

export function DrillDownCaseDrawer({
  isOpen,
  onClose,
  title,
  subtitle,
  query,
}: DrillDownCaseDrawerProps) {
  const [data, setData] = useState<PaginatedDrillDownCasesDTO | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    async function fetchCases() {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (query.schemeCode && query.schemeCode !== "ALL")
          params.set("schemeCode", query.schemeCode);
        if (query.stage) params.set("stage", query.stage);
        if (query.state) params.set("state", query.state);
        if (query.agingBucket) params.set("agingBucket", query.agingBucket);
        if (query.deficiencyType) params.set("deficiencyType", query.deficiencyType);
        if (query.documentType) params.set("documentType", query.documentType);
        if (query.unassignedOnly) params.set("unassignedOnly", "true");
        if (query.blockedOnly) params.set("blockedOnly", "true");
        if (query.assignedOfficerId) params.set("assignedOfficerId", query.assignedOfficerId);
        if (query.hasOpenDeficienciesOnly) params.set("hasOpenDeficienciesOnly", "true");
        if (query.officerAttentionOnly) params.set("officerAttentionOnly", "true");
        if (query.completedOnly) params.set("completedOnly", "true");
        if (query.underVerificationOnly) params.set("underVerificationOnly", "true");
        if (searchTerm) params.set("search", searchTerm);
        params.set("page", page.toString());
        params.set("limit", "10");

        const res = await fetch(`/api/operations/cases?${params.toString()}`);
        if (res.ok) {
          const json = await res.json();
          if (isMounted) {
            setData(json.data);
          }
        }
      } catch (err) {
        console.error("Failed to fetch drilldown cases", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchCases();
    return () => {
      isMounted = false;
    };
  }, [isOpen, query, searchTerm, page]);

  if (!isOpen) return null;

  return (
    <div className="backdrop-blur-xs animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 duration-200">
      <div
        className="flex max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl"
        data-testid="drill-down-case-drawer"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 bg-slate-50/80 p-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900" data-testid="drill-down-title">
                {title}
              </h2>
              {data && (
                <Badge variant="outline" className="text-xs font-bold text-gov-slate">
                  {data.total} Matching {data.total === 1 ? "Case" : "Cases"}
                </Badge>
              )}
            </div>
            <p className="text-xs text-slate-500">{subtitle}</p>

            {/* Search input */}
            <div className="relative mt-2 w-80">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search case or application number..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-md border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-xs placeholder:text-slate-400 focus:border-gov-slate focus:outline-none"
                data-testid="drill-down-search-input"
              />
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            data-testid="close-drilldown-drawer-btn"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Case List Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-12 text-slate-400">
              <Loader2 className="mb-2 h-6 w-6 animate-spin text-gov-saffron" />
              <span className="text-xs">Loading matching case dossiers...</span>
            </div>
          ) : !data || data.cases.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center text-slate-400">
              <AlertCircle className="mb-2 h-8 w-8 text-slate-300" />
              <span className="text-sm font-semibold text-slate-700">No Cases Match Criteria</span>
              <span className="mt-1 text-xs text-slate-400">
                Try adjusting the search query or active filters.
              </span>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-200">
              {data.cases.map((c) => (
                <div
                  key={c.id}
                  className="flex flex-col gap-3 bg-white p-4 transition-colors hover:bg-slate-50/80 sm:flex-row sm:items-center sm:justify-between"
                  data-testid={`drilldown-case-${c.id}`}
                >
                  <div className="space-y-1 sm:w-2/3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">{c.caseNumber}</span>
                      <Badge variant="outline" className="text-[10px] text-slate-600">
                        {c.schemeCode}
                      </Badge>
                      <Badge
                        variant="secondary"
                        className="bg-slate-100 text-[10px] font-semibold text-slate-700"
                      >
                        {c.currentStage.replace(/_/g, " ")}
                      </Badge>
                      {c.openDeficienciesCount > 0 && (
                        <Badge variant="destructive" className="px-1.5 py-0 text-[9px] font-bold">
                          {c.openDeficienciesCount} Def
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-600">
                      <span className="text-slate-500">App: {c.applicationNumber}</span>
                      <Badge variant="outline">{c.currentState.replace(/_/g, " ")}</Badge>
                    </div>

                    <div className="flex items-center gap-2 pt-0.5 text-[11px] text-slate-400">
                      <span>
                        Pipeline: <strong>{c.daysInPipeline}d</strong>
                      </span>
                      <span>&bull;</span>
                      <span>
                        Stage Dwell: <strong>{c.daysInCurrentStage}d</strong>
                      </span>
                      {c.officerAssignedName ? (
                        <>
                          <span>&bull;</span>
                          <span>Officer: {c.officerAssignedName}</span>
                        </>
                      ) : (
                        <>
                          <span>&bull;</span>
                          <span className="font-semibold text-rose-600">Unassigned</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-end sm:w-1/3">
                    <span className="text-[11px] text-slate-500">Case-level summary</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer / Pagination */}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-6 py-3 text-xs">
            <span className="text-slate-500">
              Page {data.page} of {data.totalPages} ({data.total} total cases)
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={data.page <= 1 || isLoading}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span>Prev</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2"
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                disabled={data.page >= data.totalPages || isLoading}
              >
                <span>Next</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
