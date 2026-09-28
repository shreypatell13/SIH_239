"use client";

import React, { useState } from "react";
import { OfficerCaseDetailDTO } from "@/server/domain/officer/types";
import { OfficerDeficiencyDTO } from "@/server/domain/deficiency/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  RotateCw,
  PlusCircle,
  MessageSquare,
  FileCheck,
  Ban,
  ShieldCheck,
} from "lucide-react";

interface DeficienciesTabProps {
  data: OfficerCaseDetailDTO;
  onDeficiencyUpdated?: () => void;
  onIssueNewDeficiency?: () => void;
}

export function DeficienciesTab({
  data,
  onDeficiencyUpdated,
  onIssueNewDeficiency,
}: DeficienciesTabProps) {
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolutionRemark, setResolutionRemark] = useState("");
  const [actionType, setActionType] = useState<"RESOLVED" | "WAIVED">("RESOLVED");
  const [submitting, setSubmitting] = useState(false);
  const [recheckingId, setRecheckingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { deficiencies, caseDossier } = data;

  const handleResolveOrWaive = async (deficiencyId: string) => {
    if (!resolutionRemark || resolutionRemark.trim().length < 5) {
      setErrorMsg("A justification remark of at least 5 characters is required.");
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/officer/deficiencies/${deficiencyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: actionType,
          resolutionRemark: resolutionRemark.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to update deficiency status.");
      }

      setResolvingId(null);
      setResolutionRemark("");
      if (onDeficiencyUpdated) onDeficiencyUpdated();
    } catch (err) {
      setErrorMsg((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecheck = async (deficiencyId: string) => {
    setRecheckingId(deficiencyId);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/officer/deficiencies/${deficiencyId}/recheck`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to execute targeted recheck.");
      }
      if (onDeficiencyUpdated) onDeficiencyUpdated();
    } catch (err) {
      setErrorMsg((err as Error).message);
    } finally {
      setRecheckingId(null);
    }
  };

  const openCount = deficiencies.filter((d) => d.status === "OPEN").length;
  const resolvedCount = deficiencies.filter(
    (d) => d.status === "RESOLVED" || d.status === "WAIVED"
  ).length;

  return (
    <div className="space-y-4" data-testid="deficiencies-tab">
      {/* 1. Header with Stats & Issue Trigger */}
      <div className="flex items-center justify-between rounded border border-slate-200 bg-slate-50 p-3 text-xs">
        <div className="flex items-center gap-3">
          <span>
            Open: <strong className="font-bold text-rose-600">{openCount}</strong>
          </span>
          <span>
            Resolved / Waived:{" "}
            <strong className="font-bold text-emerald-600">{resolvedCount}</strong>
          </span>
        </div>
        {onIssueNewDeficiency && (
          <Button
            size="sm"
            variant="default"
            onClick={onIssueNewDeficiency}
            className="gap-1.5 bg-gov-slate text-xs hover:bg-slate-800"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            Issue Structured Deficiency
          </Button>
        )}
      </div>

      {errorMsg && (
        <div className="rounded border border-rose-200 bg-rose-50 p-2 text-xs text-rose-700">
          {errorMsg}
        </div>
      )}

      {/* 2. Deficiencies List */}
      <div className="space-y-3">
        {deficiencies.length === 0 ? (
          <Card className="border-slate-200 p-6 text-center text-xs italic text-slate-500 shadow-none">
            No deficiencies recorded on this case.
          </Card>
        ) : (
          deficiencies.map((def) => {
            const isOpen = def.status === "OPEN";

            return (
              <Card
                key={def.id}
                className={`border-slate-200 shadow-none transition-colors ${
                  isOpen ? "border-amber-300 bg-amber-50/20" : "bg-white"
                }`}
              >
                <CardContent className="space-y-3 p-4 text-xs">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{def.title}</span>
                        <Badge variant="outline" className="text-[10px]">
                          {def.deficiencyType.replace(/_/g, " ")}
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-[11px] text-slate-500">{def.description}</p>
                    </div>

                    <Badge
                      variant={
                        def.status === "OPEN"
                          ? "destructive"
                          : def.status === "RESOLVED"
                            ? "success"
                            : "secondary"
                      }
                      className="text-xs"
                    >
                      {def.status}
                    </Badge>
                  </div>

                  {/* Plain-English Remedy */}
                  <div className="rounded border border-slate-100 bg-slate-50 p-2 text-[11px] text-slate-600">
                    <span className="block font-semibold text-slate-800">Remedy Action:</span>
                    <span>
                      {def.remedyAction.replace(/_/g, " ")} &mdash; {def.description}
                    </span>
                  </div>

                  {/* Applicant Response Text if available */}
                  {def.applicantResponseText && (
                    <div className="space-y-1 rounded border border-blue-200 bg-blue-50/80 p-2.5 text-[11px] text-blue-900">
                      <div className="flex items-center gap-1.5 font-bold text-blue-800">
                        <MessageSquare className="h-3.5 w-3.5" />
                        Applicant Clarification Submitted:
                      </div>
                      <p className="italic">&ldquo;{def.applicantResponseText}&rdquo;</p>
                      {def.applicantRespondedAt && (
                        <span className="block text-[10px] text-blue-600">
                          Responded on: {new Date(def.applicantRespondedAt).toLocaleString("en-IN")}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Resolution & Recheck Status */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2 text-[11px]">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">Deadline:</span>
                      <span className="font-medium text-slate-700">
                        {new Date(def.responseDeadline).toLocaleDateString("en-IN")}
                      </span>
                      {def.recheckStatus && (
                        <Badge
                          variant="outline"
                          className="border-indigo-200 bg-indigo-50 text-[10px] text-indigo-700"
                        >
                          {def.recheckStatus.replace(/_/g, " ")}
                        </Badge>
                      )}
                    </div>

                    {/* Officer Action Buttons */}
                    {isOpen && (
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRecheck(def.id)}
                          disabled={recheckingId === def.id}
                          className="h-7 gap-1 text-xs"
                        >
                          {recheckingId === def.id ? (
                            <RotateCw className="h-3 w-3 animate-spin" />
                          ) : (
                            <RotateCw className="h-3 w-3" />
                          )}
                          Recheck
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setResolvingId(def.id);
                            setActionType("RESOLVED");
                          }}
                          className="h-7 gap-1 text-xs"
                        >
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                          Resolve
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setResolvingId(def.id);
                            setActionType("WAIVED");
                          }}
                          className="h-7 text-xs text-slate-500"
                        >
                          Waive
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Inline Resolution Modal / Box */}
                  {resolvingId === def.id && (
                    <div className="mt-2 space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">
                          {actionType === "RESOLVED" ? "Resolve Deficiency" : "Waive Deficiency"}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setResolvingId(null)}
                          className="h-6 text-[10px]"
                        >
                          Cancel
                        </Button>
                      </div>
                      <textarea
                        rows={2}
                        placeholder="Enter mandatory justification remark (e.g. Verified via e-District portal)..."
                        value={resolutionRemark}
                        onChange={(e) => setResolutionRemark(e.target.value)}
                        className="w-full rounded border border-slate-300 bg-white p-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-gov-slate"
                      />
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleResolveOrWaive(def.id)}
                          disabled={submitting}
                          className="text-xs"
                        >
                          {submitting ? "Submitting..." : `Confirm ${actionType}`}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
