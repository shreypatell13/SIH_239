"use client";

import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DisbursementDTO } from "@/server/domain/post-selection/types";
import { IndianRupee, Edit3, CheckCircle2, Clock, AlertCircle } from "lucide-react";

interface DisbursementsTableProps {
  disbursements: DisbursementDTO[];
  isLoading: boolean;
  total: number;
  userRole: string;
  onFilterChange: (filters: { status?: string }) => void;
  onUpdateStatus?: (disbursement: DisbursementDTO) => void;
}

export function DisbursementsTable({
  disbursements,
  isLoading,
  total,
  userRole,
  onFilterChange,
  onUpdateStatus,
}: DisbursementsTableProps) {
  const [selectedStatus, setSelectedStatus] = useState("");
  const isOfficerOrAdmin =
    userRole === "VERIFICATION_OFFICER" ||
    userRole === "SCHEME_ADMIN" ||
    userRole === "OPERATIONS_DIRECTOR";

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return (
          <Badge className="border-emerald-200 bg-emerald-100 text-emerald-800">
            Disbursed (Paid)
          </Badge>
        );
      case "PROCESSING":
        return (
          <Badge className="border-indigo-200 bg-indigo-100 text-indigo-800">PFMS Processing</Badge>
        );
      case "PENDING":
        return (
          <Badge className="border-slate-200 bg-slate-100 text-slate-700">
            Pending Authorization
          </Badge>
        );
      case "HELD":
        return (
          <Badge className="border-rose-200 bg-rose-100 text-rose-800">Suspended / Held</Badge>
        );
      case "FAILED":
        return <Badge className="border-red-200 bg-red-100 text-red-800">Credit Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Notice Banner */}
      <div className="flex items-center justify-between rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 shrink-0 text-amber-600" />
          <span>
            <strong>Simulated PFMS Tracking:</strong> Mock disbursement milestones for
            demonstration. Real bank credit settlement uses simulated transaction references.
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase text-slate-500">
            Disbursement Status:
          </span>
          <select
            className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700"
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              onFilterChange({ status: e.target.value || undefined });
            }}
            data-testid="disbursement-status-filter"
          >
            <option value="">All Disbursements</option>
            <option value="PAID">Disbursed (Paid)</option>
            <option value="PROCESSING">Processing</option>
            <option value="PENDING">Pending</option>
            <option value="HELD">Held</option>
          </select>
        </div>

        <div className="text-xs text-slate-500">
          Showing <span className="font-semibold text-slate-700">{disbursements.length}</span>{" "}
          installments
        </div>
      </div>

      {/* Disbursements Table */}
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm" data-testid="disbursements-table">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-600">
              <tr>
                <th className="px-4 py-3">Scholar &amp; Case</th>
                <th className="px-4 py-3">Installment #</th>
                <th className="px-4 py-3">Financial Year</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">PFMS Reference</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-gov-slate border-t-transparent"></div>
                    <p className="mt-2 text-xs">Loading disbursements...</p>
                  </td>
                </tr>
              ) : disbursements.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    <IndianRupee className="mx-auto h-8 w-8 text-slate-300" />
                    <p className="mt-2 font-medium">No disbursement installments found</p>
                  </td>
                </tr>
              ) : (
                disbursements.map((d) => (
                  <tr
                    key={d.id}
                    className="transition-colors hover:bg-slate-50"
                    data-testid={`disbursement-row-${d.id}`}
                  >
                    <td className="px-4 py-3.5">
                      <div className="font-medium text-slate-900">{d.scholarName || "Scholar"}</div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Badge variant="outline" className="py-0 text-[10px]">
                          {d.schemeCode}
                        </Badge>
                        <span>{d.caseNumber}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-medium text-slate-800">
                      Installment {d.installmentNumber}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-700">{d.financialYear}</td>
                    <td className="px-4 py-3.5 font-semibold text-slate-900">
                      ₹{d.amount.toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs text-slate-600">
                      {d.pfmsReference ? (
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-800">
                          {d.pfmsReference}
                        </span>
                      ) : (
                        <span className="text-slate-400">Not assigned</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">{getStatusBadge(d.status)}</td>
                    <td className="px-4 py-3.5 text-right">
                      {isOfficerOrAdmin && onUpdateStatus && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 gap-1 border-slate-300 text-xs hover:bg-slate-100"
                          onClick={() => onUpdateStatus(d)}
                          data-testid={`update-disbursement-btn-${d.id}`}
                        >
                          <Edit3 className="h-3.5 w-3.5 text-slate-600" />
                          <span>Update Status</span>
                        </Button>
                      )}
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
