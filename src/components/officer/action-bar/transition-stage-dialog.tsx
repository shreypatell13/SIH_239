"use client";

import React, { useState } from "react";
import { CaseStage } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, AlertTriangle, ShieldCheck, X } from "lucide-react";

interface TransitionStageDialogProps {
  caseId: string;
  currentStage: CaseStage;
  hasOpenDeficiencies: boolean;
  isOpen: boolean;
  onClose: () => void;
  onTransitionCompleted: () => void;
}

export function TransitionStageDialog({
  caseId,
  currentStage,
  hasOpenDeficiencies,
  isOpen,
  onClose,
  onTransitionCompleted,
}: TransitionStageDialogProps) {
  const [targetStage, setTargetStage] = useState<CaseStage>(
    hasOpenDeficiencies ? CaseStage.DEFICIENCY_PENDING : CaseStage.COMMITTEE_SELECTION
  );
  const [remark, setRemark] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleTransition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (remark.trim().length < 5) {
      setError("A justification remark of at least 5 characters is required.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/officer/cases/${caseId}/transition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetStage,
          remark: remark.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to advance case stage.");
      }

      onTransitionCompleted();
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg space-y-4 rounded-lg bg-white p-5 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <ArrowRight className="h-4 w-4 text-gov-slate" />
            <h3 className="text-sm font-bold text-slate-900">Advance Case Workflow Stage</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="rounded border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-700">
            {error}
          </div>
        )}

        <form onSubmit={handleTransition} className="space-y-4 text-xs">
          <div>
            <span className="mb-1 block font-semibold text-slate-700">Target Workflow Stage:</span>
            <div className="space-y-2">
              <label
                className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                  targetStage === CaseStage.COMMITTEE_SELECTION
                    ? "border-emerald-500 bg-emerald-50/30"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                <input
                  type="radio"
                  name="targetStage"
                  value={CaseStage.COMMITTEE_SELECTION}
                  checked={targetStage === CaseStage.COMMITTEE_SELECTION}
                  onChange={() => setTargetStage(CaseStage.COMMITTEE_SELECTION)}
                  className="mt-0.5"
                  disabled={hasOpenDeficiencies}
                />
                <div>
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <span>Recommend for Committee Selection</span>
                    {hasOpenDeficiencies && (
                      <Badge variant="destructive" className="text-[10px]">
                        Blocked: Open Deficiencies
                      </Badge>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Verification complete. Pushes case dossier to Selection Committee for quota
                    &amp; merit scoring.
                  </p>
                </div>
              </label>

              <label
                className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                  targetStage === CaseStage.DEFICIENCY_PENDING
                    ? "border-amber-500 bg-amber-50/30"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                <input
                  type="radio"
                  name="targetStage"
                  value={CaseStage.DEFICIENCY_PENDING}
                  checked={targetStage === CaseStage.DEFICIENCY_PENDING}
                  onChange={() => setTargetStage(CaseStage.DEFICIENCY_PENDING)}
                  className="mt-0.5"
                />
                <div>
                  <div className="font-bold text-slate-900">
                    Deficiency Pending (Action Required)
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Places case on hold and requests candidate remediation/replacement document.
                  </p>
                </div>
              </label>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">
              Officer Justification Remark (Mandatory for Audit Trail)
            </label>
            <textarea
              rows={3}
              placeholder="e.g. All documents verified against state portals. Deterministic eligibility satisfied without discrepancies."
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              className="w-full rounded-md border border-slate-300 p-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-gov-slate focus:outline-none focus:ring-1 focus:ring-gov-slate"
            />
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" variant="default" size="sm" disabled={submitting}>
              {submitting ? "Transitioning..." : "Confirm Stage Transition"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
