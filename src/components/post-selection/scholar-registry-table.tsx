"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Eye, Filter, ArrowUpDown, ChevronRight, GraduationCap } from "lucide-react";
import { ScholarSummaryDTO } from "@/server/domain/post-selection/types";

interface ScholarRegistryTableProps {
  scholars: ScholarSummaryDTO[];
  isLoading: boolean;
  total: number;
  onFilterChange: (filters: {
    search?: string;
    schemeCode?: string;
    scholarStatus?: string;
  }) => void;
}

export function ScholarRegistryTable({
  scholars,
  isLoading,
  total,
  onFilterChange,
}: ScholarRegistryTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedScheme, setSelectedScheme] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFilterChange({
      search: searchTerm || undefined,
      schemeCode: selectedScheme || undefined,
      scholarStatus: selectedStatus || undefined,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <Badge className="border-emerald-200 bg-emerald-100 text-emerald-800">Active</Badge>;
      case "RENEWAL_DUE":
        return <Badge className="border-amber-200 bg-amber-100 text-amber-800">Renewal Due</Badge>;
      case "ON_HOLD":
        return <Badge className="border-rose-200 bg-rose-100 text-rose-800">On Hold</Badge>;
      case "COMPLETED":
        return <Badge className="border-blue-200 bg-blue-100 text-blue-800">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getDisbursementBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
      case "PAID":
        return (
          <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">Disbursed</Badge>
        );
      case "ONGOING":
      case "FIRST_INSTALLMENT":
        return <Badge className="border-teal-200 bg-teal-50 text-teal-700">Ongoing</Badge>;
      case "PENDING":
        return <Badge className="border-slate-200 bg-slate-100 text-slate-700">Pending</Badge>;
      case "SUSPENDED":
        return <Badge className="border-rose-200 bg-rose-50 text-rose-700">Held</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-3 md:flex-row md:items-center md:justify-between">
        <form onSubmit={handleSearchSubmit} className="flex flex-1 items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search scholar name, case #, university..."
              className="pl-9 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              data-testid="scholar-search-input"
            />
          </div>
          <Button
            type="submit"
            size="sm"
            variant="default"
            className="bg-gov-slate hover:bg-slate-800"
          >
            Search
          </Button>
        </form>

        <div className="flex items-center gap-2">
          <select
            className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700"
            value={selectedScheme}
            onChange={(e) => {
              setSelectedScheme(e.target.value);
              onFilterChange({
                search: searchTerm || undefined,
                schemeCode: e.target.value || undefined,
                scholarStatus: selectedStatus || undefined,
              });
            }}
            data-testid="scholar-scheme-filter"
          >
            <option value="">All Schemes</option>
            <option value="NFST">NFST (National Fellowship)</option>
            <option value="NOS">NOS (National Overseas)</option>
          </select>

          <select
            className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700"
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              onFilterChange({
                search: searchTerm || undefined,
                schemeCode: selectedScheme || undefined,
                scholarStatus: e.target.value || undefined,
              });
            }}
            data-testid="scholar-status-filter"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="RENEWAL_DUE">Renewal Due</option>
            <option value="ON_HOLD">On Hold</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>
      </div>

      {/* Scholars Table */}
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm" data-testid="scholar-registry-table">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-600">
              <tr>
                <th className="px-4 py-3">Scholar &amp; Case</th>
                <th className="px-4 py-3">Scheme</th>
                <th className="px-4 py-3">Tenure &amp; Institution</th>
                <th className="px-4 py-3">Awarded Amount</th>
                <th className="px-4 py-3">Scholar Status</th>
                <th className="px-4 py-3">Disbursement</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-gov-slate border-t-transparent"></div>
                    <p className="mt-2 text-xs">Loading scholar registry...</p>
                  </td>
                </tr>
              ) : scholars.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    <GraduationCap className="mx-auto h-8 w-8 text-slate-300" />
                    <p className="mt-2 font-medium">No scholars found</p>
                    <p className="text-xs text-slate-400">
                      Selected cases will appear here once post-selection records are created.
                    </p>
                  </td>
                </tr>
              ) : (
                scholars.map((scholar) => (
                  <tr
                    key={scholar.id}
                    className="transition-colors hover:bg-slate-50"
                    data-testid={`scholar-row-${scholar.id}`}
                  >
                    <td className="px-4 py-3.5">
                      <div className="font-medium text-slate-900">{scholar.applicantName}</div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <span className="font-mono">{scholar.caseNumber}</span>
                        <span>&bull;</span>
                        <span className="font-mono text-[11px]">{scholar.applicationNumber}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge variant="outline" className="bg-slate-50 font-semibold text-gov-slate">
                        {scholar.schemeCode}
                      </Badge>
                      <div className="mt-0.5 text-[11px] text-slate-500">
                        {scholar.fellowshipType || "Fellow"}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div
                        className="max-w-[200px] truncate text-xs font-medium text-slate-800"
                        title={scholar.researchInstitution || undefined}
                      >
                        {scholar.researchInstitution || "Designated University"}
                      </div>
                      <div className="mt-0.5 text-[11px] text-slate-500">
                        Year {scholar.currentYear} of {scholar.totalTenureYears} &bull;{" "}
                        {new Date(scholar.tenureStartDate).getFullYear()}–
                        {new Date(scholar.tenureEndDate).getFullYear()}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-medium text-slate-900">
                      ₹{scholar.awardedAmount.toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3.5">{getStatusBadge(scholar.scholarStatus)}</td>
                    <td className="px-4 py-3.5">
                      {getDisbursementBadge(scholar.disbursementStatus)}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Link href={`/post-selection/${scholar.id}`}>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 gap-1 border-slate-300 text-xs hover:bg-slate-100"
                          data-testid={`view-scholar-btn-${scholar.id}`}
                        >
                          <span>View Detail</span>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer pagination info */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-500">
          <div>
            Showing <span className="font-medium text-slate-700">{scholars.length}</span> of{" "}
            <span className="font-medium text-slate-700">{total}</span> scholars
          </div>
        </div>
      </div>
    </div>
  );
}
