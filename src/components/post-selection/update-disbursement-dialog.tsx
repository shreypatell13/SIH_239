"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DisbursementDTO } from "@/server/domain/post-selection/types";
import { X, IndianRupee, AlertCircle } from "lucide-react";

interface UpdateDisbursementDialogProps {
  disbursement: DisbursementDTO | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function UpdateDisbursementDialog({
  disbursement,
  isOpen,
  onClose,
  onSuccess,
}: UpdateDisbursementDialogProps) {
  const [status, setStatus] = useState<string>(disbursement?.status || "PAID");
  const [pfmsReference, setPfmsReference] = useState(disbursement?.pfmsReference || "");
  const [remarks, setRemarks] = useState(disbursement?.remarks || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  if (!isOpen || !disbursement) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const res = await fetch(`/api/post-selection/disbursements/${disbursement.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          pfmsReference: pfmsReference || undefined,
          remarks: remarks || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to update disbursement status.");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || "An error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div
        className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl"
        data-testid="update-disbursement-modal"
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">Update Disbursement Status</h3>
            <p className="text-xs text-slate-500">
              Installment {disbursement.installmentNumber} &bull; ₹
              {disbursement.amount.toLocaleString("en-IN")}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="mt-3 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <Label className="text-xs font-semibold text-slate-700">Disbursement Status *</Label>
            <select
              className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              data-testid="disbursement-status-select"
            >
              <option value="PAID">Paid / Disbursed (Direct Credit)</option>
              <option value="PROCESSING">PFMS Bank Transmission In-Progress</option>
              <option value="PENDING">Pending Administrative Sanction</option>
              <option value="HELD">Suspended / Held on Academic Hold</option>
              <option value="FAILED">Bank Credit Failed</option>
            </select>
          </div>

          <div>
            <Label className="text-xs font-semibold text-slate-700">
              PFMS Batch / Transaction Ref (Synthetic)
            </Label>
            <Input
              placeholder="e.g. PFMS-2026-NOS-009182"
              className="mt-1 font-mono text-xs"
              value={pfmsReference}
              onChange={(e) => setPfmsReference(e.target.value)}
              data-testid="pfms-reference-input"
            />
            <p className="mt-1 text-[11px] text-slate-400">
              Leave blank to auto-generate a valid demonstration PFMS batch code.
            </p>
          </div>

          <div>
            <Label className="text-xs font-semibold text-slate-700">Internal Audit Remarks</Label>
            <Input
              placeholder="e.g. Approved via sanction order #MoTA/NOS/2026/89"
              className="mt-1 text-xs"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              data-testid="disbursement-remarks-input"
            />
          </div>

          <div className="mt-6 flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="bg-gov-slate hover:bg-slate-800"
              disabled={isSubmitting}
              data-testid="confirm-update-disbursement-btn"
            >
              {isSubmitting ? "Updating..." : "Update Installment"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
