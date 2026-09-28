"use client";

import React, { useState, useEffect } from "react";
import { ExplainableCaseStatusDTO } from "@/server/domain/application/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FileText,
  UserCheck,
  AlertCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  Ban,
  Loader2,
  Calendar,
  Layers,
} from "lucide-react";
import Link from "next/link";

interface ExplainableCaseStatusProps {
  applicationId: string;
}

export function ExplainableCaseStatus({ applicationId }: ExplainableCaseStatusProps) {
  const [status, setStatus] = useState<ExplainableCaseStatusDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [showWithdrawConfirm, setShowWithdrawConfirm] = useState(false);
  const [withdrawReason, setWithdrawReason] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchStatus = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/applicant/applications/${applicationId}/status`);
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to load case status");
      }
      setStatus(json.data);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Error loading status");
    } finally {
      setIsLoading(false);
    }
  }, [applicationId]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleWithdraw = async () => {
    if (isWithdrawing) return;
    setIsWithdrawing(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/applicant/applications/${applicationId}/withdraw`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: withdrawReason || undefined }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Withdrawal failed");
      }

      setStatus(json.data);
      setShowWithdrawConfirm(false);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Error withdrawing application");
    } finally {
      setIsWithdrawing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-slate-200 bg-white p-8">
        <div className="flex flex-col items-center gap-2 text-slate-500">
          <Loader2 className="h-8 w-8 animate-spin text-gov-navy" />
          <span className="text-sm font-medium">Loading live case status...</span>
        </div>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="rounded-lg border border-rose-200 bg-rose-50 p-6 text-sm text-rose-800">
        {errorMsg || "Unable to fetch case status."}
      </div>
    );
  }

  const isWithdrawalAllowed =
    status.status === "SUBMITTED" && (status.stage === "DRAFT" || status.stage === "SUBMITTED");

  return (
    <div className="space-y-6" data-testid="explainable-case-status">
      {/* Header Summary */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-2xl font-bold text-slate-900">{status.schemeName}</h2>
              <Badge variant="outline" className="font-mono text-xs">
                {status.schemeCode}
              </Badge>
              <Badge
                variant={
                  status.status === "SUBMITTED"
                    ? "success"
                    : status.status === "DRAFT"
                      ? "warning"
                      : "destructive"
                }
              >
                {status.status}
              </Badge>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Application No:{" "}
              <span className="font-mono font-medium text-slate-700">
                {status.applicationNumber}
              </span>{" "}
              &bull; Case Dossier No:{" "}
              <span className="font-mono font-medium text-slate-700">{status.caseNumber}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/applicant">
              <Button variant="outline" size="sm" className="text-xs">
                Back to Dashboard
              </Button>
            </Link>

            {isWithdrawalAllowed && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowWithdrawConfirm(true)}
                className="flex items-center gap-1 text-xs"
              >
                <Ban className="h-3.5 w-3.5" />
                Withdraw Application
              </Button>
            )}
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="rounded-md border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          {errorMsg}
        </div>
      )}

      {/* 5-Component Explainable Status Card */}
      <Card className="border-gov-navy/20 bg-gradient-to-br from-white to-slate-50/50 shadow-md">
        <CardHeader className="border-b border-slate-100 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-gov-navy" />
              <CardTitle className="text-lg text-slate-900">Explainable Case Status</CardTitle>
            </div>
            <Badge variant="outline" className="bg-slate-100 text-xs">
              Transparent Lifecycle
            </Badge>
          </div>
          <CardDescription className="text-xs text-slate-500">
            Standard: No opaque decisions. Complete visibility into current stage, responsible
            actor, and next remedies.
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* 1. Stage */}
            <div className="shadow-xs flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-700">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  1. Current Stage
                </span>
                <p className="text-base font-bold text-slate-900">{status.stageLabel}</p>
                <p className="mt-0.5 text-xs text-slate-500">Stage Key: {status.stage}</p>
              </div>
            </div>

            {/* 2. State */}
            <div className="shadow-xs flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-amber-50 text-amber-700">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  2. Lifecycle State
                </span>
                <p className="text-base font-bold text-slate-900">{status.stateLabel}</p>
                <p className="mt-0.5 text-xs text-slate-500">State: {status.state}</p>
              </div>
            </div>

            {/* 3. Blocker */}
            <div className="shadow-xs flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-rose-50 text-rose-700">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  3. Active Blocker
                </span>
                <p className="text-sm font-semibold text-slate-800">
                  {status.blocker ? status.blocker : "None (Workflow is proceeding normally)"}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {status.blocker ? "Requires candidate attention" : "No obstacles identified"}
                </p>
              </div>
            </div>

            {/* 4. Responsible Actor */}
            <div className="shadow-xs flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-purple-50 text-purple-700">
                <UserCheck className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  4. Responsible Actor
                </span>
                <p className="text-base font-bold text-slate-900">{status.responsibleActorLabel}</p>
                <p className="mt-0.5 text-xs text-slate-500">Actor: {status.responsibleActor}</p>
              </div>
            </div>

            {/* 5. Next Action (Full Width) */}
            <div className="shadow-xs flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50/40 p-4 md:col-span-2">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-emerald-100 text-emerald-800">
                <ArrowRight className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-800">
                  5. Next Concrete Action
                </span>
                <p className="text-base font-bold text-slate-900">{status.nextAction}</p>
                {status.deadline && (
                  <p className="mt-1 flex items-center gap-1 text-xs font-medium text-slate-600">
                    <Calendar className="h-3.5 w-3.5 text-slate-500" />
                    Target Response Deadline: {new Date(status.deadline).toLocaleString("en-IN")}
                  </p>
                )}
                {(status.blocker ||
                  status.stage === "DEFICIENCY_PENDING" ||
                  status.state === "ACTION_REQUIRED") && (
                  <div className="mt-3">
                    <Link href={`/applicant/applications/${applicationId}/deficiencies`}>
                      <Button
                        size="sm"
                        className="gap-1.5 bg-amber-600 text-xs text-white hover:bg-amber-700"
                      >
                        <AlertCircle className="h-3.5 w-3.5" />
                        View &amp; Resolve Deficiencies
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Withdrawal Confirmation Dialog */}
      {showWithdrawConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md space-y-4 rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center gap-2 text-rose-600">
              <AlertCircle className="h-6 w-6" />
              <h3 className="text-lg font-bold text-slate-900">Confirm Withdrawal</h3>
            </div>
            <p className="text-sm text-slate-600">
              Are you sure you want to withdraw application{" "}
              <strong>{status.applicationNumber}</strong>? This action is permanent and will stop
              all automated verification.
            </p>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Reason for withdrawal (Optional):
              </label>
              <textarea
                value={withdrawReason}
                onChange={(e) => setWithdrawReason(e.target.value)}
                placeholder="e.g., Selected for alternative fellowship..."
                className="w-full rounded-md border border-slate-300 p-2 text-xs"
                rows={3}
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowWithdrawConfirm(false)}
                disabled={isWithdrawing}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleWithdraw}
                disabled={isWithdrawing}
              >
                {isWithdrawing ? "Withdrawing..." : "Confirm Withdrawal"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
