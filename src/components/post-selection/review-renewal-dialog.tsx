"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { RenewalDTO } from "@/server/domain/post-selection/types";
import { X, CheckCircle2, AlertTriangle, XCircle, AlertCircle } from "lucide-react";

interface ReviewRenewalDialogProps {
  renewal: RenewalDTO | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ReviewRenewalDialog({
  renewal,
  isOpen,
  onClose,
  onSuccess,
}: ReviewRenewalDialogProps) {
  const [action, setAction] = useState<"APPROVE" | "REQUEST_DEFICIENCY" | "REJECT">("APPROVE");
  const [officerRemarks, setOfficerRemarks] = useState("");
  const [deficiencyDetails, setDeficiencyDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  if (!isOpen || !renewal) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const res = await fetch(`/api/post-selection/renewals/${renewal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          officerRemarks,
          deficiencyDetails: action === "REQUEST_DEFICIENCY" ? deficiencyDetails : undefined,
          recheckRequired: action === "REQUEST_DEFICIENCY",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to record renewal review.");
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
        className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl"
        data-testid="review-renewal-modal"
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Officer Review: Year {renewal.renewalCycle} Renewal Cycle
            </h3>
            <p className="text-xs text-slate-500">
              Scholar: <span className="font-semibold text-slate-700">{renewal.scholarName}</span> (
              {renewal.schemeCode} - {renewal.academicYear})
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

        {/* Scholar Progress Summary Callout */}
        <div className="mt-3 space-y-1.5 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-700">Submitted Progress Report:</span>
            <Badge variant="outline" className="bg-white text-[10px]">
              {renewal.publicationsCount} Pubs / {renewal.conferencesAttended} Confs
            </Badge>
          </div>
          <p className="italic text-slate-600">
            &ldquo;{renewal.progressSummary || "No detailed progress narrative provided."}&rdquo;
          </p>
          <div className="flex gap-2 text-[11px] text-slate-500">
            <span>
              Supervisor Endorsement:{" "}
              <strong>{renewal.supervisorRecommendation || "RECOMMENDED"}</strong>
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <Label className="text-xs font-semibold text-slate-700">Decision Action *</Label>
            <div className="mt-1.5 grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setAction("APPROVE")}
                className={`flex items-center justify-center gap-1.5 rounded-lg border p-2.5 text-xs font-semibold transition-all ${
                  action === "APPROVE"
                    ? "border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
                data-testid="decision-approve-btn"
              >
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Approve</span>
              </button>

              <button
                type="button"
                onClick={() => setAction("REQUEST_DEFICIENCY")}
                className={`flex items-center justify-center gap-1.5 rounded-lg border p-2.5 text-xs font-semibold transition-all ${
                  action === "REQUEST_DEFICIENCY"
                    ? "border-amber-600 bg-amber-50 text-amber-800 ring-2 ring-amber-500/20"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
                data-testid="decision-deficiency-btn"
              >
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <span>Deficiency</span>
              </button>

              <button
                type="button"
                onClick={() => setAction("REJECT")}
                className={`flex items-center justify-center gap-1.5 rounded-lg border p-2.5 text-xs font-semibold transition-all ${
                  action === "REJECT"
                    ? "border-rose-600 bg-rose-50 text-rose-800 ring-2 ring-rose-500/20"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
                data-testid="decision-reject-btn"
              >
                <XCircle className="h-4 w-4 text-rose-600" />
                <span>Reject</span>
              </button>
            </div>
          </div>

          <div>
            <Label className="text-xs font-semibold text-slate-700">
              Official Review Remarks *
            </Label>
            <Textarea
              required
              rows={3}
              placeholder="Record authoritative verification findings and justification for audit log..."
              className="mt-1 text-xs"
              value={officerRemarks}
              onChange={(e) => setOfficerRemarks(e.target.value)}
              data-testid="officer-remarks-input"
            />
          </div>

          {action === "REQUEST_DEFICIENCY" && (
            <div>
              <Label className="text-xs font-semibold text-amber-800">
                Deficiency Details &amp; Resolution Instructions *
              </Label>
              <Textarea
                required
                rows={2}
                placeholder="Specify what document or explanation is required from the scholar to resolve..."
                className="mt-1 border-amber-300 text-xs"
                value={deficiencyDetails}
                onChange={(e) => setDeficiencyDetails(e.target.value)}
                data-testid="deficiency-details-input"
              />
            </div>
          )}

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
              data-testid="confirm-review-renewal-btn"
            >
              {isSubmitting ? "Recording..." : "Record Official Decision"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
