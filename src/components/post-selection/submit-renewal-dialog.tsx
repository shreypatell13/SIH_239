"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RenewalDTO } from "@/server/domain/post-selection/types";
import { X, Send, AlertCircle } from "lucide-react";

interface SubmitRenewalDialogProps {
  renewal: RenewalDTO | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function SubmitRenewalDialog({
  renewal,
  isOpen,
  onClose,
  onSuccess,
}: SubmitRenewalDialogProps) {
  const [progressSummary, setProgressSummary] = useState(renewal?.progressSummary || "");
  const [publicationsCount, setPublicationsCount] = useState<number>(
    renewal?.publicationsCount || 0
  );
  const [conferencesAttended, setConferencesAttended] = useState<number>(
    renewal?.conferencesAttended || 0
  );
  const [supervisorRecommendation, setSupervisorRecommendation] = useState<string>(
    renewal?.supervisorRecommendation || "RECOMMENDED"
  );
  const [supervisorRemarks, setSupervisorRemarks] = useState(renewal?.supervisorRemarks || "");
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
          progressSummary,
          publicationsCount: Number(publicationsCount),
          conferencesAttended: Number(conferencesAttended),
          supervisorRecommendation,
          supervisorRemarks: supervisorRemarks || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to submit renewal request.");
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
        data-testid="submit-renewal-modal"
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Submit Annual Progress Report (Year {renewal.renewalCycle})
            </h3>
            <p className="text-xs text-slate-500">Academic Year: {renewal.academicYear}</p>
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
            <Label className="text-xs font-semibold text-slate-700">
              Annual Research / Academic Progress Summary *
            </Label>
            <Textarea
              required
              rows={4}
              placeholder="Describe research work completed, milestones achieved, thesis chapters drafted..."
              className="mt-1 text-xs"
              value={progressSummary}
              onChange={(e) => setProgressSummary(e.target.value)}
              data-testid="progress-summary-input"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold text-slate-700">Publications Published</Label>
              <Input
                type="number"
                min={0}
                className="mt-1 text-xs"
                value={publicationsCount}
                onChange={(e) => setPublicationsCount(Number(e.target.value))}
                data-testid="publications-count-input"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-700">Conferences Attended</Label>
              <Input
                type="number"
                min={0}
                className="mt-1 text-xs"
                value={conferencesAttended}
                onChange={(e) => setConferencesAttended(Number(e.target.value))}
                data-testid="conferences-count-input"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs font-semibold text-slate-700">
              Supervisor Recommendation *
            </Label>
            <select
              className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800"
              value={supervisorRecommendation}
              onChange={(e) => setSupervisorRecommendation(e.target.value)}
              data-testid="supervisor-recommendation-select"
            >
              <option value="RECOMMENDED">Recommended for Fellowship Renewal</option>
              <option value="CONDITIONAL">Conditional Continuation</option>
              <option value="NOT_RECOMMENDED">Not Recommended</option>
            </select>
          </div>

          <div>
            <Label className="text-xs font-semibold text-slate-700">
              Supervisor Remarks / Endorsement
            </Label>
            <Input
              placeholder="e.g., Progress satisfactory as per research milestones."
              className="mt-1 text-xs"
              value={supervisorRemarks}
              onChange={(e) => setSupervisorRemarks(e.target.value)}
              data-testid="supervisor-remarks-input"
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
              className="gap-1.5 bg-gov-slate hover:bg-slate-800"
              disabled={isSubmitting}
              data-testid="confirm-submit-renewal-btn"
            >
              <Send className="h-3.5 w-3.5" />
              <span>{isSubmitting ? "Submitting..." : "Submit Progress Report"}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
